import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";

interface Highlight {
  title: string;
  description: string;
  icon: string;
}

interface AboutContent {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  description_align?: string | null;
  highlights: unknown;
}

const AdminAbout = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "About Me",
    subtitle: "",
    description: "",
    description_align: "justify",
  });
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const { toast } = useToast();

  const fetchContent = useCallback(async () => {
    try {
      const rows = await apiFetch<AboutContent[]>("/api/admin/about_content");
      const data = rows?.[0] ?? null;
      setContent(data);

      if (data) {
        setFormData({
          title: data.title,
          subtitle: data.subtitle || "",
          description: data.description,
          description_align: data.description_align || "justify",
        });
        setHighlights(Array.isArray(data.highlights) ? (data.highlights as unknown as Highlight[]) : []);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load about content");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const aboutData = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      description: formData.description,
      description_align: formData.description_align || null,
      highlights,
    };

    try {
      if (content) {
        await apiFetch(`/api/admin/about_content/${content.id}`, {
          method: "PUT",
          body: JSON.stringify(aboutData),
        });
        toast({ title: "Success", description: "About content updated successfully" });
      } else {
        await apiFetch("/api/admin/about_content", {
          method: "POST",
          body: JSON.stringify(aboutData),
        });
        toast({ title: "Success", description: "About content created successfully" });
      }
      fetchContent();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    setHighlights([...highlights, { title: "", description: "", icon: "award" }]);
  };

  const updateHighlight = (index: number, field: keyof Highlight, value: string) => {
    const updated = [...highlights];
    updated[index][field] = value;
    setHighlights(updated);
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="text-center py-8">Loading about content...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Manage About Section</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 glass-card border-primary/20">
          <div className="space-y-4">
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
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (supports multiple paragraphs)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={8}
                placeholder="Write your about me content here. Use double line breaks for paragraphs."
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
          </div>
        </Card>

        <Card className="p-6 glass-card border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">Highlights</Label>
            <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
              <Plus className="w-4 h-4 mr-2" />
              Add Highlight
            </Button>
          </div>

          <div className="space-y-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start p-4 border border-border rounded-lg">
                <div className="col-span-1">
                  <Label className="text-xs">Icon</Label>
                  <Select
                    value={(highlight.icon || "").toLowerCase()}
                    onValueChange={(value) => updateHighlight(index, "icon", value)}
                  >
                    <SelectTrigger className="px-2">
                      <SelectValue placeholder="Icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="award">Award</SelectItem>
                      <SelectItem value="lightbulb">Lightbulb</SelectItem>
                      <SelectItem value="target">Target</SelectItem>
                      <SelectItem value="heart">Heart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={highlight.title}
                    onChange={(e) => updateHighlight(index, "title", e.target.value)}
                    placeholder="Highlight title"
                  />
                </div>
                <div className="col-span-7">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={highlight.description}
                    onChange={(e) => updateHighlight(index, "description", e.target.value)}
                    placeholder="Highlight description"
                    rows={2}
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHighlight(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {highlights.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No highlights added. Click "Add Highlight" to add one.
              </p>
            )}
          </div>
        </Card>

        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default AdminAbout;
