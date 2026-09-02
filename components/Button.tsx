import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex min-h-11 items-center justify-center rounded-2xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ndee-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  
  const variants = {
    primary: "bg-[var(--ndee-primary)] text-white shadow-sm hover:bg-[var(--ndee-primary-strong)]",
    secondary: "bg-[var(--ndee-lilac)] text-[var(--ndee-ink)] hover:bg-[#ddd5ec]",
    soft: "bg-[var(--ndee-sage)] text-[var(--ndee-ink)] hover:bg-[#d2e2d8]",
    outline: "border border-[var(--ndee-border)] bg-white/70 text-[var(--ndee-ink)] hover:bg-white",
    danger: "bg-[var(--ndee-danger)] text-white shadow-sm hover:bg-[#9d4a53]",
    ghost: "bg-transparent text-[var(--ndee-muted)] hover:bg-white/80 hover:text-[var(--ndee-ink)]"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-base sm:text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
