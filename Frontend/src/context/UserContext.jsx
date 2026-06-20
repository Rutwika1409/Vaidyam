import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem('vaidyam_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('vaidyam_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.language || 'en';
      }
    } catch {}
    return 'en';
  });

  // Theme state management (light / dark)
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('vaidyam_theme');
      return saved || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('vaidyam_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Keep language state synced if user changes
  useEffect(() => {
    if (user?.language) {
      setLanguageState(user.language);
    }
  }, [user]);

  const setUser = (newUser) => {
    if (newUser) {
      localStorage.setItem('vaidyam_user', JSON.stringify(newUser));
      setUserState(newUser);
      if (newUser.language) {
        setLanguageState(newUser.language);
      }
    } else {
      localStorage.removeItem('vaidyam_user');
      setUserState(null);
    }
  };

  const changeLanguage = async (newLang) => {
    setLanguageState(newLang);
    if (user && user.id) {
      const updatedUser = { ...user, language: newLang };
      setUser(updatedUser);
      try {
        await api.put(`/api/users/${user.id}`, { language: newLang });
      } catch (err) {
        console.error('Failed to sync language selection with server:', err);
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    toast.success('Successfully logged out.');
  };

  return (
    <UserContext.Provider value={{ user, setUser, language, setLanguage: changeLanguage, logout, theme, toggleTheme }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
