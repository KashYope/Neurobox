import React from 'react';
import { Copyright, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface BuyMeACoffeeButtonProps {
  onSupport?: () => void;
}

export const BuyMeACoffeeButton: React.FC<BuyMeACoffeeButtonProps> = ({ onSupport }) => {
  const { t } = useTranslation(['common']);

  // Simple obfuscation to prevent simple scraping
  const emailParts = ['cestmoikash', '+neuro', '@', 'gmail.com'];
  const email = emailParts.join('');

  return (
    <div className="space-y-3">
      <a
        href="https://buymeacoffee.com/k42h"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#FFDD00] text-black font-bold py-3 rounded-xl hover:bg-[#FFEA00] transition-colors shadow-sm"
        onClick={onSupport}
      >
        <span>{t('adminMenu.buyCoffee')}</span>
      </a>

      <a
        href={`mailto:${email}`}
        className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-600 font-medium py-2 rounded-xl hover:bg-slate-200 transition-colors"
        onClick={onSupport}
      >
        <Mail className="w-4 h-4" />
        <span>{t('adminMenu.feedback')}</span>
      </a>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2">
        <Copyright className="w-3 h-3 scale-x-[-1] inline-block" />
        <span>{t('adminMenu.openSource')}</span>
      </div>
    </div>
  );
};
