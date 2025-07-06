
"use client";

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { colord, extend } from 'colord';
import hsl from 'colord/plugins/hsl';

extend([hsl]);

// Helper to convert HSL string "H S% L%" to a hex color for the color picker
const hslStringToHex = (hslString: string) => {
    if (!hslString) return '#000000';
    const [h, s, l] = hslString.split(' ').map(v => parseFloat(v.replace('%', '')));
    return colord({ h, s, l }).toHex();
};

// Helper to convert a hex color from the picker to an HSL string "H S% L%" for storage
const hexToHslString = (hex: string) => {
    const { h, s, l } = colord(hex).toHsl();
    // Format to match CSS HSL space-separated values
    return `${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%`;
};

export default function ThemeSettings() {
  const { theme, lightColors, actions } = useThemeStore();
  
  // Local state for color inputs to prevent lag during color picking
  const [localPrimary, setLocalPrimary] = useState(hslStringToHex(lightColors.primary));
  const [localBackground, setLocalBackground] = useState(hslStringToHex(lightColors.background));
  const [localAccent, setLocalAccent] = useState(hslStringToHex(lightColors.accent));

  // Sync local color picker state when the global store changes (e.g., on reset or initial load)
  useEffect(() => {
    setLocalPrimary(hslStringToHex(lightColors.primary));
    setLocalBackground(hslStringToHex(lightColors.background));
    setLocalAccent(hslStringToHex(lightColors.accent));
  }, [lightColors]);

  const handleColorChange = (colorName: keyof typeof lightColors, hexValue: string) => {
    const hslValue = hexToHslString(hexValue);
    actions.setLightColor(colorName, hslValue);

    // Update local state immediately for a responsive UI
    if (colorName === 'primary') setLocalPrimary(hexValue);
    if (colorName === 'background') setLocalBackground(hexValue);
    if (colorName === 'accent') setLocalAccent(hexValue);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>Customize the application's appearance. Color settings apply to the light theme only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="theme-toggle" className="flex flex-col space-y-1">
            <span>Theme</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Switch between light and dark mode.
            </span>
          </Label>
          <div className="flex items-center gap-2">
            <span>Light</span>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => actions.setTheme(checked ? 'dark' : 'light')}
            />
            <span>Dark</span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Customize Light Theme Colors</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={localPrimary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="p-1 h-10 w-10"
                />
                <span className="text-sm text-muted-foreground">{localPrimary.toUpperCase()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-color">Background</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={localBackground}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="p-1 h-10 w-10"
                />
                 <span className="text-sm text-muted-foreground">{localBackground.toUpperCase()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={localAccent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="p-1 h-10 w-10"
                />
                <span className="text-sm text-muted-foreground">{localAccent.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={actions.resetToDefaults}>
          Reset to Defaults
        </Button>
      </CardFooter>
    </Card>
  );
}
