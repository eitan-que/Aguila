"use client"

import { Dictionary } from "@/actions/dictionaries";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

interface ThemeSelectorProps {
  dictionary: Dictionary;
}

export default function ThemeSelector({ dictionary }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <RadioGroup 
      defaultValue={theme || "system"} 
      className="gap-4 grid grid-cols-3 w-full max-w-md"
      onValueChange={(value) => setTheme(value)}
    >
      <div>
        <RadioGroupItem 
          value="light" 
          id="light" 
          className="sr-only peer"
        />
        <Label 
          htmlFor="light" 
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <SunIcon className="mb-3 w-6 h-6" />
          {dictionary.account.preferences.theme.options.light}
        </Label>
      </div>
      
      <div>
        <RadioGroupItem 
          value="dark" 
          id="dark" 
          className="sr-only peer" 
        />
        <Label 
          htmlFor="dark" 
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <MoonIcon className="mb-3 w-6 h-6" />
          {dictionary.account.preferences.theme.options.dark}
        </Label>
      </div>
      
      <div>
        <RadioGroupItem 
          value="system" 
          id="system" 
          className="sr-only peer" 
        />
        <Label 
          htmlFor="system" 
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <MonitorIcon className="mb-3 w-6 h-6" />
          {dictionary.account.preferences.theme.options.system}
        </Label>
      </div>
    </RadioGroup>
  );
}