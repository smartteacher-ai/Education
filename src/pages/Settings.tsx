import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { Save, Key, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export function Settings() {
  const { settings, updateSettings } = useStore();
  const { t } = useTranslation();
  
  const [apiKey, setApiKey] = useState(settings.userApiKey || '');
  const [language, setLanguage] = useState(settings.language);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({
      userApiKey: apiKey.trim() === '' ? null : apiKey.trim(),
      language: language as 'ar' | 'en'
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('settings')}</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8"
      >
        {/* Language Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            <Globe className="text-emerald-600" />
            <h2>{t('language')}</h2>
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                value="ar" 
                checked={language === 'ar'} 
                onChange={() => setLanguage('ar')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">العربية (Arabic)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                value="en" 
                checked={language === 'en'} 
                onChange={() => setLanguage('en')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">English</span>
            </label>
          </div>
        </div>

        {/* API Key Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            <Key className="text-emerald-600" />
            <h2>{t('api_key')}</h2>
          </div>
          
          <p className="text-sm text-slate-500">{t('api_key_desc')}</p>
          
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            dir="ltr"
          />
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Save size={18} />
            {t('save')}
          </button>
          
          {saved && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-emerald-600 font-medium"
            >
              {t('saved')}
            </motion.span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
