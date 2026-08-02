"use client"
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (!mounted) return (
    <button className="relative w-10 h-10 rounded-full flex items-center justify-center" aria-label="Toggle theme">
      <div className="w-5 h-5 rounded-full bg-surface-container animate-pulse" />
    </button>
  );

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high overflow-hidden group"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-[22px] text-on-surface-variant transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:text-on-surface"
        style={{
          transform: dark ? 'rotate(360deg) scale(1)' : 'rotate(0deg) scale(1)',
        }}
      >
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
