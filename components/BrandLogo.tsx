import React from 'react';
import logoUrl from '../Logo.png';

export interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', compact = false }) => (
  <span className={`brand-logo ${compact ? 'brand-logo--compact' : ''} ${className}`}>
    <img src={logoUrl} alt="NDee — Many minds. One Tribe." />
  </span>
);
