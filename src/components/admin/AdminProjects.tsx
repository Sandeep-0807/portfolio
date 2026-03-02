import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, ExternalLink, Github } from "lucide-react";

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

function normalizeHighlightsInput(input: string) {
  const normalized = (input || "")
    // handle pasted literal markers like "\n" or "/n" (common when copied from code/notes)
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\s*\/(?:n|nl)\s*/gi, "\n");

  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^"|"$/g, ""));
}

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    description_align: "justify",
    highlights: "",
    technologies: "",
    github_url: "",
    live_url: "",
    image_url: "",
    featured: false,
    sort_order: 0,
  });
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const data = await apiFetch<Project[]>("/api/admin/projects");
      setProjects(data || []);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load projects");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      description_align: "justify",
      highlights: "",
      technologies: "",
      github_url: "",
      live_url: "",
      image_url: "",
      featured: false,
      sort_order: 0,
    });
    setEditingProject(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    const techs = Array.isArray(project.technologies) ? (project.technologies as string[]).join(", ") : "";
    const highlights = Array.isArray(project.highlights) ? (project.highlights as string[]).join("\n") : "";
    setFormData({
      title: project.title,
      description: project.description,
      description_align: project.description_align || "justify",
      highlights,
      technologies: techs,
      github_url: project.github_url || "",
      live_url: project.live_url || "",
      image_url: project.image_url || "",
      featured: project.featured || false,
      sort_order: project.sort_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const techArray = formData.technologies.split(",").map((t) => t.trim()).filter(Boolean);
    const highlightArray = normalizeHighlightsInput(formData.highlights);

    const projectData = {
      title: formData.title,
      description: formData.description,
      description_align: formData.description_align || null,
      highlights: highlightArray.length ? highlightArray : null,
      technologies: techArray,
      github_url: formData.github_url || null,
      live_url: formData.live_url || null,
      image_url: formData.image_url || null,
      featured: formData.featured,
      sort_order: formData.sort_order,
    };

    try {
      if (editingProject) {
        await apiFetch(`/api/admin/projects/${editingProject.id}`, {
          method: "PUT",
          body: JSON.stringify(projectData),
        });
        toast({ title: "Success", description: "Project updated successfully" });
      } else {
        await apiFetch("/api/admin/projects", {
          method: "POST",
          body: JSON.stringify(projectData),
        });
        toast({ title: "Success", description: "Project added successfully" });
      }

      fetchProjects();
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await apiFetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Project deleted successfully" });
      fetchProjects();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Delete failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Manage Projects</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description Alignment</Label>
                <Select
                  value={formData.description_align}
                  onValueChange={(value) => setFormData({ ...formData, description_align: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="justify">Justify</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="highlights">Key Highlights (one per line)</Label>
                <Textarea
                  id="highlights"
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder="Implemented data augmentation...\nUsed transfer learning..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                <Input
                  id="technologies"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="live_url">Live URL</Label>
                <Input
                  id="live_url"
                  value={formData.live_url}
                  onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>
              <Button type="submit" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {editingProject ? "Update Project" : "Add Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-4 glass-card border-primary/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{project.title}</h3>
                  {project.featured && <Badge variant="secondary">Featured</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{project.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {Array.isArray(project.technologies) && (project.technologies as string[]).map((tech, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Open GitHub repository"
                      title="Open GitHub repository"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Open live project"
                      title="Open live project"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card className="p-8 text-center glass-card">
          <p className="text-muted-foreground">No projects added yet. Click "Add Project" to get started.</p>
        </Card>
      )}
    </div>
  );
};

export default AdminProjects;
