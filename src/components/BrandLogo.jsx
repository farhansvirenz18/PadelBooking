import Link from 'next/link';

const sizes = {
  sm: { icon: 20, text: 'text-lg', box: 'w-8 h-8' },
  md: { icon: 24, text: 'text-xl', box: 'w-10 h-10' },
  lg: { icon: 28, text: 'text-2xl', box: 'w-12 h-12' },
};

export default function BrandLogo({ size = 'md', showText = true }) {
  const s = sizes[size] || sizes.md;
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className={`${s.box} rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow`}>
        <span className="material-symbols-outlined text-on-primary" style={{ fontSize: s.icon }}>sports_tennis</span>
      </div>
      {showText && (
        <span className={`font-display font-bold text-on-surface ${s.text}`}>PadelBook</span>
      )}
    </Link>
  );
}
