interface NavigationProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const Navigation = ({ activeSection, onNavigate }: NavigationProps) => {
  const navItems = [
    { id: "about", label: "About Me" },
    { id: "skills", label: "Skills" },
    { id: "education", label: "Education" },
    { id: "experience", label: "Experience" },
    { id: "certificates", label: "Certificates" },
    { id: "projects", label: "Projects" },
    { id: "resume", label: "Resume" },
    { id: "contact", label: "Contact Me" },
  ];

  return (
    <nav 
      className="glass-nav rounded-2xl p-2 mb-8 sticky top-4 z-40" 
      role="navigation" 
      aria-label="Main navigation"
    >
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth ${
              activeSection === item.id
                ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground neon-glow"
                : "text-foreground/70 hover:text-foreground hover:bg-primary/10"
            }`}
            aria-current={activeSection === item.id ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
