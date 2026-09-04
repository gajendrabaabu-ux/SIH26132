import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  function changeLang(newLang) {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }

  // t = "translate" — pass a key, get back the right-language string
  function t(key) {
    return translations[lang][key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}