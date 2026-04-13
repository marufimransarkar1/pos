import { useEffect } from 'react';
import { useSettingsStore } from '../store';

export default function AppInitializer({ children }) {
  const { fetchSettings, isLoading } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}