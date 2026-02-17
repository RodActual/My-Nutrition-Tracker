'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, addDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import DailyProgress from './daily-progress';
import BarcodeScanner from './barcode-scanner';
import WeightReminderBanner from './weight-reminder-banner';
import ManualEntry from './manual-entry';
import LogList from './log-list';
import SettingsModal from './settings-modal'; // <--- Ensure this file exists from the previous step

export default function Dashboard({ userId, onSignOut }) {
  const [userData, setUserData] = useState(null);
  const [todaysLogs, setTodaysLogs] = useState([]); 
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  
  // Modal States
  const [isScanning, setIsScanning] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // <--- New state for settings
  const [scannedProduct, setScannedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch User Profile
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // 2. Fetch Today's Logs
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const logsRef = collection(db, "users", userId, "logs");
    const q = query(logsRef, where("date", "==", today), orderBy("timestamp", "desc"));

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
  }, [userId]);

  // 3. Log Food
  const logFood = async (product) => {
    const today = new Date().toISOString().split('T')[0];
    const getNutrient = (keyStub) => {
      return Math.round(
        product.nutriments[`${keyStub}_serving`] || 
        product.nutriments[`${keyStub}_100g`] || 
        0
      );
    };

    const foodEntry = {
      name: product.product_name || "Unknown Item",
      brand: product.brands || "",
      calories: Math.round(product.nutriments['energy-kcal_serving'] || product.nutriments['energy-kcal_100g'] || 0),
      protein: getNutrient('proteins'),
      carbs: getNutrient('carbohydrates'),
      fats: getNutrient('fat'),
      date: today,
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "users", userId, "logs"), foodEntry);
      setScannedProduct(null);
      setIsManualEntryOpen(false);
    } catch (error) {
      console.error("Error logging food:", error);
      alert("Failed to save.");
    }
  };

  // 4. Delete Log
  const handleDelete = async (logId) => {
    if (confirm("Remove this item?")) {
      try {
        await deleteDoc(doc(db, "users", userId, "logs", logId));
      } catch (error) {
        console.error("Error deleting log:", error);
        alert("Failed to delete.");
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold tracking-wider">LOADING...</div>;

  return (
    <main className="min-h-screen bg-slate-50 pb-32 animate-in fade-in duration-500">
      <WeightReminderBanner lastUpdated={userData?.profile?.lastUpdated} />

      {/* Enhanced Header with Settings Toggle */}
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
            aria-label="Settings"
          >
            <span className="text-xl">⚙️</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 capitalize">
              {userData?.profile?.name || userId.replace('_uid', '')}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Dashboard</p>
          </div>
        </div>
        <button 
          onClick={onSignOut} 
          className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors"
        >
          Switch
        </button>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-8">
        
        {/* Progress Card */}
        <div className="bg-white p-1 rounded-[2rem] shadow-xl shadow-slate-200/50">
          {userData?.targets ? (
            <DailyProgress targets={userData.targets} current={dailyTotals} />
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p>No goals set yet.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <button 
              onClick={() => setIsScanning(true)}
              className="group relative w-full max-w-xs h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all hover:shadow-blue-500/40"
            >
              <span className="bg-white/20 p-1.5 rounded-full">
                <span className="text-lg">📷</span>
              </span>
              <span className="text-white font-bold tracking-wide text-sm uppercase">Scan Barcode</span>
            </button>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setIsManualEntryOpen(true)}
              className="text-sm font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors py-2 px-4 rounded-lg hover:bg-blue-50"
            >
              <span>✏️</span> Or enter manually
            </button>
          </div>
        </div>

        {/* History List */}
        <LogList logs={todaysLogs} onDelete={handleDelete} />

      </div>

      {/* --- MODAL RENDERING --- */}

      {isSettingsOpen && (
        <SettingsModal 
          userId={userId}
          currentProfile={userData?.profile}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isScanning && (
        <BarcodeScanner 
          onResult={(product) => {
            setScannedProduct(product);
            setIsScanning(false);
          }} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      {isManualEntryOpen && (
        <ManualEntry 
          onAdd={(data) => logFood(data)}
          onClose={() => setIsManualEntryOpen(false)}
        />
      )}

      {scannedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
            
            <h3 className="font-black text-2xl text-slate-800 leading-tight mb-1">
              {scannedProduct.product_name || "Unknown Product"}
            </h3>
            <p className="text-slate-500 mb-6 text-sm font-bold uppercase tracking-wide">
              {scannedProduct.brands || 'Generic Brand'}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col items-center">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Calories</p>
                <p className="text-3xl font-black text-blue-600">
                  {Math.round(scannedProduct.nutriments['energy-kcal_serving'] || scannedProduct.nutriments['energy-kcal_100g'] || 0)}
                </p>
              </div>
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col items-center">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Protein</p>
                <p className="text-3xl font-black text-indigo-600">
                  {Math.round(scannedProduct.nutriments['proteins_serving'] || scannedProduct.nutriments['proteins_100g'] || 0)}<span className="text-sm">g</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setScannedProduct(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => logFood(scannedProduct)}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                Log It
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}