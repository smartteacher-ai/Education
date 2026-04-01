import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { UploadCloud, Mic, Square, Loader2, AlertCircle, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { transcribeAudio } from '../lib/ai';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export function NewEntry() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addMaterial, updateMaterial, incrementApiUsage } = useStore();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioSubmission(audioBlob, `Recording-${new Date().toISOString().slice(0, 10)}.webm`);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type === 'application/pdf') {
      await handlePDFSubmission(file);
    } else if (file.type.startsWith('audio/')) {
      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = async () => {
        const duration = Math.round(audio.duration);
        await handleAudioSubmission(file, file.name, duration);
      };
      audio.onerror = async () => {
        await handleAudioSubmission(file, file.name, 0);
      };
    } else {
      setError('Please upload a valid audio or PDF file.');
    }
  };

  const handlePDFSubmission = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    const id = uuidv4();
    const newMaterial = {
      id,
      sourceType: 'PDF' as const,
      fileName: file.name,
      status: 'Processing' as const,
      extractedText: '',
      generatedContent: [],
      createdAt: new Date().toISOString(),
    };

    try {
      await addMaterial(newMaterial);
      navigate(`/library/${id}`);
      
      const text = await extractTextFromPDF(file);
      await updateMaterial(id, { 
        extractedText: text, 
        status: 'Completed' 
      });
      
    } catch (err) {
      console.error('PDF processing error:', err);
      await updateMaterial(id, { status: 'Failed' });
      setError(t('error_processing'));
      setIsProcessing(false);
    }
  };

  const handleAudioSubmission = async (blob: Blob, fileName: string, duration?: number) => {
    if (!incrementApiUsage()) {
      setError(t('quota_exceeded'));
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    const id = uuidv4();
    const newMaterial = {
      id,
      sourceType: 'Audio' as const,
      fileName,
      status: 'Processing' as const,
      extractedText: '',
      generatedContent: [],
      createdAt: new Date().toISOString(),
      audioBlob: blob,
      duration: duration !== undefined ? duration : recordingTime,
    };

    try {
      await addMaterial(newMaterial);
      navigate(`/library/${id}`);
      
      const transcription = await transcribeAudio(blob, blob.type || 'audio/webm');
      await updateMaterial(id, { 
        extractedText: transcription, 
        status: 'Completed' 
      });
      
    } catch (err) {
      console.error('Processing error:', err);
      await updateMaterial(id, { status: 'Failed' });
      setError(t('error_processing'));
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('upload_center')}</h1>
        <p className="text-slate-500 mt-2">{t('start_upload')}</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} />
          <p>{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Record Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] hover:shadow-md transition-shadow"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all ${
            isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'
          }`}>
            <Mic size={32} />
          </div>
          
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            {isRecording ? t('processing') : t('record_audio')}
          </h2>
          
          {isRecording && (
            <p className="text-3xl font-mono text-slate-700 mb-6" dir="ltr">{formatTime(recordingTime)}</p>
          )}
          
          {!isRecording && (
            <p className="text-slate-500 mb-8">{t('record_desc')}</p>
          )}

          {isProcessing ? (
            <button disabled className="flex items-center gap-2 bg-slate-100 text-slate-500 px-6 py-3 rounded-full font-medium">
              <Loader2 size={20} className="animate-spin" />
              {t('processing')}
            </button>
          ) : isRecording ? (
            <button 
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-sm"
            >
              <Square size={20} className="fill-current" />
              {t('stop_recording')}
            </button>
          ) : (
            <button 
              onClick={startRecording}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-sm"
            >
              <Mic size={20} />
              {t('start_recording')}
            </button>
          )}
        </motion.div>

        {/* Upload Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
        >
          <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-6">
            <FileText size={32} />
          </div>
          
          <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('upload_pdf')}</h2>
          <p className="text-slate-500 mb-8">{t('drag_drop_pdf')}</p>
          
          <label className={`flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-colors shadow-sm cursor-pointer ${
            isProcessing || isRecording 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600'
          }`}>
            <UploadCloud size={20} />
            {t('select_file')}
            <input 
              type="file" 
              accept="audio/*,application/pdf" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isProcessing || isRecording}
            />
          </label>
        </motion.div>
      </div>
    </div>
  );
}
