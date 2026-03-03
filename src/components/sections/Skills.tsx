import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnimatedSection from "@/components/AnimatedSection";
import { apiFetch } from "@/lib/api";

type Skill = {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  proficiency: number | null;
  status: "proficient" | "learning";
  sort_order: number | null;
};

function normalizeSkillName(name: string) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function pickBetterSkill(a: Skill, b: Skill): Skill {
  // Prefer proficient skills over learning.
  if (a.status !== b.status) return a.status === "proficient" ? a : b;

  // Prefer higher proficiency.
  const pa = a.proficiency ?? -1;
  const pb = b.proficiency ?? -1;
  if (pa !== pb) return pa > pb ? a : b;

  // Prefer lower sort_order.
  const sa = a.sort_order ?? Number.POSITIVE_INFINITY;
  const sb = b.sort_order ?? Number.POSITIVE_INFINITY;
  if (sa !== sb) return sa < sb ? a : b;

  // Prefer richer content.
  const aScore = (a.description ? 1 : 0) + (a.icon ? 1 : 0);
  const bScore = (b.description ? 1 : 0) + (b.icon ? 1 : 0);
  if (aScore !== bScore) return aScore > bScore ? a : b;

  return a;
}

const Skills = () => {
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        const data = await apiFetch<Skill[]>("/api/public/skills");
        setItems(data || []);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to load skills");
        setLoadError(err.message || "Failed to load skills");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const proficientSkills = [
    {
      name: "Python",
      proficiency: 90,
      icon: "🐍",
      description: "Data analysis, ML model development, automation",
      status: "proficient",
    },
    {
      name: "C Programming",
      proficiency: 85,
      icon: "💻",
      description: "System programming, data structures, algorithms",
      status: "proficient",
    },
    {
      name: "HTML & CSS",
      proficiency: 80,
      icon: "🎨",
      description: "Responsive web design, modern layouts",
      status: "proficient",
    },
    {
      name: "Data Structures",
      proficiency: 88,
      icon: "🗂️",
      description: "Arrays, linked lists, trees, graphs, algorithms",
      status: "proficient",
    },
  ];

  const learningSkills = [
    {
      name: "JavaScript",
      proficiency: 70,
      icon: "⚡",
      description: "Web development, API integration",
      status: "learning",
    },
    {
      name: "Foundations of Data Science",
      proficiency: 75,
      icon: "📊",
      description: "Statistical analysis, data exploration, modeling",
      status: "learning",
    },
    {
      name: "Data Visualization",
      proficiency: 72,
      icon: "📈",
      description: "Matplotlib, Seaborn, Plotly dashboards",
      status: "learning",
    },
  ];

  const SkillCard = ({ skill }: { skill: typeof proficientSkills[0] }) => (
    <Card className="p-6 glass-card border-primary/20 hover-glow">
      <div className="flex items-start space-x-3">
        <span className="text-3xl">{skill.icon}</span>
        <div>
          <h3 className="font-semibold text-lg text-foreground">{skill.name}</h3>
          <p className="text-sm text-foreground/70 mt-1">{skill.description}</p>
        </div>
      </div>
    </Card>
  );

  const groups = useMemo(() => {
    const map = new Map<string, Skill>();
    for (const s of items) {
      const key = normalizeSkillName(s.name) || s.id;
      const existing = map.get(key);
      map.set(key, existing ? pickBetterSkill(existing, s) : s);
    }
    const deduped = Array.from(map.values());

    const byStatus = {
      proficient: [] as Skill[],
      learning: [] as Skill[],
    };
    for (const s of deduped) {
      if (s.status === "learning") byStatus.learning.push(s);
      else byStatus.proficient.push(s);
    }
    return byStatus;
  }, [items]);

  const useDb = !loading && items.length > 0;

  return (
    <section className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Skills</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
        </div>
      </AnimatedSection>

      {!loading && loadError && (
        <Card className="glass-card border-primary/20 p-4 text-center">
          <p className="text-muted-foreground">{loadError}</p>
        </Card>
      )}

      <div className="space-y-8">
        <AnimatedSection delay={100}>
          <div className="flex items-center space-x-3 mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Proficient Skills</h2>
            <Badge className="bg-gradient-to-r from-primary to-secondary neon-glow">Completed</Badge>
          </div>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-6 text-muted-foreground">Loading...</div>
          ) : useDb ? (
            groups.proficient.map((skill, index) => (
              <AnimatedSection key={skill.id} delay={150 + index * 100}>
                <SkillCard
                  skill={{
                    name: skill.name,
                    icon: skill.icon,
                    description: skill.description || "",
                    proficiency: skill.proficiency || 0,
                    status: skill.status,
                  }}
                />
              </AnimatedSection>
            ))
          ) : (
            proficientSkills.map((skill, index) => (
              <AnimatedSection key={index} delay={150 + index * 100}>
                <SkillCard skill={skill} />
              </AnimatedSection>
            ))
          )}
        </div>

        <AnimatedSection delay={100}>
          <div className="flex items-center space-x-3 mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Currently Learning</h2>
            <Badge variant="secondary">In Progress</Badge>
          </div>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-6 text-muted-foreground">Loading...</div>
          ) : useDb ? (
            groups.learning.map((skill, index) => (
              <AnimatedSection key={skill.id} delay={150 + index * 100}>
                <SkillCard
                  skill={{
                    name: skill.name,
                    icon: skill.icon,
                    description: skill.description || "",
                    proficiency: skill.proficiency || 0,
                    status: skill.status,
                  }}
                />
              </AnimatedSection>
            ))
          ) : (
            learningSkills.map((skill, index) => (
              <AnimatedSection key={index} delay={150 + index * 100}>
                <SkillCard skill={skill} />
              </AnimatedSection>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Skills;
