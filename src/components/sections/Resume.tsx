import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, GraduationCap, Briefcase, Award, Mail, Phone, MapPin, Eye } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { apiFetch } from "@/lib/api";

type ResumeContent = {
  id: string;
  resume_url: string | null;
  summary_text: string | null;
  education_summary: string | null;
  experience_summary: string | null;
  achievements_summary: string | null;
  education: unknown;
  experience: unknown;
} | null;

interface Education {
  id: string;
  parent_id: string | null;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  sort_order: number | null;
}

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
  const [education, setEducation] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        const [r, c, e] = await Promise.all([
          apiFetch<ResumeContent>("/api/public/resume"),
          apiFetch<ContactInfo>("/api/public/contact"),
          apiFetch<Education[]>("/api/public/education"),
        ]);
        setResume(r);
        setContact(c);
        setEducation(e || []);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to load resume data");
        setLoadError(err.message || "Failed to load resume data");
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
          ) : loadError ? (
            <div className="text-sm text-muted-foreground">{loadError}</div>
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
              <h2 className="text-2xl font-semibold mb-4 text-foreground text-gradient">Resume Overview</h2>
              <p className="text-foreground/70 leading-relaxed mb-8">
                {resume?.summary_text || "A comprehensive summary of my academic journey, technical skills, project experiences, and achievements in the field of Artificial Intelligence and Machine Learning."}
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                  <GraduationCap className="w-6 h-6 text-primary neon-glow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Education</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {resume?.education_summary || "B.Tech in Artificial Intelligence & Machine Learning, focusing on Deep Learning and Data Science."}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                  <Briefcase className="w-6 h-6 text-primary neon-glow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Experience</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {resume?.experience_summary || "Hands-on projects involving AI model development, full-stack integration, and innovative solution deployment."}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                  <Award className="w-6 h-6 text-primary neon-glow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Achievements</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {resume?.achievements_summary || "Top performer in hackathons, certified AI specialist, and active contributor to open-source technical projects."}
                  </p>
                </div>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-smooth neon-glow py-6 text-lg mt-8"
            >
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="w-6 h-6 mr-3" />
                View Resume
              </a>
            </Button>
          </div>
        </Card>
      </AnimatedSection>

      {education.length > 0 && (
        <AnimatedSection delay={300}>
          <div className="px-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-gradient">
              <GraduationCap className="w-6 h-6 mr-3 text-primary" />
              Detailed Education
            </h2>
            <div className="grid gap-6">
              {education.filter(e => !e.parent_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((edu) => (
                <Card key={edu.id} className="glass-card border-primary/20 p-6 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{edu.degree}</h3>
                      <p className="text-primary font-medium">{edu.institution}</p>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium w-fit">
                      {edu.start_date} – {edu.end_date || "Present"}
                    </div>
                  </div>
                  {edu.description && (
                    <p className="mt-4 text-foreground/70 text-sm leading-relaxed border-l-2 border-primary/20 pl-4 italic">
                      {edu.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}
    </section>
  );
};

export default Resume;
