import { GoogleGenAI } from '@google/genai';
import { useStore } from '../store/useStore';

function getAIClient() {
  const { settings } = useStore.getState();
  const apiKey = settings.userApiKey || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey as string });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudio(audioBlob: Blob, mimeType: string): Promise<string> {
  try {
    const ai = getAIClient();
    const base64Data = await blobToBase64(audioBlob);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Please provide a detailed and accurate transcription of this audio. Do not add any extra commentary, just the transcription.',
            },
          ],
        },
      ],
    });
    
    return response.text || 'No transcription generated.';
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio.');
  }
}

import { ContentType } from '../types';

export async function generateContentFromText(
  text: string,
  type: Exclude<ContentType, 'Transcription'>,
  language: 'ar' | 'en'
): Promise<{ title: string; body: string }> {
  const ai = getAIClient();
  let prompt = '';
  
  const langInstruction = language === 'ar' ? 'Generate the response entirely in Arabic.' : 'Generate the response in English.';
  
  if (type === 'Lesson Plan') {
    prompt = `You are an expert educator. Based on the following text, create a structured lesson plan. 
Include: Title, Objective, Materials Needed, Introduction, Main Activity, Conclusion, Assessment.
${langInstruction}

Text:
"${text}"

Format the output in clean Markdown.`;
  } else if (type === 'Assignment') {
    prompt = `You are an expert educator. Based on the following text, create a student-friendly assignment.
Include: Assignment Title, Instructions, Tasks/Questions, Grading Criteria.
${langInstruction}

Text:
"${text}"

Format the output in clean Markdown.`;
  } else if (type === 'Summary') {
    prompt = `You are an expert educator. Provide a concise summary of the following text.
Include: Title, Key Points, Action Items.
${langInstruction}

Text:
"${text}"

Format the output in clean Markdown.`;
  } else if (type === 'Full Course') {
    prompt = `You are an expert curriculum designer. Based on the following text, create a structured "Full Course" outline.
Include: Course Title, Course Description, Modules (each with a title and brief description), and Lessons within each module.
${langInstruction}

Text:
"${text}"

Format the output in clean Markdown.`;
  } else if (type === 'Exam') {
    prompt = `You are an expert educator. Based on the following text, generate a comprehensive Exam.
Include: Exam Title, Multiple Choice Questions (with options), Short Answer Questions, and an Answer Key at the end.
${langInstruction}

Text:
"${text}"

Format the output in clean Markdown.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const responseText = response.text || '';
    
    const lines = responseText.split('\n');
    let title = `${type} based on Source`;
    let body = responseText;
    
    if (lines.length > 0 && lines[0].startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      body = lines.slice(1).join('\n').trim();
    }
    
    return { title, body };
  } catch (error) {
    console.error('Content generation error:', error);
    throw new Error(`Failed to generate ${type}.`);
  }
}
