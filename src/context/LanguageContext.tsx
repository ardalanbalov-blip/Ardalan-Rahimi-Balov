import React, { createContext, useState, useContext, PropsWithChildren } from 'react';
import { LOCALE_STRINGS } from '../constants';
import { SupportedLanguage } from '../types';

interface LanguageContextType {
  uiLanguage: SupportedLanguage;
  setUiLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const [uiLanguage, setUiLanguage] = useState<SupportedLanguage>('en');

  const t = (key: string) => {
    const keys = key.split('.');
    // @ts-ignore - Dynamic key access on locale strings
    let value: any = LOCALE_STRINGS[uiLanguage];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback to key if missing
      }
    }
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ uiLanguage, setUiLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};


