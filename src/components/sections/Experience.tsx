import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  currently_working: boolean | null;
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

function renderDescription(description: string) {
  const segments = parseDescriptionSegments(description);
  const hasBullets = segments.some((s) => s.type === "bullets");

  if (!hasBullets) {
    return (
      <p className="text-sm text-foreground/70 mt-3 leading-relaxed whitespace-pre-line">
        {description}
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return (
            <p key={idx} className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
              {seg.text}
            </p>
          );
        }

        return (
          <ul key={idx} className="list-disc pl-5 space-y-2 text-sm text-foreground/70 marker:text-primary">
            {seg.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

const Experience = () => {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await apiFetch<Experience[]>("/api/public/experience");
        setItems(data || []);
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Experience</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
        </div>
      </AnimatedSection>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <Card className="glass-card border-primary/20 p-8 text-center">
          <p className="text-muted-foreground">No experience entries yet.</p>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-secondary opacity-30 hidden md:block" />

          <div className="space-y-6">
            {items.map((item, index) => (
              <AnimatedSection key={item.id} delay={100 + index * 100}>
                <div className="flex gap-4 md:gap-6">
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center neon-glow z-10">
                      <Briefcase className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <Card className="flex-1 glass-card border-primary/20 p-6 hover-glow">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{item.position}</h3>
                          {item.currently_working && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-primary font-medium">{item.company}</p>
                        {item.location && <p className="text-sm text-muted-foreground">{item.location}</p>}
                      </div>
                      {(item.start_date || item.end_date) && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.start_date} – {item.currently_working ? "Present" : item.end_date || "N/A"}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      renderDescription(item.description)
                    )}
                  </Card>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Experience;
