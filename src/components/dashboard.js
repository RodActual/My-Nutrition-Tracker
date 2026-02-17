'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, addDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import DailyProgress from './daily-progress';
import BarcodeScanner from './barcode-scanner';
import WeightReminderBanner from './weight-reminder-banner';
import ManualEntry from './manual-entry';
import LogList from './log-list';
import SettingsModal from './settings-modal';
import WeightChart from './weight-chart';
import QuickLog from './quick-log';
import WaterTracker from './water-tracker';
import WeeklyInsights from './weekly-insights';

export default function Dashboard({ userId, onSignOut }) {
  const [userData, setUserData] = useState(null);
  const [todaysLogs, setTodaysLogs] = useState([]); 
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  
  // Navigation State: 'home', 'add', or 'insights'
  const [currentTab, setCurrentTab] = useState('home'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal & UI States
  const [isScanning, setIsScanning] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const changeDate = (days) => {
    const current = new Date(selectedDate + 'T12:00:00'); 
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) setUserData(doc.data());
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    const logsRef = collection(db, "users", userId, "logs");
    const q = query(logsRef, where("date", "==", selectedDate), orderBy("timestamp", "desc"));
    const unsubLogs = onSnapshot(q, (snapshot) => {
      let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
      const logs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        totals.calories += data.calories || 0;
        totals.protein += data.protein || 0;
        totals.carbs += data.carbs || 0;
        totals.fats += data.fats || 0;
        logs.push({ id: doc.id, ...data });
      });
      setDailyTotals(totals);
      setTodaysLogs(logs);
    });
    return () => unsubLogs();
  }, [userId, selectedDate]);

  const logFood = async (product) => {
    const getNutrient = (keyStub) => Math.round(product.nutriments[`${keyStub}_serving`] || product.nutriments[`${keyStub}_100g`] || 0);
    const foodEntry = {
      name: product.product_name || "Unknown Item",
      brand: product.brands || "",
      calories: Math.round(product.nutriments['energy-kcal_serving'] || product.nutriments['energy-kcal_100g'] || 0),
      protein: getNutrient('proteins'),
      carbs: getNutrient('carbohydrates'),
      fats: getNutrient('fat'),
      date: selectedDate,
      timestamp: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, "users", userId, "logs"), foodEntry);
      setScannedProduct(null);
      setIsManualEntryOpen(false);
      setCurrentTab('home'); // Snap back to home after logging
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (logId) => {
    if (confirm("Remove this item?")) await deleteDoc(doc(db, "users", userId, "logs", logId));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Loading Command Center...</div>;

  return (
    <main className="min-h-screen bg-slate-50 pb-32 animate-in fade-in duration-500">
      <WeightReminderBanner lastUpdated={userData?.profile?.lastUpdated} />

      {/* Header - Dynamically titles based on tab */}
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <span className="text-xl">⚙️</span>
          </button>
          <h1 className="text-xl font-black text-slate-800 capitalize">
            {currentTab === 'home' ? 'My Day' : currentTab === 'add' ? 'Log Entry' : 'Insights'}
          </h1>
        </div>
        <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">V1.0 Live</div>
      </header>

      <div className="p-6 max-w-md mx-auto">
        
        {/* TAB 1: HOME (THE VIEW) */}
        {currentTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-300">
            <nav className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
              <button onClick={() => changeDate(-1)} className="p-2 text-slate-400">◀</button>
              <p className="text-sm font-black text-slate-800">{isToday ? "Today" : selectedDate}</p>
              <button onClick={() => changeDate(1)} className="p-2 text-slate-400">▶</button>
            </nav>

            <div className="bg-white p-1 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
              {userData?.targets && <DailyProgress targets={userData.targets} current={dailyTotals} />}
            </div>

            <LogList logs={todaysLogs} onDelete={handleDelete} />
          </div>
        )}

        {/* TAB 2: ADD (THE ACTIONS) */}
        {currentTab === 'add' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-200">
            <WaterTracker userId={userId} date={selectedDate} />
            
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Food Entry</h3>
                <div className="space-y-4">
                    <button onClick={() => setIsScanning(true)} className="w-full h-20 bg-blue-600 rounded-3xl shadow-lg shadow-blue-200 text-white font-black flex items-center justify-center gap-4 active:scale-95 transition-all text-lg">
                        <span className="text-2xl">📷</span> SCAN BARCODE
                    </button>
                    <button onClick={() => setIsManualEntryOpen(true)} className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-3xl text-slate-600 font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
                        <span>✏️</span> SEARCH / MANUAL
                    </button>
                </div>
            </div>

            <QuickLog onLog={logFood} />

            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-black">Weight Update</h4>
                    <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-bold uppercase">Quick Action</span>
                </div>
                <p className="text-indigo-100 text-xs mb-4">Step on the scale? Keep the trend moving.</p>
                <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black text-sm active:scale-95 transition-all">
                    LOG NEW WEIGHT
                </button>
            </div>
          </div>
        )}

        {/* TAB 3: INSIGHTS (THE CHARTS) */}
        {currentTab === 'insights' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right duration-300">
            <WeightChart userId={userId} />
            <WeeklyInsights 
                userId={userId} 
                dailyCalorieTarget={userData?.targets?.calories || 2000} 
            />
          </div>
        )}
      </div>

      {/* REFINED BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-30 shadow-2xl">
        <button 
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${currentTab === 'home' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
        >
          <span className="text-2xl">{currentTab === 'home' ? '🏠' : '🏡'}</span>
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>

        <button 
          onClick={() => setCurrentTab('add')}
          className={`flex flex-col items-center justify-center -mt-12 w-16 h-16 rounded-full shadow-2xl transition-all border-4 border-slate-50 ${currentTab === 'add' ? 'bg-blue-600 text-white rotate-45' : 'bg-slate-800 text-white'}`}
        >
          <span className="text-3xl font-light">+</span>
        </button>

        <button 
          onClick={() => setCurrentTab('insights')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${currentTab === 'insights' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
        >
          <span className="text-2xl">{currentTab === 'insights' ? '📊' : '📈'}</span>
          <span className="text-[9px] font-black uppercase tracking-tighter">Charts</span>
        </button>
      </nav>

      {/* Modals */}
      {isSettingsOpen && <SettingsModal userId={userId} currentProfile={userData?.profile} onClose={() => setIsSettingsOpen(false)} />}
      {isScanning && <BarcodeScanner onResult={(p) => logFood(p)} onClose={() => setIsScanning(false)} />}
      {isManualEntryOpen && <ManualEntry onAdd={(data) => logFood(data)} onClose={() => setIsManualEntryOpen(false)} />}

      {/* Floating Action Confirmation (Scanned Product) */}
      {scannedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end p-4 z-50">
           {/* ... existing scannedProduct JSX ... */}
        </div>
      )}
    </main>
  );
}