import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

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

function splitLines(text: string) {
  return text
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);
}

function isBulletLine(line: string) {
  return line.startsWith("•") || line.startsWith("- ") || line.startsWith("* ");
}

function stripBullet(line: string) {
  if (line.startsWith("•")) return line.replace(/^•\s*/, "");
  if (line.startsWith("- ")) return line.slice(2);
  if (line.startsWith("* ")) return line.slice(2);
  return line;
}

type DescSegment =
  | { type: "text"; text: string }
  | { type: "bullets"; items: string[] };

function parseDescriptionSegments(description: string): DescSegment[] {
  const rawLines = description.split(/\r?\n/g);
  const segments: DescSegment[] = [];

  let currentText: string[] = [];
  let currentBullets: string[] = [];

  const flushText = () => {
    const text = currentText.join("\n").trim();
    if (text) segments.push({ type: "text", text });
    currentText = [];
  };

  const flushBullets = () => {
    if (currentBullets.length) segments.push({ type: "bullets", items: currentBullets });
    currentBullets = [];
  };

  for (const raw of rawLines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      flushText();
      continue;
    }

    if (isBulletLine(line)) {
      flushText();
      currentBullets.push(stripBullet(line));
    } else {
      flushBullets();
      currentText.push(raw);
    }
  }

  flushBullets();
  flushText();
  return segments;
}

function renderDescription(description: string, variant: "parent" | "child") {
  const textClass = variant === "parent" ? "text-sm text-foreground/70" : "text-xs text-foreground/70";
  const segments = parseDescriptionSegments(description);
  const hasBullets = segments.some((s) => s.type === "bullets");

  // If there are no bullets at all, keep the original simple rendering.
  if (!hasBullets) {
    return (
      <p className={`${variant === "parent" ? "mt-3" : ""} ${textClass} whitespace-pre-line leading-relaxed`}>
        {description}
      </p>
    );
  }

  return (
    <div className={`${variant === "parent" ? "mt-3" : ""} space-y-2`}>
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return (
            <p key={idx} className={`${textClass} whitespace-pre-line leading-relaxed`}>
              {seg.text}
            </p>
          );
        }

        return (
          <ul key={idx} className={`list-disc pl-5 space-y-2 marker:text-primary ${textClass}`}>
            {seg.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

const Education = () => {
  const [items, setItems] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        const data = await apiFetch<Education[]>("/api/public/education");
        setItems(data || []);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to load education");
        setLoadError(err.message || "Failed to load education");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <section className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Education</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
        </div>
      </AnimatedSection>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : loadError ? (
        <Card className="glass-card border-primary/20 p-8 text-center">
          <p className="text-muted-foreground">{loadError}</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="glass-card border-primary/20 p-8 text-center">
          <p className="text-muted-foreground">No education entries yet.</p>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-secondary opacity-30 hidden md:block" />

          <div className="space-y-6">
            {(() => {
              const parents = items.filter((i) => !i.parent_id);
              const childrenByParent = items.reduce<Record<string, Education[]>>((acc, item) => {
                if (!item.parent_id) return acc;
                acc[item.parent_id] = acc[item.parent_id] || [];
                acc[item.parent_id].push(item);
                return acc;
              }, {});
              const sortedParents = [...parents].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
              const orphans = items.filter((i) => i.parent_id && !items.some((p) => p.id === i.parent_id));
              const sortedOrphans = [...orphans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

              return [...sortedParents, ...sortedOrphans].map((parent, index) => {
                const children = (childrenByParent[parent.id] || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                const highlightParent = children.length > 0;
                return (
                  <AnimatedSection key={parent.id} delay={100 + index * 100}>
                <div className="flex gap-4 md:gap-6">
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow z-10">
                      <GraduationCap className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <Card className={`flex-1 glass-card border-primary/20 p-6 hover-glow ${highlightParent ? "border-primary/60 ring-2 ring-primary/25" : ""}`}>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{parent.degree}</h3>
                        <p className="text-primary font-medium">{parent.institution}</p>
                        {parent.field_of_study && <p className="text-sm text-muted-foreground">{parent.field_of_study}</p>}
                      </div>
                      {(parent.start_date || parent.end_date) && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {parent.start_date} – {parent.end_date || "Present"}
                        </span>
                      )}
                    </div>
                    {parent.description && (
                      renderDescription(parent.description, "parent")
                    )}

                    {children.length > 0 && (
                      <div className="mt-4 space-y-2 pl-4 border-l border-border">
                        {children.map((child) => (
                          <div key={child.id} className="space-y-0.5 rounded-md border border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-sm font-semibold text-primary">{child.degree}</p>
                                <p className="text-xs font-medium text-primary/80">{child.institution}</p>
                                {child.field_of_study && (
                                  <p className="text-xs text-muted-foreground">{child.field_of_study}</p>
                                )}
                              </div>
                              {(child.start_date || child.end_date) && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {child.start_date} – {child.end_date || "Present"}
                                </span>
                              )}
                            </div>
                            {child.description && (
                              renderDescription(child.description, "child")
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
                  </AnimatedSection>
                );
              });
            })()}
          </div>
        </div>
      )}
    </section>
  );
};

export default Education;
