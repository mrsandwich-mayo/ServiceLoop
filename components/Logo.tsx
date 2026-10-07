import { Activity } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  light?: boolean;
  className?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  href,
  light = false,
  className = '',
}: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-10 h-10 rounded-xl',
  };

  const symbolSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  const textSizes = {
    sm: 'text-sm font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Modern High-Tech SaaS Icon Badge */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white border border-zinc-800/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_4px_rgba(0,0,0,0.15)] transition-all duration-200 group-hover:border-zinc-700`}
      >
        <Activity className={`${symbolSizes[size]} text-indigo-400 stroke-[2.2]`} />
      </div>

      {/* Modern Typographic Wordmark */}
      {showText && (
        <span
          className={`tracking-tight font-sans font-extrabold ${textSizes[size]} ${
            light ? 'text-white' : 'text-zinc-950'
          }`}
        >
          Service<span className="text-indigo-600">Loop</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
