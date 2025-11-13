'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  kk: 'Қазақша',
  ja: '日本語',
  la: 'Latin',
  qya: 'Quenya (Elvish)',
  'mis-x-dot': 'Dothraki',
  tlh: 'Klingon',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    // Replace locale in pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 border rounded-md bg-background text-sm h-[42px] w-[140px] truncate"
      title={LANGUAGE_NAMES[locale]}
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {LANGUAGE_NAMES[loc]}
        </option>
      ))}
    </select>
  );
}
