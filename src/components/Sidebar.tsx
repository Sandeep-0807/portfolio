import { Mail, Phone, MapPin, Linkedin, Instagram, Facebook, Github, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, memo } from "react";
import profileImage from "@/assets/profile.jpg";
import ThemeToggle from "@/components/ThemeToggle";
import { apiFetch } from "@/lib/api";
interface SidebarProps {
  activeSection: string;
}

type ProfileContent = {
  id: string;
  name: string;
  title: string;
  avatar_url: string | null;
  bio: string | null;
};

type SocialLinks = {
  github?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
};

type ContactInfo = {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  social_links: SocialLinks | null;
};

const Sidebar = ({
  activeSection
}: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileContent | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const scrollLockRef = useRef<{
    scrollY: number;
    bodyPosition: string;
    bodyTop: string;
    bodyLeft: string;
    bodyRight: string;
    bodyWidth: string;
    bodyOverflow: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scrollLockRef.current) {
        const prev = scrollLockRef.current;
        document.body.style.position = prev.bodyPosition;
        document.body.style.top = prev.bodyTop;
        document.body.style.left = prev.bodyLeft;
        document.body.style.right = prev.bodyRight;
        document.body.style.width = prev.bodyWidth;
        document.body.style.overflow = prev.bodyOverflow;
        window.scrollTo(0, prev.scrollY);
        scrollLockRef.current = null;
      }
      return;
    }

    const scrollY = window.scrollY;
    scrollLockRef.current = {
      scrollY,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      if (!scrollLockRef.current) return;
      const prev = scrollLockRef.current;
      document.body.style.position = prev.bodyPosition;
      document.body.style.top = prev.bodyTop;
      document.body.style.left = prev.bodyLeft;
      document.body.style.right = prev.bodyRight;
      document.body.style.width = prev.bodyWidth;
      document.body.style.overflow = prev.bodyOverflow;
      window.scrollTo(0, prev.scrollY);
      scrollLockRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [p, c] = await Promise.all([
          apiFetch<ProfileContent | null>("/api/public/profile"),
          apiFetch<ContactInfo | null>("/api/public/contact"),
        ]);
        setProfile(p);
        setContact(c);
      } catch {
        // ignore: fall back to bundled defaults
      }
    };
    fetch();
  }, []);

  const contactInfo = [
    contact?.phone
      ? {
          icon: Phone,
          text: contact.phone,
          href: `tel:${contact.phone.replace(/\s+/g, "")}`,
        }
      : null,
    contact?.email
      ? {
          icon: Mail,
          text: contact.email,
          href: `mailto:${contact.email}`,
        }
      : null,
    contact?.location
      ? {
          icon: MapPin,
          text: contact.location,
        }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof Phone; text: string; href?: string }>;

  const links: Array<{ icon: typeof Github; href: string; label: string }> = [];
  const social = contact?.social_links || {};
  if (social.github) links.push({ icon: Github, href: social.github, label: "GitHub" });
  if (social.linkedin) links.push({ icon: Linkedin, href: social.linkedin, label: "LinkedIn" });
  if (social.instagram) links.push({ icon: Instagram, href: social.instagram, label: "Instagram" });
  if (social.facebook) links.push({ icon: Facebook, href: social.facebook, label: "Facebook" });

  const SidebarContent = memo(() => <div className="flex flex-col flex-1">
      {/* Top Section - Profile */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="relative group animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-smooth neon-glow"></div>
          <img src={profile?.avatar_url || profileImage} alt={`${profile?.name || "Profile"} avatar`} className="relative w-40 h-40 rounded-full object-cover border-2 border-primary/30 shadow-elevated will-change-auto transition-transform duration-300 group-hover:scale-105" loading="eager" fetchPriority="high" decoding="async" />
        </div>

        <div className="text-center mt-6 mb-4 animate-fade-in">
          <h2 className="text-2xl font-bold text-gradient">{profile?.name || "Your Name"}</h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">{profile?.title || "Your Title"}</p>
        </div>
      </div>

      {/* Contact Info & Social */}
      <div className="space-y-3 pb-8 px-4">
        {contactInfo.map((item, index) => (
          <div 
            key={index} 
            className="glass-card rounded-xl p-3 animate-fade-in hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center space-x-2 text-xs text-foreground/80">
              <item.icon className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
              {item.href ? <a href={item.href} className="hover:text-primary transition-smooth truncate">
                  {item.text}
                </a> : <span className="truncate">{item.text}</span>}
            </div>
          </div>
        ))}

        <div className="flex justify-center space-x-3 animate-fade-in">
          {links.map((social, index) => <a key={index} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="w-10 h-10 flex items-center justify-center rounded-full glass-card hover:neon-glow transition-smooth text-foreground hover:text-primary hover:scale-110">
              <social.icon className="w-4 h-4" />
            </a>)}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="mt-auto pb-6 px-4 flex justify-center">
        <ThemeToggle />
      </div>
    </div>);
  return <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 glass-nav z-50 border-b border-primary/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <img src={profile?.avatar_url || profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-primary/30 will-change-auto" loading="eager" fetchPriority="high" decoding="async" />
            <span className="text-foreground font-semibold">Portfolio</span>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-2 hover:bg-primary/10 rounded-lg transition-smooth" aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && <div className="glass-nav border-t border-primary/20">
            <div className="px-4 py-6 flex flex-col h-[calc(100vh-60px)]">
              <SidebarContent />
            </div>
          </div>}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-80 glass-card border-r border-primary/20">
        <div className="flex flex-col w-full h-full">
          <SidebarContent />
        </div>
      </aside>
    </>;
};
export default Sidebar;