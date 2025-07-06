
"use client";

import { useThemeStore } from '@/stores/themeStore';
import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const lightColors = useThemeStore((state) => state.lightColors);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Dynamically create CSS variables string from the lightColors state.
  // This will override the defaults in globals.css for the light theme.
  const cssVariables = `
    :root {
      --background: ${lightColors.background};
      --primary: ${lightColors.primary};
      --accent: ${lightColors.accent};
    }
  `;

  return (
    <>
      {/* Inject a style tag to override CSS variables only when in light mode. */}
      {/* Dark theme will continue to use the defaults set in globals.css. */}
      {theme === 'light' && <style>{cssVariables}</style>}
      {children}
    </>
  );
}
