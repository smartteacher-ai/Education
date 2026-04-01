import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router';
import { Mic, LayoutDashboard, Library, Settings, BookOpen, UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export function Layout() {
  const { t, i18n } = useTranslation();
  const { settings } = useStore();

  useEffect(() => {
    i18n.changeLanguage(settings.language);
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language, i18n]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-e border-slate-200 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-sm">
            <BookOpen size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">EduDocs</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label={t('dashboard')} />
          <NavItem to="/new" icon={<UploadCloud size={20} />} label={t('upload_center')} />
          <NavItem to="/library" icon={<Library size={20} />} label={t('library')} />
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <NavItem to="/settings" icon={<Settings size={20} />} label={t('settings')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 shadow-sm z-10">
          <h2 className="text-lg font-medium text-slate-700">{t('welcome')}</h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
          isActive
            ? "bg-emerald-50 text-emerald-700 shadow-sm"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
