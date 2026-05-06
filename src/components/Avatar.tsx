import React from 'react';
import { cn } from '../lib/utils';

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ name, avatar, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const isColor = avatar?.startsWith('#');
  const isBase64 = avatar?.startsWith('data:image');

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center font-black text-white shadow-sm overflow-hidden shrink-0",
        sizeClasses[size],
        !avatar && "bg-slate-400",
        className
      )}
      style={{ 
        backgroundColor: isColor ? avatar : undefined,
      }}
    >
      {isBase64 ? (
        <img 
          src={avatar} 
          alt={name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
