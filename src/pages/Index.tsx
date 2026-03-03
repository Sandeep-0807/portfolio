import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navigation from "@/components/Navigation";
import AboutMe from "@/components/sections/AboutMe";
import Skills from "@/components/sections/Skills";
import Certificates from "@/components/sections/Certificates";
import Projects from "@/components/sections/Projects";
import Resume from "@/components/sections/Resume";
import ContactMe from "@/components/sections/ContactMe";
import Education from "@/components/sections/Education";

type IndexProps = {
  initialSection?: string;
};

function normalizeSection(value?: string) {
  const v = (value || "").toLowerCase().trim();
  const allowed = new Set([
    "about",
    "skills",
    "education",
    "certificates",
    "projects",
    "resume",
    "contact",
  ]);
  return allowed.has(v) ? v : "about";
}

const Index = ({ initialSection }: IndexProps) => {
  const [activeSection, setActiveSection] = useState(() => normalizeSection(initialSection));

  const renderSection = () => {
    switch (activeSection) {
      case "about":
        return <AboutMe />;
      case "skills":
        return <Skills />;
      case "education":
        return <Education />;
      case "certificates":
        return <Certificates />;
      case "projects":
        return <Projects />;
      case "resume":
        return <Resume />;
      case "contact":
        return <ContactMe />;
      default:
        return <AboutMe />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} />
      
      <main className="lg:ml-80 pt-20 lg:pt-0 min-h-screen">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Navigation activeSection={activeSection} onNavigate={setActiveSection} />
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default Index;
