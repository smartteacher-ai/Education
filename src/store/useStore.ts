import { create } from 'zustand';
import { SourceMaterial, GeneratedContent, UserSettings } from '../types';
import { getAllSourceMaterials, saveSourceMaterial, deleteSourceMaterial } from '../lib/db';

interface EduVoiceState {
  materials: SourceMaterial[];
  isLoading: boolean;
  settings: UserSettings;
  loadMaterials: () => Promise<void>;
  addMaterial: (material: SourceMaterial) => Promise<void>;
  updateMaterial: (id: string, updates: Partial<SourceMaterial>) => Promise<void>;
  removeMaterial: (id: string) => Promise<void>;
  addGeneratedContent: (materialId: string, content: GeneratedContent) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => void;
  incrementApiUsage: () => boolean;
}

const defaultSettings: UserSettings = {
  apiUsageCount: 0,
  lastUsageDate: new Date().toISOString().slice(0, 10),
  userApiKey: null,
  language: 'ar',
};

const getInitialSettings = (): UserSettings => {
  const stored = localStorage.getItem('eduvoice-settings');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Reset usage if it's a new day
      const today = new Date().toISOString().slice(0, 10);
      if (parsed.lastUsageDate !== today) {
        parsed.apiUsageCount = 0;
        parsed.lastUsageDate = today;
        localStorage.setItem('eduvoice-settings', JSON.stringify(parsed));
      }
      return { ...defaultSettings, ...parsed };
    } catch (e) {
      return defaultSettings;
    }
  }
  return defaultSettings;
};

export const useStore = create<EduVoiceState>((set, get) => ({
  materials: [],
  isLoading: true,
  settings: getInitialSettings(),
  
  loadMaterials: async () => {
    set({ isLoading: true });
    const materials = await getAllSourceMaterials();
    materials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    set({ materials, isLoading: false });
  },
  
  addMaterial: async (material) => {
    await saveSourceMaterial(material);
    set((state) => ({ materials: [material, ...state.materials] }));
  },
  
  updateMaterial: async (id, updates) => {
    const { materials } = get();
    const existing = materials.find((m) => m.id === id);
    if (existing) {
      const updated = { ...existing, ...updates };
      await saveSourceMaterial(updated);
      set((state) => ({
        materials: state.materials.map((m) => (m.id === id ? updated : m)),
      }));
    }
  },
  
  removeMaterial: async (id) => {
    await deleteSourceMaterial(id);
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
    }));
  },
  
  addGeneratedContent: async (materialId, content) => {
    const { materials } = get();
    const existing = materials.find((m) => m.id === materialId);
    if (existing) {
      const updated = {
        ...existing,
        generatedContent: [...existing.generatedContent, content],
      };
      await saveSourceMaterial(updated);
      set((state) => ({
        materials: state.materials.map((m) => (m.id === materialId ? updated : m)),
      }));
    }
  },
  
  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      localStorage.setItem('eduvoice-settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },
  
  incrementApiUsage: () => {
    const { settings, updateSettings } = get();
    if (settings.userApiKey) return true; // Unlimited
    
    const today = new Date().toISOString().slice(0, 10);
    if (settings.lastUsageDate !== today) {
      updateSettings({ apiUsageCount: 1, lastUsageDate: today });
      return true;
    }
    
    if (settings.apiUsageCount < 3) {
      updateSettings({ apiUsageCount: settings.apiUsageCount + 1 });
      return true;
    }
    
    return false; // Limit reached
  }
}));
