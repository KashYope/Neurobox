import React, { useState } from 'react';
import { useTranslation } from '../src/i18nContext';

export const ContactAddress: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [revealed, setRevealed] = useState(false);
  const address = revealed ? ['cestmoikash', '+', 'neuro'].join('') + String.fromCharCode(64) + ['gmail', 'com'].join('.') : '';
  return <div className="mt-2 space-y-2">
    {revealed ? <a className="ndee-focus inline-flex min-h-11 items-center break-all rounded-lg underline" href={`mailto:${address}`}>{address}</a> : <>
      <p className="break-words">cestmoikash+neuro [@] gmail [.] com</p>
      <button className="ndee-menu-item border" onClick={() => setRevealed(true)}>{t('legal.revealEmail')}</button>
    </>}
  </div>;
};
