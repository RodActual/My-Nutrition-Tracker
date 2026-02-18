'use client';

import { useState } from 'react';

const STAPLES = [
  { id: 'coffee', name: 'Coffee', emoji: '☕', calories: 5, protein: 0, carbs: 0, fats: 0 },
  { id: 'egg', name: '1 Egg', emoji: '🥚', calories: 78, protein: 6, carbs: 0.6, fats: 5 },
  { id: 'shake', name: 'Protein Shake', emoji: '🥤', calories: 150, protein: 30, carbs: 3, fats: 2 },
  { id: 'banana', name: 'Banana', emoji: '🍌', calories: 105, protein: 1, carbs: 27, fats: 0.4 },
  { id: 'oats', name: 'Oatmeal', emoji: '🥣', calories: 150, protein: 5, carbs: 27, fats: 3 },
  { id: 'toast', name: 'Toast', emoji: '🍞', calories: 80, protein: 3, carbs: 15, fats: 1 },
];

// FIX #10: Show a brief toast after each quick-log tap so the user knows the
// item was recorded and can catch accidental double-taps before they're saved.
export default function QuickLog({ onLog }) {
  const [toast, setToast] = useState(null);

  const handleLog = (item) => {
    onLog({
      product_name: item.name,
      brands: 'Quick Log',
      nutriments: {
        'energy-kcal_100g': item.calories,
        'proteins_100g': item.protein,
        'carbohydrates_100g': item.carbs,
        'fat_100g': item.fats
      }
    });

    setToast(item.name);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Quick Log Staples</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 px-2 no-scrollbar">
        {STAPLES.map((item) => (
          <button
            key={item.id}
            onClick={() => handleLog(item)}
            className="flex-shrink-0 flex flex-col items-center gap-2 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm active:scale-90 transition-all hover:border-blue-200"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-[10px] font-black text-black uppercase whitespace-nowrap">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Toast confirmation */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-2xl shadow-2xl whitespace-nowrap">
            ✓ {toast} logged
          </div>
        </div>
      )}
    </div>
  );
}