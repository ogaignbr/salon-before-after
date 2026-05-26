import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SessionImage } from '../types';

interface SessionContextType {
  images: SessionImage[];
  baseImageId: string | null;
  addImage: (blob: Blob) => SessionImage;
  removeImage: (id: string) => void;
  setBaseImageId: (id: string | null) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<SessionImage[]>([]);
  const [baseImageId, setBaseImageId] = useState<string | null>(null);

  const addImage = useCallback((blob: Blob): SessionImage => {
    const img: SessionImage = {
      id: crypto.randomUUID(),
      blob,
      timestamp: Date.now(),
    };
    setImages((prev) => [...prev, img]);
    return img;
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setBaseImageId((prev) => (prev === id ? null : prev));
  }, []);

  const clearSession = useCallback(() => {
    setImages([]);
    setBaseImageId(null);
  }, []);

  return (
    <SessionContext.Provider value={{ images, baseImageId, addImage, removeImage, setBaseImageId, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
