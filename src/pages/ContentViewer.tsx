import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import { generateContentFromText } from '../lib/ai';
import { ArrowLeft, ArrowRight, FileText, BookOpen, FileCheck, Copy, Printer, Loader2, Play, Pause, Layers } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentType } from '../types';

export function ContentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { materials, loadMaterials, addGeneratedContent, settings } = useStore(state => ({
    materials: state.materials,
    loadMaterials: state.loadMaterials,
    addGeneratedContent: state.addGeneratedContent,
    settings: state.settings
  }));
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [activeTab, setActiveTab] = useState<ContentType | 'Extracted Text'>('Extracted Text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const material = materials.find((m) => m.id === id);

  useEffect(() => {
    if (material && material.sourceType === 'Audio' && material.audioBlob && !audioUrl) {
      const url = URL.createObjectURL(material.audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [material, audioUrl]);

  if (!material) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const handleGenerate = async (type: Exclude<ContentType, 'Transcription'>) => {
    if (!material.extractedText) return;
    
    setIsGenerating(true);
    try {
      const { title, body } = await generateContentFromText(
        material.extractedText, 
        type, 
        i18n.language as 'ar' | 'en'
      );
      
      const newContent = {
        id: uuidv4(),
        type,
        title,
        body,
        createdAt: new Date().toISOString(),
      };
      
      await addGeneratedContent(material.id, newContent);
      setActiveTab(type);
    } catch (error) {
      console.error('Error generating content:', error);
      alert(t('generation_failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const activeContent = activeTab === 'Extracted Text' 
    ? { title: t('extracted_text'), body: material.extractedText || t('processing_or_failed') }
    : material.generatedContent.find(c => c.type === activeTab) || { title: t('not_generated'), body: t('click_to_generate', { type: t(activeTab.toLowerCase().replace(' ', '_')) }) };

  const hasContent = activeTab === 'Extracted Text' ? !!material.extractedText : material.generatedContent.some(c => c.type === activeTab);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${activeContent.title}\n\n${activeContent.body}`);
    alert(t('copied_to_clipboard'));
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: { id: ContentType | 'Extracted Text', icon: React.ReactNode, label: string }[] = [
    { id: 'Extracted Text', icon: <FileText size={18} />, label: t('extracted_text') },
    { id: 'Lesson Plan', icon: <BookOpen size={18} />, label: t('lesson_plan') },
    { id: 'Assignment', icon: <FileCheck size={18} />, label: t('assignment') },
    { id: 'Summary', icon: <FileText size={18} />, label: t('summary') },
    { id: 'Full Course', icon: <Layers size={18} />, label: t('full_course') },
    { id: 'Exam', icon: <FileText size={18} />, label: t('exam') },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 pb-12"
    >
      <button 
        onClick={() => navigate('/library')}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium mb-4"
      >
        {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {t('back_to_library')}
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {material.sourceType}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight" dir="auto">{material.fileName}</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {format(new Date(material.createdAt), 'MMMM d, yyyy')}
              {material.sourceType === 'Audio' && material.duration && ` • ${Math.floor(material.duration / 60)}:${(material.duration % 60).toString().padStart(2, '0')}`}
            </p>
          </div>
          
          {audioUrl && material.sourceType === 'Audio' && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-full border border-slate-200 shadow-sm">
              <button 
                onClick={toggleAudio}
                className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors"
              >
                {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ms-1" />}
              </button>
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
                controls
              />
              <span className="text-sm font-medium text-slate-600 pe-4">{t('original_audio')}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-2 hide-scrollbar">
          {tabs.map((tab) => (
            <TabButton 
              key={tab.id}
              active={activeTab === tab.id} 
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
              hasContent={tab.id !== 'Extracted Text' && material.generatedContent.some(c => c.type === tab.id)}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="p-8 bg-white min-h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-slate-800">{activeContent.title}</h2>
            
            {hasContent && (
              <div className="flex items-center gap-2 print:hidden">
                <ActionButton icon={<Copy size={16} />} label={t('copy')} onClick={handleCopy} />
                <ActionButton icon={<Printer size={16} />} label={t('print')} onClick={handlePrint} />
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!hasContent && activeTab !== 'Extracted Text' ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  {tabs.find(t => t.id === activeTab)?.icon}
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t('no_content_generated', { type: t(activeTab.toLowerCase().replace(' ', '_')) })}</h3>
                <p className="text-slate-500 mb-6 max-w-md">
                  {t('generate_prompt', { type: t(activeTab.toLowerCase().replace(' ', '_')) })}
                </p>
                <button
                  onClick={() => handleGenerate(activeTab as Exclude<ContentType, 'Transcription'>)}
                  disabled={isGenerating || !material.extractedText}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                >
                  {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                  {isGenerating ? t('generating') : t('generate_button', { type: t(activeTab.toLowerCase().replace(' ', '_')) })}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                ref={contentRef}
                className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-emerald-600"
                dir="auto"
              >
                {/* Simple markdown rendering */}
                {activeContent.body.split('\n').map((paragraph, i) => {
                  if (paragraph.startsWith('### ')) return <h4 key={i} className="text-lg font-semibold mt-6 mb-2">{paragraph.replace('### ', '')}</h4>;
                  if (paragraph.startsWith('## ')) return <h3 key={i} className="text-xl font-semibold mt-8 mb-3">{paragraph.replace('## ', '')}</h3>;
                  if (paragraph.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('# ', '')}</h2>;
                  if (paragraph.startsWith('- ')) return <li key={i} className="ms-4 mb-1">{paragraph.replace('- ', '')}</li>;
                  if (paragraph.startsWith('* ')) return <li key={i} className="ms-4 mb-1">{paragraph.replace('* ', '')}</li>;
                  if (paragraph.trim() === '') return <br key={i} />;
                  return <p key={i} className="mb-4 leading-relaxed text-slate-700">{paragraph}</p>;
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label, hasContent }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, hasContent?: boolean, key?: React.Key }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
        active 
          ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
      {hasContent && <span className="w-2 h-2 rounded-full bg-emerald-600 ms-1"></span>}
    </button>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
