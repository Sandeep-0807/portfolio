import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, GraduationCap } from "lucide-react";

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

function isBtech(item: Pick<Education, "degree">) {
  const d = (item.degree || "").toLowerCase();
  return d.includes("b.tech") || d.includes("btech") || d.includes("b tech");
}

const AdminEducation = () => {
  const [items, setItems] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);
  const [formData, setFormData] = useState({
    parent_id: "",
    institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "", sort_order: 0,
  });
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiFetch<Education[]>("/api/admin/education");
      setItems(data || []);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load education");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setFormData({ parent_id: "", institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "", sort_order: 0 });
    setEditing(null);
  };

  const handleEdit = (item: Education) => {
    setEditing(item);
    setFormData({
      parent_id: item.parent_id || "",
      institution: item.institution, degree: item.degree, field_of_study: item.field_of_study || "",
      start_date: item.start_date || "", end_date: item.end_date || "", description: item.description || "",
      sort_order: item.sort_order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleAddChild = (parent: Education) => {
    setEditing(null);
    setFormData({ parent_id: parent.id, institution: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "", sort_order: 0 });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      parent_id: formData.parent_id || null,
      institution: formData.institution, degree: formData.degree,
      field_of_study: formData.field_of_study || null, start_date: formData.start_date || null,
      end_date: formData.end_date || null, description: formData.description || null, sort_order: formData.sort_order,
    };

    try {
      if (editing) {
        await apiFetch(`/api/admin/education/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/admin/education", { method: "POST", body: JSON.stringify(payload) });
      }
      toast({ title: "Success", description: editing ? "Education updated" : "Education added" });
      fetchItems();
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const hasChildren = items.some((i) => i.parent_id === id);
    const msg = hasChildren ? "Delete this education entry and all its child entries?" : "Delete this education entry?";
    if (!confirm(msg)) return;
    try {
      await apiFetch(`/api/admin/education/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Education deleted" });
      fetchItems();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Delete failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const parents = items.filter((i) => !i.parent_id);
  const parentOptions = parents.filter((p) => p.id !== editing?.id).filter(isBtech);
  const childrenByParent = items.reduce<Record<string, Education[]>>((acc, item) => {
    if (!item.parent_id) return acc;
    acc[item.parent_id] = acc[item.parent_id] || [];
    acc[item.parent_id].push(item);
    return acc;
  }, {});

  const sortedParents = [...parents].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const orphans = items.filter((i) => i.parent_id && !items.some((p) => p.id === i.parent_id));
  const sortedOrphans = [...orphans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const isInternship = Boolean(formData.parent_id);

  if (loading) return <div className="text-center py-8">Loading education...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Manage Education</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-4 h-4 mr-2" /> Add Education
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? (editing.parent_id ? "Edit Internship" : "Edit Education") : (isInternship ? "Add Internship" : "Add Education")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Parent (optional)</Label>
                <Select
                  value={formData.parent_id ? formData.parent_id : "none"}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.degree} — {p.institution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Internships can be added under a B.Tech parent.</p>
              </div>
              <div className="space-y-2">
                <Label>{isInternship ? "Company" : "Institution"}</Label>
                <Input
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  required
                  placeholder={isInternship ? "e.g., Google" : "e.g., MIT"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isInternship ? "Role" : "Degree"}</Label>
                <Input
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  required
                  placeholder={isInternship ? "e.g., ML Intern" : "e.g., B.Tech"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isInternship ? "Domain" : "Field of Study"}</Label>
                <Input
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                  placeholder={isInternship ? "e.g., AIML" : "e.g., Computer Science"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} placeholder="e.g., 2021" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} placeholder="e.g., 2025" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isInternship ? "Description (about role)" : "Description"}</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
        {sortedParents.map((parent) => {
          const children = (childrenByParent[parent.id] || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          const highlightParent = isBtech(parent) && children.length > 0;
          return (
            <Card
              key={parent.id}
              className={`p-4 glass-card border-primary/20 ${highlightParent ? "border-primary/60 ring-2 ring-primary/25" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{parent.degree}</h3>
                  </div>
                  <p className="text-sm text-primary">{parent.institution}</p>
                  {parent.field_of_study && <p className="text-xs text-muted-foreground">{parent.field_of_study}</p>}
                  {(parent.start_date || parent.end_date) && (
                    <p className="text-xs text-muted-foreground mt-1">{parent.start_date} – {parent.end_date || "Present"}</p>
                  )}
                  {parent.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{parent.description}</p>}

                  {isBtech(parent) && (
                    <div className="mt-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddChild(parent)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Internship
                      </Button>
                    </div>
                  )}

                  {children.length > 0 && (
                    <div className="mt-4 space-y-2 pl-4 border-l border-border">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className={`p-3 rounded-md border ${highlightParent ? "border-primary/25 bg-primary/5" : "border-border/60"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-primary truncate">{child.degree}</p>
                              <p className="text-xs font-medium text-primary/80 truncate">{child.institution}</p>
                              {child.field_of_study && (
                                <p className="text-xs text-muted-foreground truncate">{child.field_of_study}</p>
                              )}
                              {(child.start_date || child.end_date) && (
                                <p className="text-xs text-muted-foreground mt-1">{child.start_date} – {child.end_date || "Present"}</p>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(child)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {child.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{child.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(parent)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(parent.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          );
        })}

        {sortedOrphans.map((item) => (
          <Card key={item.id} className="p-4 glass-card border-primary/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{item.degree}</h3>
                </div>
                <p className="text-sm text-primary">{item.institution}</p>
                <p className="text-xs text-muted-foreground mt-1">(Orphan child: missing parent)</p>
                {(item.start_date || item.end_date) && (
                  <p className="text-xs text-muted-foreground mt-1">{item.start_date} – {item.end_date || "Present"}</p>
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
          <p className="text-muted-foreground">No education entries yet. Click "Add Education" to get started.</p>
        </Card>
      )}
    </div>
  );
};

export default AdminEducation;
