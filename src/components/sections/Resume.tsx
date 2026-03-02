import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap, Briefcase, Award, Mail, Phone, MapPin, Eye } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { apiFetch } from "@/lib/api";

type ResumeContent = {
  id: string;
  resume_url: string | null;
  education: unknown;
  experience: unknown;
} | null;

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

const Resume = () => {
  const [resume, setResume] = useState<ResumeContent>(null);
  const [contact, setContact] = useState<ContactInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [r, c] = await Promise.all([
          apiFetch<ResumeContent>("/api/public/resume"),
          apiFetch<ContactInfo>("/api/public/contact"),
        ]);
        setResume(r);
        setContact(c);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const resumeUrl = resume?.resume_url || "/assets/resume.pdf";

  const hasContact = !!(contact?.email || contact?.phone || contact?.location);

  const contactItems = useMemo(() => {
    const arr: Array<{ icon: typeof Mail; node: ReactNode }> = [];
    if (contact?.email) {
      arr.push({
        icon: Mail,
        node: (
          <a href={`mailto:${contact.email}`} className="text-foreground/80 hover:text-primary transition-smooth">
            {contact.email}
          </a>
        ),
      });
    }
    if (contact?.phone) {
      arr.push({
        icon: Phone,
        node: (
          <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-foreground/80 hover:text-primary transition-smooth">
            {contact.phone}
          </a>
        ),
      });
    }
    if (contact?.location) {
      arr.push({ icon: MapPin, node: <span className="text-foreground/80">{contact.location}</span> });
    }
    return arr;
  }, [contact]);

  return (
    <section className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Resume</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
        </div>
      </AnimatedSection>

      {/* Contact Card at Top */}
      <AnimatedSection delay={100}>
        <Card className="glass-card border-primary/20 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Quick Contact</h2>
              <p className="text-sm text-muted-foreground">Get in touch for opportunities</p>
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : hasContact ? (
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {contactItems.map((item, i) => (
                <div key={i} className={`flex items-center space-x-2 ${i === 2 ? "sm:col-span-2" : ""}`}>
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.node}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Set contact details in Admin → Contact.</div>
          )}
        </Card>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <Card className="glass-card border-primary/20 p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Resume Overview</h2>
              <p className="text-foreground/70 leading-relaxed">
                A comprehensive summary of my academic journey, technical skills, project experiences, and achievements in the field of Artificial Intelligence and Machine Learning. This resume highlights my dedication to continuous learning and practical application of cutting-edge technologies.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <GraduationCap className="w-5 h-5 text-primary flex-shrink-0 mt-1 neon-glow" />
                <div>
                  <h3 className="font-semibold text-foreground">Education</h3>
                  <p className="text-sm text-foreground/70">
                    Bachelor's in Artificial Intelligence & Machine Learning, including coursework in Deep Learning, Neural Networks, Computer Vision, and Data Science
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="w-5 h-5 text-primary flex-shrink-0 mt-1 neon-glow" />
                <div>
                  <h3 className="font-semibold text-foreground">Experience</h3>
                  <p className="text-sm text-foreground/70">
                    Multiple hands-on projects involving ML model development, data preprocessing, API integration, and deployment of AI solutions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-primary flex-shrink-0 mt-1 neon-glow" />
                <div>
                  <h3 className="font-semibold text-foreground">Achievements</h3>
                  <p className="text-sm text-foreground/70">
                    Completed specialized certifications, participated in hackathons, and contributed to open-source AI projects
                  </p>
                </div>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-smooth neon-glow"
            >
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="w-5 h-5 mr-2" />
                View Resume
              </a>
            </Button>
          </div>
        </Card>
      </AnimatedSection>

      <AnimatedSection delay={300}>
        <Card className="glass-card border-primary/20 p-6">
          <div className="flex items-start space-x-4">
            <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1 neon-glow" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Resume Card</h3>
              <div className="space-y-1 text-sm text-foreground/70">
                <p>• Professional summary with contact information</p>
                <p>• Detailed education and coursework</p>
                <p>• Complete project portfolio with technical descriptions</p>
                <p>• Skills matrix with proficiency levels</p>
                <p>• Certifications and achievements</p>
              </div>
            </div>
          </div>
        </Card>
      </AnimatedSection>

    </section>
  );
};

export default Resume;
