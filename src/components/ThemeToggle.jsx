"use client"
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
