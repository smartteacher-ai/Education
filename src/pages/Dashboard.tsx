import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { FileText, BookOpen, FileCheck, Plus, Mic, UploadCloud } from 'lucide-react';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { materials, loadNotes, isLoading, settings } = useStore(state => ({
    materials: state.materials,
    loadNotes: state.loadMaterials,
    isLoading: state.isLoading,
    settings: state.settings
  }));
  const { t } = useTranslation();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const totalNotes = materials.length;
  const lessonPlans = materials.reduce((acc, note) => acc + note.generatedContent.filter(c => c.type === 'Lesson Plan').length, 0);
  const exams = materials.reduce((acc, note) => acc + note.generatedContent.filter(c => c.type === 'Exam').length, 0);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('dashboard')}</h1>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
            {t('api_quota')}: <span className={settings.userApiKey ? "text-emerald-600" : (3 - settings.apiUsageCount > 0 ? "text-emerald-600" : "text-red-600")}>
              {settings.userApiKey ? t('unlimited_access') : t('requests_remaining', { remaining: Math.max(0, 3 - settings.apiUsageCount) })}
            </span>
          </div>
          <Link
            to="/new"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all font-medium"
          >
            <Plus size={20} />
            {t('create_first')}
          </Link>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <StatCard title={t('total_materials')} value={totalNotes} icon={<UploadCloud size={24} />} color="bg-blue-50 text-blue-600" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title={t('lesson_plans')} value={lessonPlans} icon={<BookOpen size={24} />} color="bg-emerald-50 text-emerald-600" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title={t('exams_created')} value={exams} icon={<FileCheck size={24} />} color="bg-amber-50 text-amber-600" />
        </motion.div>
      </motion.div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">{t('recent_activity')}</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : materials.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200 p-12 text-center shadow-sm"
          >
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('no_materials')}</h3>
            <p className="text-slate-500 mb-6">{t('start_upload')}</p>
            <Link
              to="/new"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all font-medium"
            >
              <Plus size={20} />
              {t('create_first')}
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.slice(0, 6).map((note) => (
              <motion.div variants={item} key={note.id}>
                <Link to={`/library/${note.id}`} className="block group h-full">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-slate-900 truncate pe-4 group-hover:text-emerald-600 transition-colors" dir="auto">
                        {note.fileName}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        note.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        note.status === 'Processing' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t(note.status.toLowerCase()) || note.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1" dir="auto">
                      {note.extractedText || t('processing')}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                      <span>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                      <span className="bg-slate-100 px-2 py-1 rounded text-slate-500">{note.sourceType}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
