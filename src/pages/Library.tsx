import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router';
import { Search, Filter, Trash2, FileText, BookOpen, FileCheck, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function Library() {
  const { materials, loadMaterials, removeMaterial, isLoading } = useStore(state => ({
    materials: state.materials,
    loadMaterials: state.loadMaterials,
    removeMaterial: state.removeMaterial,
    isLoading: state.isLoading
  }));
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          material.extractedText.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'All') return matchesSearch;
    
    const hasType = material.generatedContent.some(c => c.type === filterType);
    return matchesSearch && hasType;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this material?')) {
      await removeMaterial(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('library')}</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
            />
          </div>
          
          <div className="relative">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 ps-4 pe-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium"
            >
              <option value="All">{t('all_content')}</option>
              <option value="Lesson Plan">{t('lesson_plan')}</option>
              <option value="Assignment">{t('assignment')}</option>
              <option value="Summary">{t('summary')}</option>
              <option value="Full Course">{t('full_course')}</option>
              <option value="Exam">{t('exam')}</option>
            </select>
            <Filter className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm"
        >
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('no_materials')}</h3>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <th className="p-4 ps-6 text-start">{t('name')}</th>
                  <th className="p-4 text-start">{t('date')}</th>
                  <th className="p-4 text-start">{t('type')}</th>
                  <th className="p-4 text-start">{t('status')}</th>
                  <th className="p-4 text-start">{t('generated_content')}</th>
                  <th className="p-4 text-end pe-6">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 ps-6">
                      <Link to={`/library/${material.id}`} className="font-medium text-slate-900 hover:text-emerald-600 block" dir="auto">
                        {material.fileName}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {format(new Date(material.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded">{material.sourceType}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        material.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        material.status === 'Processing' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t(material.status.toLowerCase()) || material.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {material.generatedContent.map((content, i) => (
                          <div key={i} className="bg-slate-100 text-slate-600 p-1.5 rounded-md" title={t(content.type.toLowerCase().replace(' ', '_'))}>
                            {content.type === 'Lesson Plan' && <BookOpen size={16} />}
                            {content.type === 'Assignment' && <FileCheck size={16} />}
                            {content.type === 'Summary' && <FileText size={16} />}
                            {content.type === 'Full Course' && <Layers size={16} />}
                            {content.type === 'Exam' && <FileText size={16} />}
                          </div>
                        ))}
                        {material.generatedContent.length === 0 && (
                          <span className="text-sm text-slate-400 italic">None yet</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-end pe-6">
                      <button 
                        onClick={(e) => handleDelete(e, material.id)}
                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
