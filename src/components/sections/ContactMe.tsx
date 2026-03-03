import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send, Copy, Check, Linkedin, Instagram, Facebook, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AnimatedSection from "@/components/AnimatedSection";
import { apiFetch } from "@/lib/api";
import { normalizeExternalUrl } from "@/lib/utils";

type SocialLinks = {
  github?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
};

type ContactInfo = {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  social_links: SocialLinks | null;
} | null;

const ContactMe = () => {
  const [contact, setContact] = useState<ContactInfo>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [emailCopied, setEmailCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        const c = await apiFetch<ContactInfo>("/api/public/contact");
        setContact(c);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to load contact info");
        setLoadError(err.message || "Failed to load contact info");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const portfolioEmail = contact?.email || "sandeepbotla2004@gmail.com";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name.trim() || formData.name.trim().length > 100) {
      toast({
        title: "Validation Error",
        description: "Name must be between 1 and 100 characters",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length > 1000) {
      toast({
        title: "Validation Error",
        description: "Message must be between 1 and 1000 characters",
        variant: "destructive",
      });
      return;
    }

    // Create mailto link with encoded values
    const mailtoLink = `mailto:${portfolioEmail}?subject=${encodeURIComponent(
      formData.subject || "Contact from Portfolio"
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;

    window.location.href = mailtoLink;

    toast({
      title: "Opening email client",
      description: "Your default email client will open with the message pre-filled",
    });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(portfolioEmail);
    setEmailCopied(true);
    toast({
      title: "Email copied!",
      description: "Email address copied to clipboard",
    });
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const contactInfo = useMemo(() => {
    return [
      contact?.email ? { icon: Mail, text: contact.email, href: `mailto:${contact.email}` } : null,
      contact?.phone ? { icon: Phone, text: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, "")}` } : null,
      contact?.location ? { icon: MapPin, text: contact.location } : null,
    ].filter(Boolean) as Array<{ icon: typeof Mail; text: string; href?: string }>;
  }, [contact]);

  const socialLinks = useMemo(() => {
    const links: Array<{ icon: typeof Github; href: string; label: string }> = [];
    const s = contact?.social_links || {};

    const linkedinHref = s.linkedin ? normalizeExternalUrl(s.linkedin) : null;
    if (linkedinHref) links.push({ icon: Linkedin, href: linkedinHref, label: "LinkedIn" });

    const instagramHref = s.instagram ? normalizeExternalUrl(s.instagram) : null;
    if (instagramHref) links.push({ icon: Instagram, href: instagramHref, label: "Instagram" });

    const facebookHref = s.facebook ? normalizeExternalUrl(s.facebook) : null;
    if (facebookHref) links.push({ icon: Facebook, href: facebookHref, label: "Facebook" });

    const githubHref = s.github ? normalizeExternalUrl(s.github) : null;
    if (githubHref) links.push({ icon: Github, href: githubHref, label: "GitHub" });
    return links;
  }, [contact]);

  return (
    <section className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Contact Me</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
        </div>
      </AnimatedSection>

      {!loading && loadError && (
        <Card className="glass-card border-primary/20 p-4 text-center">
          <p className="text-muted-foreground">{loadError}</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <AnimatedSection delay={100}>
          <Card className="p-8 glass-card border-primary/20 h-full">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="transition-smooth focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  maxLength={255}
                  className="transition-smooth focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={handleChange}
                  maxLength={200}
                  className="transition-smooth focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  maxLength={1000}
                  rows={6}
                  className="transition-smooth focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/1000 characters
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-smooth neon-glow"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                This will open your default email client with the message pre-filled
              </p>
            </form>
          </Card>
        </AnimatedSection>

        <div className="space-y-6">
          <AnimatedSection delay={200}>
            <Card className="p-8 glass-card border-primary/20">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">Get in Touch</h2>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : contactInfo.length === 0 ? (
                <div className="text-sm text-muted-foreground">Set contact details in Admin → Contact.</div>
              ) : (
                <div className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 neon-glow">
                        <item.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        {item.href ? (
                          <a href={item.href} className="text-foreground hover:text-primary transition-smooth font-medium">
                            {item.text}
                          </a>
                        ) : (
                          <span className="text-foreground font-medium">{item.text}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </Card>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <Card className="p-8 glass-card border-primary/20">
              <h3 className="text-xl font-semibold mb-6 text-center text-foreground">Connect on Social Media</h3>
              <div className="flex justify-center space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-14 h-14 flex items-center justify-center rounded-full glass-card border-primary/20 hover-glow transition-smooth group`}
                  >
                    <social.icon className="w-6 h-6 group-hover:text-primary transition-smooth" />
                  </a>
                ))}
              </div>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <Card className="p-6 glass-card border-primary/20">
              <p className="text-sm text-foreground/70 text-center">
                <span className="font-semibold text-foreground">Availability:</span> Open to internship opportunities,
                collaboration on AI/ML projects, and freelance work. Typically respond within 24 hours.
              </p>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default ContactMe;
