import { useState, useEffect } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, User } from "lucide-react";

interface ProfileContent {
  id: string;
  name: string;
  title: string;
  avatar_url: string | null;
  bio: string | null;
}

const AdminProfile = () => {
  const [content, setContent] = useState<ProfileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    avatar_url: "",
    bio: "",
  });
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      const rows = await apiFetch<ProfileContent[]>("/api/admin/profile_content");
      const data = rows?.[0] ?? null;
      setContent(data);

      if (data) {
        setFormData({
          name: data.name,
          title: data.title,
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
        });
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load profile");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let uploadedAvatarUrl: string | null = null;
    try {
      if (selectedAvatar) {
        const fd = new FormData();
        fd.append("file", selectedAvatar);
        const res = await apiUpload<{ url: string }>("/api/admin/upload", fd);
        uploadedAvatarUrl = res.url;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Avatar upload failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const profileData = {
      name: formData.name,
      title: formData.title,
      avatar_url: uploadedAvatarUrl ?? (formData.avatar_url || null),
      bio: formData.bio || null,
    };

    try {
      if (content) {
        await apiFetch(`/api/admin/profile_content/${content.id}`, {
          method: "PUT",
          body: JSON.stringify(profileData),
        });
        toast({ title: "Success", description: "Profile updated successfully" });
      } else {
        await apiFetch("/api/admin/profile_content", {
          method: "POST",
          body: JSON.stringify(profileData),
        });
        toast({ title: "Success", description: "Profile created successfully" });
      }

      fetchContent();
      setSelectedAvatar(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Manage Sidebar Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 glass-card border-primary/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{formData.name || "Your Name"}</h3>
              <p className="text-sm text-muted-foreground">{formData.title || "Your Title"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatar_file">Avatar Upload</Label>
              <Input
                id="avatar_file"
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setSelectedAvatar(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">Upload an image or use the URL field below.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Software Development Engineer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://... or /assets/profile.jpg"
              />
              <p className="text-xs text-muted-foreground">Leave empty to use default avatar</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="A short bio about yourself"
                rows={3}
              />
            </div>
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

export default AdminProfile;
