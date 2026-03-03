import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Mail, Phone, MapPin, Linkedin, Github, Instagram, Facebook } from "lucide-react";
import { normalizeExternalUrl } from "@/lib/utils";

interface SocialLinks {
  github?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

interface ContactInfo {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  social_links: unknown;
}

const AdminContact = () => {
  const [content, setContent] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    location: "",
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    github: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    twitter: "",
  });
  const { toast } = useToast();

  const fetchContent = useCallback(async () => {
    try {
      const rows = await apiFetch<ContactInfo[]>("/api/admin/contact_info");
      const data = rows?.[0] ?? null;
      setContent(data);

      if (data) {
        setFormData({
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
        });

        const links = (data.social_links as SocialLinks) || {};
        setSocialLinks({
          github: links.github || "",
          linkedin: links.linkedin || "",
          instagram: links.instagram || "",
          facebook: links.facebook || "",
          twitter: links.twitter || "",
        });
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load contact info");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cleanedSocialLinks: SocialLinks = {};
    const githubHref = normalizeExternalUrl(socialLinks.github || "");
    if (githubHref) cleanedSocialLinks.github = githubHref;
    const linkedinHref = normalizeExternalUrl(socialLinks.linkedin || "");
    if (linkedinHref) cleanedSocialLinks.linkedin = linkedinHref;
    const instagramHref = normalizeExternalUrl(socialLinks.instagram || "");
    if (instagramHref) cleanedSocialLinks.instagram = instagramHref;
    const facebookHref = normalizeExternalUrl(socialLinks.facebook || "");
    if (facebookHref) cleanedSocialLinks.facebook = facebookHref;

    const contactData = {
      email: formData.email || null,
      phone: formData.phone || null,
      location: formData.location || null,
      social_links: cleanedSocialLinks,
    };

    try {
      if (content) {
        await apiFetch(`/api/admin/contact_info/${content.id}`, {
          method: "PUT",
          body: JSON.stringify(contactData),
        });
        toast({ title: "Success", description: "Contact info updated successfully" });
      } else {
        await apiFetch("/api/admin/contact_info", {
          method: "POST",
          body: JSON.stringify(contactData),
        });
        toast({ title: "Success", description: "Contact info created successfully" });
      }
      fetchContent();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contact info...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Manage Contact Info</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 glass-card border-primary/20">
          <h3 className="font-semibold mb-4 text-foreground">Basic Contact</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-9999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State, Country"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card border-primary/20">
          <h3 className="font-semibold mb-4 text-foreground">Social Links</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github className="w-4 h-4" /> GitHub
              </Label>
              <Input
                id="github"
                value={socialLinks.github}
                onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </Label>
              <Input
                id="linkedin"
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="w-4 h-4" /> Instagram
              </Label>
              <Input
                id="instagram"
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                placeholder="https://instagram.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="w-4 h-4" /> Facebook
              </Label>
              <Input
                id="facebook"
                value={socialLinks.facebook}
                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                placeholder="https://facebook.com/username"
              />
            </div>
          </div>
        </Card>

        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default AdminContact;
