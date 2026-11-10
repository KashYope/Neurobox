import React from 'react';
import { useTranslation } from '../src/i18nContext';
import { ContactAddress } from './ContactAddress';

export type LegalTopic = 'terms' | 'notice' | 'privacy' | 'contact';

export const LegalInformation: React.FC<{ topic: LegalTopic }> = ({ topic }) => {
  const { t } = useTranslation(['common']);
  const sections = topic === 'terms' ? ['purpose', 'use', 'contributions', 'external'] : topic === 'notice' ? ['publisher', 'hosting', 'contact'] : topic === 'contact' ? ['contact'] : ['local', 'server', 'cookies', 'rights'];
  return <div className="space-y-5 px-2 py-3 text-sm leading-relaxed">
    {sections.map(section => <section key={section}><h3 className="mb-1 font-semibold">{t(`legal.${section}.title`)}</h3><p>{t(`legal.${section}.text`)}</p>
      {section === 'contact' || section === 'rights' ? <ContactAddress /> : null}
      {section === 'hosting' && <a className="ndee-focus inline-flex min-h-11 items-center rounded-lg underline" href="https://contabo.com/en/legal/impressum/" target="_blank" rel="noopener noreferrer">Contabo — {t('legal.notice')}</a>}
      {section === 'rights' && <a className="ndee-focus mt-2 inline-flex min-h-11 items-center rounded-lg underline" href="https://www.autoriteprotectiondonnees.be/citoyen/agir" target="_blank" rel="noopener noreferrer">{t('legal.authority')}</a>}
    </section>)}
  </div>;
};
