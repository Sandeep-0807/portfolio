import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, Briefcase } from "lucide-react";

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

const AdminExperience = () => {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [formData, setFormData] = useState({
    company: "", position: "", location: "", start_date: "", end_date: "", description: "", currently_working: false, sort_order: 0,
  });
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      const data = await apiFetch<Experience[]>("/api/admin/experience");
      setItems(data || []);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load experience");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setFormData({ company: "", position: "", location: "", start_date: "", end_date: "", description: "", currently_working: false, sort_order: 0 });
    setEditing(null);
  };

  const handleEdit = (item: Experience) => {
    setEditing(item);
    setFormData({
      company: item.company, position: item.position, location: item.location || "",
      start_date: item.start_date || "", end_date: item.end_date || "", description: item.description || "",
      currently_working: item.currently_working || false, sort_order: item.sort_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      company: formData.company, position: formData.position,
      location: formData.location || null, start_date: formData.start_date || null,
      end_date: formData.currently_working ? null : (formData.end_date || null),
      description: formData.description || null, currently_working: formData.currently_working, sort_order: formData.sort_order,
    };

    try {
      if (editing) {
        await apiFetch(`/api/admin/experience/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/admin/experience", { method: "POST", body: JSON.stringify(payload) });
      }
      toast({ title: "Success", description: editing ? "Experience updated" : "Experience added" });
      fetchItems();
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;
    try {
      await apiFetch(`/api/admin/experience/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Experience deleted" });
      fetchItems();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Delete failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="text-center py-8">Loading experience...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Manage Experience</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-4 h-4 mr-2" /> Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Experience" : "Add Experience"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} required placeholder="e.g., Google" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} required placeholder="e.g., Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Bangalore, India" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} placeholder="e.g., Jan 2024" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} placeholder="e.g., Dec 2024" disabled={formData.currently_working} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="currently_working" checked={formData.currently_working} onCheckedChange={(checked) => setFormData({ ...formData, currently_working: !!checked })} />
                <Label htmlFor="currently_working">Currently working here</Label>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your role and responsibilities..." />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })} />
              </div>
              <Button type="submit" className="w-full"><Save className="w-4 h-4 mr-2" />{editing ? "Update" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-4 glass-card border-primary/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{item.position}</h3>
                </div>
                <p className="text-sm text-primary">{item.company}</p>
                {item.location && <p className="text-xs text-muted-foreground">{item.location}</p>}
                {(item.start_date || item.end_date) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.start_date} – {item.currently_working ? "Present" : item.end_date || "N/A"}
                  </p>
                )}
                {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
              </div>
              <div className="flex space-x-2 ml-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="p-8 text-center glass-card">
          <p className="text-muted-foreground">No experience entries yet. Click "Add Experience" to get started.</p>
        </Card>
      )}
    </div>
  );
};

export default AdminExperience;
