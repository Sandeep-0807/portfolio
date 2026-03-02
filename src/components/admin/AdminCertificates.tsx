import { useState, useEffect } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, ExternalLink } from "lucide-react";

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string | null;
  credential_url: string | null;
  description: string | null;
  description_align?: string | null;
  sort_order: number | null;
}

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Hackathons",
    date: "",
    description: "",
    description_align: "justify",
    sort_order: 0,
  });
  const { toast } = useToast();

  const fetchCertificates = async () => {
    try {
      const data = await apiFetch<Certificate[]>("/api/admin/certificates");
      setCertificates(data || []);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load certificates");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      category: "Hackathons",
      date: "",
      description: "",
      description_align: "justify",
      sort_order: 0,
    });
    setSelectedFile(null);
    setEditingCert(null);
  };

  const handleEdit = (cert: Certificate) => {
    setEditingCert(cert);
    setFormData({
      title: cert.title,
      category: cert.issuer,
      date: cert.date || "",
      description: cert.description || "",
      description_align: cert.description_align || "justify",
      sort_order: cert.sort_order || 0,
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let uploadedUrl: string | null = null;
    try {
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const res = await apiUpload<{ url: string }>("/api/admin/upload", fd);
        uploadedUrl = res.url;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Upload failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return;
    }

    const certData = {
      title: formData.title,
      issuer: formData.category,
      date: formData.date || null,
      description: formData.description || null,
      description_align: formData.description_align || null,
      sort_order: formData.sort_order,
      credential_url: uploadedUrl ?? (editingCert?.credential_url || null),
    };

    try {
      if (editingCert) {
        await apiFetch(`/api/admin/certificates/${editingCert.id}`, {
          method: "PUT",
          body: JSON.stringify(certData),
        });
        toast({ title: "Success", description: "Certificate updated successfully" });
      } else {
        await apiFetch("/api/admin/certificates", {
          method: "POST",
          body: JSON.stringify(certData),
        });
        toast({ title: "Success", description: "Certificate added successfully" });
      }

      fetchCertificates();
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;

    try {
      await apiFetch(`/api/admin/certificates/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Certificate deleted successfully" });
      fetchCertificates();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Delete failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Manage Certificates</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-4 h-4 mr-2" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCert ? "Edit Certificate" : "Add New Certificate"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Hackathons / Quizzes / Workshops"
                  required
                />
              </div>
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
                <Label htmlFor="date">Month / Year</Label>
                <Input
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g., March 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate_file">Certificate Upload</Label>
                <Input
                  id="certificate_file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                {editingCert?.credential_url && !selectedFile && (
                  <a
                    href={editingCert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Current Certificate <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                {editingCert ? "Update Certificate" : "Add Certificate"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <Card key={cert.id} className="p-4 glass-card border-primary/20">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{cert.title}</h3>
                <p className="text-sm text-primary">{cert.issuer}</p>
                {cert.date && <p className="text-xs text-muted-foreground">{cert.date}</p>}
                {cert.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cert.description}</p>}
                {cert.credential_url && (
                  <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2">
                    View Certificate <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex space-x-2 ml-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(cert)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cert.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {certificates.length === 0 && (
        <Card className="p-8 text-center glass-card">
          <p className="text-muted-foreground">No certificates added yet. Click "Add Certificate" to get started.</p>
        </Card>
      )}
    </div>
  );
};

export default AdminCertificates;
