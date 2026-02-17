'use client';

import { useState } from 'react';

export default function ManualEntry({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert strings to numbers and send to parent
    onAdd({
      product_name: form.name,
      brands: 'Manual Entry',
      nutriments: {
        'energy-kcal_100g': Number(form.calories),
        'proteins_100g': Number(form.protein),
        'carbohydrates_100g': Number(form.carbs),
        'fat_100g': Number(form.fats)
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-2xl text-slate-800">Add Custom Item</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Food Name</label>
            <input 
              type="text" 
              placeholder="e.g. Banana"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Calories</label>
              <input 
                type="number" 
                placeholder="0"
                required
                className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.calories}
                onChange={e => setForm({...form, calories: e.target.value})}
              />
            </div>
            {/* Empty spacer or maybe Serving Size later? */}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Protein (g)</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full p-2 bg-red-50 border border-red-100 rounded-xl font-bold text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={form.protein}
                onChange={e => setForm({...form, protein: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Carbs (g)</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full p-2 bg-green-50 border border-green-100 rounded-xl font-bold text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.carbs}
                onChange={e => setForm({...form, carbs: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-1">Fat (g)</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full p-2 bg-yellow-50 border border-yellow-100 rounded-xl font-bold text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={form.fats}
                onChange={e => setForm({...form, fats: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg mt-4 active:scale-95 transition-transform"
          >
            Add to Log
          </button>
        </form>
      </div>
    </div>
  );
}