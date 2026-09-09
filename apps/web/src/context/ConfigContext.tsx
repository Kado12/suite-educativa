import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsService } from '../api/settings.service';

interface ConfigCtx {
  settings: Record<string, string> | null;
  reload: () => Promise<void>;
}

const Ctx = createContext<ConfigCtx>({ settings: null, reload: async () => {} });
export const useConfig = () => useContext(Ctx);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  const reload = async () => {
    try {
      const s = await settingsService.getPublic();
      setSettings(s);
    } catch {
      setSettings({});
    }
  };

  useEffect(() => { reload(); }, []);

  // Título de la pestaña del navegador
  useEffect(() => {
    if (settings) document.title = settings['app.name'] || 'Suite Académica';
  }, [settings]);

  return <Ctx.Provider value={{ settings, reload }}>{children}</Ctx.Provider>;
};