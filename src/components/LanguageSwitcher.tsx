'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { locales, localeNames, Locale } from '@/i18n/config';

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleChange(locale)}
          disabled={isPending || locale === currentLocale}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            locale === currentLocale
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } disabled:cursor-not-allowed`}
        >
          {locale === 'en' ? 'EN' : 'PT'}
        </button>
      ))}
    </div>
  );
}
