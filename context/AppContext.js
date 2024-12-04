import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backup', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBackups(data.data);
      } else {
        setError(data.error);
        showNotification(data.error, 'error');
      }
    } catch (err) {
      setError('Errore nel caricamento dei backup');
      showNotification('Errore nel caricamento dei backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    notifications,
    showNotification,
    backups,
    setBackups,
    loading,
    setLoading,
    error,
    setError,
    loadBackups
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve essere usato dentro un AppProvider');
  }
  return context;
};