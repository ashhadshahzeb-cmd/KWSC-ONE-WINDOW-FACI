import { createContext, useContext, useState, ReactNode } from 'react';

export interface GlobalFormData {
  amount?: number | string;
  description?: string;
  name?: string;
  category?: string;
  [key: string]: any;
}

interface VoiceContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  // Generic form filling states for all sections
  openModal: string | null;
  setOpenModal: (type: string | null) => void;
  formData: GlobalFormData;
  setFormData: (data: GlobalFormData) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<GlobalFormData>({});

  return (
    <VoiceContext.Provider value={{ 
      searchQuery, setSearchQuery,
      searchType, setSearchType,
      openModal, setOpenModal,
      formData, setFormData
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
