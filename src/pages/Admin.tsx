import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  User, 
  Code, 
  Award, 
  FolderOpen, 
  FileText, 
  Mail,
  Home,
  Shield
} from "lucide-react";
import AdminSkills from "@/components/admin/AdminSkills";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminCertificates from "@/components/admin/AdminCertificates";
import AdminAbout from "@/components/admin/AdminAbout";
import AdminResume from "@/components/admin/AdminResume";
import AdminContact from "@/components/admin/AdminContact";
import AdminProfile from "@/components/admin/AdminProfile";
import AdminEducation from "@/components/admin/AdminEducation";


const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 glass-card border-primary/20 max-w-md text-center">
          <h1 className="text-lg font-semibold text-foreground">Redirecting…</h1>
          <p className="text-sm text-muted-foreground mt-2">Taking you to the admin login page.</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 glass-card border-destructive/50 max-w-md text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges. Contact the site owner to request access.
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Go to Portfolio
            </Button>
            <Button variant="ghost" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const tabs = [
    { id: "about", label: "About", icon: User },
    { id: "skills", label: "Skills", icon: Code },
    { id: "education", label: "Education", icon: Award },
    
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "resume", label: "Resume", icon: FileText },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-nav border-b border-primary/20 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              View Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 mb-8">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="about">
            <AdminAbout />
          </TabsContent>
          <TabsContent value="skills">
            <AdminSkills />
          </TabsContent>
          <TabsContent value="education">
            <AdminEducation />
          </TabsContent>
          <TabsContent value="projects">
            <AdminProjects />
          </TabsContent>
          <TabsContent value="certificates">
            <AdminCertificates />
          </TabsContent>
          <TabsContent value="resume">
            <AdminResume />
          </TabsContent>
          <TabsContent value="contact">
            <AdminContact />
          </TabsContent>
          <TabsContent value="profile">
            <AdminProfile />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
