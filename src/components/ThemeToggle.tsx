import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const ThemeToggle = () => {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const displayTheme = (theme === "system" ? resolvedTheme : theme) ?? "dark";

  useEffect(() => {
    if (theme === "system") {
      setTheme((resolvedTheme ?? "dark") as "light" | "dark");
    }
  }, [theme, resolvedTheme, setTheme]);

  const onThemeChange = (value: string) => {
    if (!value) return;
    setTheme(value);
  };

  return (
    <div className="glass-card p-1 rounded-full">
      <ToggleGroup
        type="single"
        value={displayTheme}
        onValueChange={onThemeChange}
        variant="outline"
        size="sm"
        className="gap-1"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="light"
              aria-label="Light theme"
              className={cn(
                "h-9 w-9 p-0 rounded-full border-0",
                "text-foreground/80 hover:text-foreground",
                "hover:bg-muted/70",
                "data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
              )}
            >
              <Sun className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent className="glass-card">Light</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="dark"
              aria-label="Dark theme"
              className={cn(
                "h-9 w-9 p-0 rounded-full border-0",
                "text-foreground/80 hover:text-foreground",
                "hover:bg-muted/70",
                "data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
              )}
            >
              <Moon className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent className="glass-card">Dark</TooltipContent>
        </Tooltip>
      </ToggleGroup>
      <span className="sr-only">Theme toggle</span>
    </div>
  );
};

export default ThemeToggle;
