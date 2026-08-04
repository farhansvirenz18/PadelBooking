"use client"
import Image from 'next/image';

export default function UserAvatar({ avatarUrl, firstName, lastName, size = 36, className = '', isLoading = false }) {
  const initials = `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();

  if (isLoading) {
    return (
      <div className={`rounded-full bg-surface-container animate-pulse flex-shrink-0 ${className}`} style={{ width: size, height: size }} />
    );
  }

  if (avatarUrl) {
    return (
      <div className={`rounded-full overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-primary flex items-center justify-center text-on-primary font-bold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || '?'}
    </div>
  );
}
