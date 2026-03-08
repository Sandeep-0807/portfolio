import { useState, useEffect } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface ResumeContent {
  id: string;
  resume_url: string | null;
  summary_text: string | null;
  education_summary: string | null;
  experience_summary: string | null;
  achievements_summary: string | null;
  education: unknown;
  experience: unknown;
}

const AdminResume = () => {
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [educationSummary, setEducationSummary] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [achievementsSummary, setAchievementsSummary] = useState("");
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      const rows = await apiFetch<ResumeContent[]>("/api/admin/resume_content");
      const data = rows?.[0] ?? null;
      setContent(data);

      if (data) {
        setResumeUrl(data.resume_url || "");
        setSummaryText(data.summary_text || "");
        setEducationSummary(data.education_summary || "");
        setExperienceSummary(data.experience_summary || "");
        setAchievementsSummary(data.achievements_summary || "");
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load resume content");
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

    let uploadedResumeUrl: string | null = null;
    try {
      if (selectedResumeFile) {
        const fd = new FormData();
        fd.append("file", selectedResumeFile);
        const res = await apiUpload<{ url: string }>("/api/admin/upload", fd);
        uploadedResumeUrl = res.url;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Resume upload failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const resumeData = {
      resume_url: uploadedResumeUrl ?? (resumeUrl || null),
      summary_text: summaryText,
      education_summary: educationSummary,
      experience_summary: experienceSummary,
      achievements_summary: achievementsSummary,
    };

    try {
      if (content) {
        await apiFetch(`/api/admin/resume_content/${content.id}`, {
          method: "PUT",
          body: JSON.stringify(resumeData),
        });
        toast({ title: "Success", description: "Resume content updated successfully" });
      } else {
        await apiFetch("/api/admin/resume_content", {
          method: "POST",
          body: JSON.stringify(resumeData),
        });
        toast({ title: "Success", description: "Resume content created successfully" });
      }
      fetchContent();
      setSelectedResumeFile(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading resume content...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Manage Resume</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 glass-card border-primary/20">
          <h3 className="text-lg font-semibold mb-4">Resume PDF</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume_file">Upload New PDF</Label>
              <Input
                id="resume_file"
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedResumeFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume_url">Direct PDF URL</Label>
              <Input
                id="resume_url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://... or /assets/resume.pdf"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card border-primary/20">
          <h3 className="text-lg font-semibold mb-4">Resume Overview (Summary Card)</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary_text">Overview Description</Label>
              <Textarea
                id="summary_text"
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="A comprehensive summary of my academic journey..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education_summary">Education Bullet Point</Label>
              <Input
                id="education_summary"
                value={educationSummary}
                onChange={(e) => setEducationSummary(e.target.value)}
                placeholder="Bachelor's in Artificial Intelligence & Machine Learning..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_summary">Experience Bullet Point</Label>
              <Input
                id="experience_summary"
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                placeholder="Multiple hands-on projects involving ML model development..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="achievements_summary">Achievements Bullet Point</Label>
              <Input
                id="achievements_summary"
                value={achievementsSummary}
                onChange={(e) => setAchievementsSummary(e.target.value)}
                placeholder="Completed specialized certifications, participated in hackathons..."
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

export default AdminResume;
