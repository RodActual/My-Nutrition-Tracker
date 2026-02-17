'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { calculateTargets, lbsToKg, ftInToCm } from '@/lib/nutrition';

export default function Onboarding() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  
  const [formData, setFormData] = useState({
    weight: '',
    heightFt: '',
    heightIn: '',
    age: '',
    gender: 'male',
    activityLevel: 1.2,
    goal: 'maintain'
  });

  // FIX: We use setTimeout to move the update to the "next tick"
  // This satisfies the "Synchronous setState" linter error AND fixes Hydration issues
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUser = localStorage.getItem('selectedUser');
      if (!storedUser) {
        router.push('/');
      } else {
        setUserId(storedUser);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) return;

    // Convert to Metric
    const weightKg = lbsToKg(parseFloat(formData.weight));
    const heightCm = ftInToCm(parseInt(formData.heightFt), parseInt(formData.heightIn));
    
    // Calculate Targets
    const targets = calculateTargets(
      weightKg, 
      heightCm, 
      parseInt(formData.age), 
      formData.gender, 
      formData.activityLevel, 
      formData.goal
    );

    try {
      await setDoc(doc(db, "users", userId), {
        profile: {
          ...formData,
          weightKg,
          heightCm,
          lastUpdated: new Date().toISOString()
        },
        targets: targets
      }, { merge: true });

      alert("Profile Saved!");
      router.push('/'); 
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  // Show High-Contrast Loading state while checking
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-black text-gray-900 animate-pulse">CHECKING USER...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-black text-black mb-6 capitalize tracking-tight">
          Setup Profile for {userId.replace('_uid', '')}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Weight (lbs)</label>
            <input 
              type="number" 
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg font-bold text-black focus:border-blue-600 focus:ring-0"
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Height (ft)</label>
              <input 
                type="number" 
                required
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg font-bold text-black focus:border-blue-600 focus:ring-0"
                onChange={(e) => setFormData({...formData, heightFt: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Height (in)</label>
              <input 
                type="number" 
                required
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg font-bold text-black focus:border-blue-600 focus:ring-0"
                onChange={(e) => setFormData({...formData, heightIn: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Age</label>
            <input 
              type="number" 
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg font-bold text-black focus:border-blue-600 focus:ring-0"
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-1">Goal</label>
            <select 
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg font-bold text-black focus:border-blue-600 focus:ring-0"
              onChange={(e) => setFormData({...formData, goal: e.target.value})}
            >
              <option value="maintain">Maintain Weight</option>
              <option value="lose">Lose Weight (1lb/week)</option>
              <option value="gain">Gain Weight (1lb/week)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-700 text-white font-black text-xl py-4 rounded-xl hover:bg-blue-800 transition shadow-lg active:scale-95"
          >
            CALCULATE & SAVE
          </button>
        </form>
      </div>
    </main>
  );
}