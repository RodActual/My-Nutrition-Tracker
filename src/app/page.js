'use client';

import { useState, useEffect } from 'react';
import UserSwitcher from '@/components/user-switcher';
import Dashboard from '@/components/dashboard';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // FIX: We use setTimeout to move the update to the "next tick"
    // This satisfies the "Synchronous setState" linter error AND fixes Hydration issues
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('selectedUser');
      if (savedUser) {
        setCurrentUser(savedUser);
      }
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (userId) => {
    localStorage.setItem('selectedUser', userId);
    setCurrentUser(userId);
  };

  const handleSignOut = () => {
    localStorage.removeItem('selectedUser');
    setCurrentUser(null);
  };

  // 1. Show a loading screen first (matches Server and Client initial state)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-bold tracking-wider animate-pulse">INITIALIZING...</p>
      </div>
    );
  }

  // 2. If no user found, show the Switcher
  if (!currentUser) {
    return <UserSwitcher onSelect={handleSelect} />;
  }

  // 3. Otherwise, show the Dashboard
  return (
    <Dashboard 
      userId={currentUser} 
      onSignOut={handleSignOut} 
    />
  );
}