import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' }
];

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-[hsl(var(--text-secondary))] hidden sm:block" />
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[90px] sm:w-[140px] h-8 sm:h-9 border-[hsl(var(--border))] bg-transparent text-white hover:bg-[hsl(var(--muted))] transition-colors text-xs sm:text-sm">
          <SelectValue placeholder={t('common.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center space-x-2">
                <span>{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
