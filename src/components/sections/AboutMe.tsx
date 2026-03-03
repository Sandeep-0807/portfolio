import { Award, Heart, Lightbulb, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import AnimatedSection from "@/components/AnimatedSection";
import { apiFetch } from "@/lib/api";

type Highlight = {
  title: string;
  description: string;
  icon?: string;
};

type AboutContent = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  description_align?: string | null;
  highlights: unknown;
} | null;

function alignClass(value?: string | null) {
  const key = (value || "").toLowerCase();
  if (key === "center") return "text-center";
  if (key === "right") return "text-right";
  if (key === "justify") return "text-justify";
  return "text-left";
}

const AboutMe = () => {
  const [content, setContent] = useState<AboutContent>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        const data = await apiFetch<AboutContent>("/api/public/about");
        setContent(data);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to load about content");
        setLoadError(err.message || "Failed to load about content");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const highlights = [
    {
      icon: Award,
      title: "Technical Excellence",
      description:
        "Maintaining strong academic performance while actively developing software engineering skills through projects, coding practice, and hands-on development experience.",
    },
    {
      icon: Lightbulb,
      title: "Innovation Driven",
      description:
        "Exploring modern technologies, frameworks, and creative engineering solutions to build impactful applications.",
    },
    {
      icon: Target,
      title: "Goal-Oriented",
      description:
        "Focused on building a career as a Software Development Engineer (SDE) with strong programming, problem-solving, and system design fundamentals.",
    },
    {
      icon: Heart,
      title: "Passionate Learner",
      description:
        "Committed to continuous learning, improving coding skills, and contributing to the developer community.",
    },
  ];

  const iconMap = useMemo(() => {
    return {
      award: Award,
      trophy: Award,
      lightbulb: Lightbulb,
      "💡": Lightbulb,
      target: Target,
      heart: Heart,
      "❤️": Heart,
      "❤": Heart,
      "⭐": Award,
    } as const;
  }, []);

  const dbHighlights = useMemo(() => {
    if (!content || !Array.isArray(content.highlights)) return null;
    return (content.highlights as unknown as Highlight[]).filter((h) => h?.title && h?.description);
  }, [content]);

  const descriptionParagraphs = useMemo(() => {
    const text = content?.description?.trim();
    if (!text) return null;
    return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  }, [content]);

  return (
    <section className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">{content?.title || "About Me"}</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
          {content?.subtitle && (
            <p className="text-sm text-muted-foreground mt-3">{content.subtitle}</p>
          )}
        </div>
      </AnimatedSection>

      {!loading && loadError && (
        <Card className="glass-card border-primary/20 p-4 text-center">
          <p className="text-muted-foreground">{loadError}</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <AnimatedSection delay={100}>
          <div className={"space-y-4 " + alignClass(content?.description_align)}>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : descriptionParagraphs ? (
              descriptionParagraphs.map((p, i) => (
                <p key={i} className="text-lg leading-relaxed text-foreground/90">
                  {p}
                </p>
              ))
            ) : (
              <>
                <p className="text-lg leading-relaxed text-foreground/90">
                  Hello! I'm an aspiring <span className="font-semibold text-primary">Software Development Engineer (SDE)</span> currently pursuing my Degree in Computer Science. My passion for software development began when I discovered how technology can solve real-world problems through clean and scalable code.
                </p>
                <p className="text-lg leading-relaxed text-foreground/90">
                  Over time, I've built a strong foundation in <span className="font-semibold">programming, data structures & algorithms, web development, and system design basics</span>. I enjoy building applications, improving code efficiency, and learning modern development tools.
                </p>
                <p className="text-lg leading-relaxed text-foreground/90">
                  Beyond academics, I actively participate in coding contests, hackathons, and collaborative development projects. I enjoy working in teams, contributing to open-source, and staying updated with the latest engineering practices.
                </p>
                <p className="text-lg leading-relaxed text-foreground/90">
                  When I'm not coding, I explore new frameworks, work on personal projects, read tech blogs, or help peers who are beginning their journey in software development.
                </p>
              </>
            )}
          </div>
        </AnimatedSection>

        <div className="grid gap-4">
          {(dbHighlights || highlights).map((item, index) => {
            const Icon = "icon" in item
              ? (typeof item.icon === "string" ? (iconMap[item.icon.toLowerCase() as keyof typeof iconMap] || Award) : Award)
              : (item.icon as unknown as typeof Award);

            return (
              <AnimatedSection key={index} delay={200 + index * 100}>
                <Card className="p-6 glass-card border-primary/20 hover-glow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow">
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-foreground">{item.title}</h3>
                      <p className="text-sm text-foreground/70">{item.description}</p>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
