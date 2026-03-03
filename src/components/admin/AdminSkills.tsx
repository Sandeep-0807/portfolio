import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  proficiency: number | null;
  status: string;
  sort_order: number | null;
}

const AdminSkills = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingSamples, setImportingSamples] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "💻",
    description: "",
    proficiency: 80,
    status: "proficient",
    sort_order: 0,
  });
  const { toast } = useToast();

  const sampleSkills: Array<Pick<Skill, "name" | "icon" | "description" | "proficiency" | "status" | "sort_order">> = [
    {
      name: "Python",
      icon: "🐍",
      description: "Data analysis, ML model development, automation",
      proficiency: 90,
      status: "proficient",
      sort_order: 1,
    },
    {
      name: "C Programming",
      icon: "💻",
      description: "System programming, data structures, algorithms",
      proficiency: 85,
      status: "proficient",
      sort_order: 2,
    },
    {
      name: "HTML & CSS",
      icon: "🎨",
      description: "Responsive web design, modern layouts",
      proficiency: 80,
      status: "proficient",
      sort_order: 3,
    },
    {
      name: "Data Structures",
      icon: "🗂️",
      description: "Arrays, linked lists, trees, graphs, algorithms",
      proficiency: 88,
      status: "proficient",
      sort_order: 4,
    },
    {
      name: "JavaScript",
      icon: "⚡",
      description: "Web development, API integration",
      proficiency: 70,
      status: "learning",
      sort_order: 101,
    },
    {
      name: "Foundations of Data Science",
      icon: "📊",
      description: "Statistical analysis, data exploration, modeling",
      proficiency: 75,
      status: "learning",
      sort_order: 102,
    },
    {
      name: "Data Visualization",
      icon: "📈",
      description: "Matplotlib, Seaborn, Plotly dashboards",
      proficiency: 72,
      status: "learning",
      sort_order: 103,
    },
  ];

  const fetchSkills = async () => {
    try {
      const data = await apiFetch<Skill[]>("/api/admin/skills");
      setSkills(data || []);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load skills");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const importSampleSkills = async () => {
    setImportingSamples(true);
    try {
      const existing = await apiFetch<Skill[]>("/api/admin/skills");
      if ((existing || []).length > 0) {
        toast({
          title: "Already populated",
          description: "Skills already exist in the database.",
        });
        setSkills(existing || []);
        return;
      }

      for (const s of sampleSkills) {
        await apiFetch("/api/admin/skills", {
          method: "POST",
          body: JSON.stringify(s),
        });
      }

      toast({
        title: "Imported",
        description: "Sample skills added to the database.",
      });
      fetchSkills();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Import failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setImportingSamples(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      icon: "💻",
      description: "",
      proficiency: 80,
      status: "proficient",
      sort_order: 0,
    });
    setEditingSkill(null);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      icon: skill.icon,
      description: skill.description || "",
      proficiency: skill.proficiency || 80,
      status: skill.status,
      sort_order: skill.sort_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSkill) {
        await apiFetch(`/api/admin/skills/${editingSkill.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast({ title: "Success", description: "Skill updated successfully" });
      } else {
        await apiFetch("/api/admin/skills", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast({ title: "Success", description: "Skill added successfully" });
      }

      fetchSkills();
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
      await apiFetch(`/api/admin/skills/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Skill deleted successfully" });
      fetchSkills();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Delete failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Manage Skills</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSkill ? "Edit Skill" : "Add New Skill"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proficiency">Proficiency (%)</Label>
                  <Input
                    id="proficiency"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.proficiency}
                    onChange={(e) => setFormData({ ...formData, proficiency: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proficient">Proficient</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                {editingSkill ? "Update Skill" : "Add Skill"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {skills.map((skill) => (
          <Card key={skill.id} className="p-4 glass-card border-primary/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{skill.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{skill.name}</h3>
                  <p className="text-sm text-muted-foreground">{skill.description}</p>
                  <span className="text-xs text-primary">{skill.status} • {skill.proficiency}%</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(skill)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(skill.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {skills.length === 0 && (
        <Card className="p-8 text-center glass-card">
          <p className="text-muted-foreground">No skills saved in the database yet. Click "Add Skill" to get started.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Note: the live site can show sample skills even when the database is empty.
          </p>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={importSampleSkills} disabled={importingSamples}>
              {importingSamples ? "Importing…" : "Import Sample Skills"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSkills;
