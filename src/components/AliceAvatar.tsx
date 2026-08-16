import React from 'react';
import aliceAvatarImg from '../assets/images/Alice avatar.png';

interface AliceAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

export const AliceAvatar: React.FC<AliceAvatarProps> = ({
  size = 'md',
  showStatus = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const statusSize = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-5 h-5 border-2',
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-tr from-amber-200 via-rose-200 to-amber-100 p-0.5 shadow-sm hover:shadow-md transition-shadow ring-1 ring-amber-300/40 flex items-center justify-center overflow-hidden`}
      >
        <div className="w-full h-full rounded-[14px] bg-amber-50/90 flex items-center justify-center relative overflow-hidden group">
          <img
            src={aliceAvatarImg}
            alt="Alice Avatar"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-[14px] transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSize[size]} bg-emerald-500 rounded-full border-white dark:border-zinc-900 shadow-sm animate-pulse`}
          title="Alice đang trực tuyến"
        />
      )}
    </div>
  );
};
