export type SourceType = 'Audio' | 'PDF';
export type ContentType = 'Transcription' | 'Lesson Plan' | 'Assignment' | 'Summary' | 'Full Course' | 'Exam';
export type Status = 'Processing' | 'Completed' | 'Failed';

export interface GeneratedContent {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  createdAt: string;
}

export interface SourceMaterial {
  id: string;
  sourceType: SourceType;
  fileName: string;
  status: Status;
  extractedText: string;
  generatedContent: GeneratedContent[];
  createdAt: string;
  audioBlob?: Blob;
  duration?: number;
}

export interface UserSettings {
  apiUsageCount: number;
  lastUsageDate: string;
  userApiKey: string | null;
  language: 'ar' | 'en';
}
