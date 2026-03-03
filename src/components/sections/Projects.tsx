import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { apiFetch } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  description: string;
  description_align?: string | null;
  highlights: unknown;
  technologies: unknown;
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
  featured: boolean | null;
  sort_order: number | null;
}

function alignClass(value?: string | null) {
  const key = (value || "").toLowerCase();
  if (key === "center") return "text-center";
  if (key === "right") return "text-right";
  if (key === "justify") return "text-justify";
  return "text-left";
}

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(null);
        const data = await apiFetch<Project[]>("/api/public/projects");
        setProjects(data || []);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to load projects");
        setLoadError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getTechs = (p: Project) => {
    return Array.isArray(p.technologies) ? (p.technologies as string[]) : [];
  };

  const getHighlights = (p: Project) => {
    const arr = Array.isArray(p.highlights) ? (p.highlights as string[]) : [];
    return arr
      .flatMap((h) =>
        String(h)
          .replace(/\r\n/g, "\n")
          .replace(/\\n/g, "\n")
          .replace(/\s*\/(?:n|nl)\s*/gi, "\n")
          .split("\n"),
      )
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^"|"$/g, ""));
  };

  const summary = useMemo(() => {
    return (p: Project) => {
      const text = (p.description || "").trim();
      if (text.length <= 120) return text;
      return `${text.slice(0, 117)}...`;
    };
  }, []);

  return (
    <section className="space-y-8">
      <AnimatedSection>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">Projects</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary rounded-full neon-glow"></div>
        </div>
      </AnimatedSection>

      {!loading && loadError && (
        <Card className="glass-card border-primary/20 p-4 text-center">
          <p className="text-muted-foreground">{loadError}</p>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : projects.length === 0 ? (
        <Card className="glass-card border-primary/20 p-8 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <AnimatedSection key={project.id} delay={100 + index * 75}>
              <Card className="p-6 glass-card border-primary/20 hover-glow flex flex-col h-full">
                <div className="flex-1 space-y-4">
                  {project.image_url && (
                    <div className="rounded-lg overflow-hidden border border-primary/20">
                      <img src={project.image_url} alt={project.title} className="w-full h-36 object-cover" loading="lazy" />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-foreground">{project.title}</h3>
                  <p className="text-sm text-foreground/70">{summary(project)}</p>

                  <div className="flex flex-wrap gap-2">
                    {getTechs(project).map((tool, toolIndex) => (
                      <Badge key={toolIndex} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button onClick={() => setSelectedProject(project)} variant="default" size="sm" className="w-full">
                    View Details
                  </Button>
                </div>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      )}

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedProject?.title}</DialogTitle>
            <DialogDescription className={"text-base " + alignClass(selectedProject?.description_align)}>{selectedProject?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedProject && getHighlights(selectedProject).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Highlights:</h4>
                <ul className="space-y-2">
                  {getHighlights(selectedProject).map((h, i) => (
                    <li key={i} className="flex items-start gap-3 text-foreground/80">
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Technologies Used:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProject && getTechs(selectedProject).map((tool, index) => (
                  <Badge key={index} variant="default">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedProject?.github_url && (
                <Button asChild variant="outline">
                  <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer">
                    GitHub <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
              {selectedProject?.live_url && (
                <Button asChild>
                  <a href={selectedProject.live_url} target="_blank" rel="noopener noreferrer">
                    Live Demo <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Projects;
