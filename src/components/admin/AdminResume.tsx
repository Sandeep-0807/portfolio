import { useState, useEffect } from "react";
import { apiFetch, apiUpload } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";

interface Education {
  institution: string;
  degree: string;
  period: string;
  description: string;
}

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface ResumeContent {
  id: string;
  resume_url: string | null;
  education: unknown;
  experience: unknown;
}

const AdminResume = () => {
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      const rows = await apiFetch<ResumeContent[]>("/api/admin/resume_content");
      const data = rows?.[0] ?? null;
      setContent(data);

      if (data) {
        setResumeUrl(data.resume_url || "");
        setEducation(Array.isArray(data.education) ? (data.education as unknown as Education[]) : []);
        setExperience(Array.isArray(data.experience) ? (data.experience as unknown as Experience[]) : []);
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
      education,
      experience,
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

  const addEducation = () => {
    setEducation([...education, { institution: "", degree: "", period: "", description: "" }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperience([...experience, { company: "", role: "", period: "", description: "" }]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="text-center py-8">Loading resume content...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Manage Resume</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 glass-card border-primary/20">
          <div className="space-y-2 mb-4">
            <Label htmlFor="resume_file">Resume PDF Upload</Label>
            <Input
              id="resume_file"
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedResumeFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume_url">Resume PDF URL</Label>
            <Input
              id="resume_url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://... or /assets/resume.pdf"
            />
            <p className="text-xs text-muted-foreground">Link to your resume PDF file</p>
          </div>
        </Card>

        <Card className="p-6 glass-card border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">Education</Label>
            <Button type="button" variant="outline" size="sm" onClick={addEducation}>
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          </div>

          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Education #{index + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Institution</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      placeholder="University name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Degree</Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      placeholder="B.Tech in CS"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Period</Label>
                  <Input
                    value={edu.period}
                    onChange={(e) => updateEducation(index, "period", e.target.value)}
                    placeholder="2020 - 2024"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={edu.description}
                    onChange={(e) => updateEducation(index, "description", e.target.value)}
                    placeholder="Description of coursework, achievements, etc."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            {education.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No education entries added.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 glass-card border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">Experience</Label>
            <Button type="button" variant="outline" size="sm" onClick={addExperience}>
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </div>

          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Experience #{index + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeExperience(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(index, "company", e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Input
                      value={exp.role}
                      onChange={(e) => updateExperience(index, "role", e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Period</Label>
                  <Input
                    value={exp.period}
                    onChange={(e) => updateExperience(index, "period", e.target.value)}
                    placeholder="Jan 2023 - Present"
                  />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    placeholder="Key responsibilities and achievements"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            {experience.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No experience entries added.</p>
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

export default AdminResume;
