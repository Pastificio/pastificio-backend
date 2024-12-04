import { useState, useEffect } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((currentToasts) => currentToasts.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const toast = ({ title, description, variant = 'default' }) => {
    setToasts((currentToasts) => [
      ...currentToasts,
      { id: Date.now(), title, description, variant },
    ]);
  };

  return { toast, toasts };
}