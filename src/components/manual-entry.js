'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// National Averages per 100g
const FOOD_DATABASE = {
  // --- PROTEINS ---
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fats: 3.6, pieceWeight: 174 },
  "ground beef (80/20)": { calories: 254, protein: 17, carbs: 0, fats: 20, pieceWeight: 113 },
  "ground turkey": { calories: 189, protein: 25, carbs: 0, fats: 10, pieceWeight: 113 },
  "egg": { calories: 155, protein: 13, carbs: 1.1, fats: 11, pieceWeight: 50 },
  "egg white": { calories: 52, protein: 11, carbs: 0.7, fats: 0.2, pieceWeight: 33 },
  "salmon": { calories: 208, protein: 20, carbs: 0, fats: 13, pieceWeight: 150 },
  "tilapia": { calories: 128, protein: 26, carbs: 0, fats: 3, pieceWeight: 150 },
  "bacon": { calories: 541, protein: 37, carbs: 1.4, fats: 42, pieceWeight: 8 },
  "greek yogurt (plain)": { calories: 59, protein: 10, carbs: 3.6, fats: 0.4, pieceWeight: 170 },

  // --- FRUITS ---
  "apple": { calories: 52, protein: 0.3, carbs: 14, fats: 0.2, pieceWeight: 182 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fats: 0.3, pieceWeight: 118 },
  "blueberries": { calories: 57, protein: 0.7, carbs: 14, fats: 0.3, pieceWeight: 148 },
  "strawberries": { calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, pieceWeight: 12 },
  "avocado": { calories: 160, protein: 2, carbs: 9, fats: 15, pieceWeight: 200 },
  "orange": { calories: 47, protein: 0.9, carbs: 12, fats: 0.1, pieceWeight: 131 },

  // --- VEGETABLES ---
  "broccoli": { calories: 34, protein: 2.8, carbs: 7, fats: 0.4, pieceWeight: 91 },
  "spinach": { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, pieceWeight: 30 },
  "potato": { calories: 77, protein: 2, carbs: 17, fats: 0.1, pieceWeight: 213 },
  "sweet potato": { calories: 86, protein: 1.6, carbs: 20, fats: 0.1, pieceWeight: 130 },
  "carrot": { calories: 41, protein: 0.9, carbs: 10, fats: 0.2, pieceWeight: 61 },

  // --- GRAINS & CARBS ---
  "white rice (cooked)": { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, pieceWeight: 186 },
  "brown rice (cooked)": { calories: 111, protein: 2.6, carbs: 23, fats: 0.9, pieceWeight: 195 },
  "oats (dry)": { calories: 389, protein: 16.9, carbs: 66, fats: 6.9, pieceWeight: 40 },
  "bread (white)": { calories: 265, protein: 9, carbs: 49, fats: 3.2, pieceWeight: 25 },
  "bread (whole wheat)": { calories: 247, protein: 13, carbs: 41, fats: 3.4, pieceWeight: 28 },
  "pasta (cooked)": { calories: 158, protein: 5.8, carbs: 31, fats: 0.9, pieceWeight: 140 },
  "tortilla (flour)": { calories: 297, protein: 8, carbs: 50, fats: 8, pieceWeight: 45 },

  // --- PANTRY & FATS ---
  "peanut butter": { calories: 588, protein: 25, carbs: 20, fats: 50, pieceWeight: 16 },
  "butter": { calories: 717, protein: 0.9, carbs: 0.1, fats: 81, pieceWeight: 14 },
  "olive oil": { calories: 884, protein: 0, carbs: 0, fats: 100, pieceWeight: 14 },
  "almonds": { calories: 579, protein: 21, carbs: 22, fats: 50, pieceWeight: 1 },
  "cheese (cheddar)": { calories: 403, protein: 25, carbs: 1.3, fats: 33, pieceWeight: 28 },
};

export default function ManualEntry({ onAdd, onClose, initialData }) {
  const [form, setForm] = useState({
    name: initialData?.name || initialData?.product?.product_name || '',
    amount: 1,
    unit: 'pc'
  });

  const [showMicros, setShowMicros] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Logic to initialize the nutrient fields with ALL possible micros
  const [manualNutrients, setManualNutrients] = useState(() => {
    if (initialData) {
      const source = initialData.product ? initialData.product.nutriments : initialData;
      return {
        calories: source.calories || Math.round(source['energy-kcal_100g'] || source['energy-kcal_serving'] || 0),
        protein: source.protein || source['proteins_100g'] || source['proteins_serving'] || 0,
        carbs: source.carbs || source['carbohydrates_100g'] || source['carbohydrates_serving'] || 0,
        fats: source.fats || source['fat_100g'] || source['fat_serving'] || 0,
        fiber: source.fiber || source['fiber_100g'] || source['fiber_serving'] || 0,
        sodium: source.sodium || source['sodium_100g'] || source['sodium_serving'] || 0,
        potassium: source.potassium || source['potassium_100g'] || source['potassium_serving'] || 0,
        sugar: source.sugar || source['sugars_100g'] || source['sugars_serving'] || 0,
        iron: source.iron || source['iron_100g'] || source['iron_serving'] || 0,
        calcium: source.calcium || source['calcium_100g'] || source['calcium_serving'] || 0,
        magnesium: source.magnesium || source['magnesium_100g'] || source['magnesium_serving'] || 0,
        zinc: source.zinc || source['zinc_100g'] || source['zinc_serving'] || 0,
        vitA: source.vitA || source['vitamin-a_100g'] || source['vitamin-a_serving'] || 0,
        vitC: source.vitC || source['vitamin-c_100g'] || source['vitamin-c_serving'] || 0,
        vitD: source.vitD || source['vitamin-d_100g'] || source['vitamin-d_serving'] || 0,
        vitB12: source.vitB12 || source['vitamin-b12_100g'] || source['vitamin-b12_serving'] || 0,
      };
    }
    return null;
  });

  // Learning Database Search (Case-insensitive fix)
  useEffect(() => {
    const searchLearningDB = async () => {
      const term = form.name.toLowerCase().trim();
      if (term.length < 2) { setSuggestions([]); return; }
      try {
        const q = query(
          collection(db, "products"),
          where("product_name", ">=", term),
          where("product_name", "<=", term + '\uf8ff'),
          limit(4)
        );
        const snapshot = await getDocs(q);
        setSuggestions(snapshot.docs.map(doc => doc.data()));
      } catch (err) { console.error("Search error:", err); }
    };
    const timer = setTimeout(searchLearningDB, 300);
    return () => clearTimeout(timer);
  }, [form.name]);

  const searchName = form.name.toLowerCase().trim();
  const baseData = FOOD_DATABASE[searchName];
  let effectiveGrams = Number(form.amount);
  if (form.unit === 'pc' && baseData?.pieceWeight) {
    effectiveGrams = form.amount * baseData.pieceWeight;
  }
  const ratio = effectiveGrams / 100;

  const displayData = manualNutrients || (baseData ? {
    calories: Math.round(baseData.calories * ratio),
    protein: (baseData.protein * ratio).toFixed(1),
    carbs: (baseData.carbs * ratio).toFixed(1),
    fats: (baseData.fats * ratio).toFixed(1),
    fiber: 0, sodium: 0, potassium: 0, sugar: 0, iron: 0, calcium: 0, magnesium: 0, zinc: 0, vitA: 0, vitC: 0, vitD: 0, vitB12: 0
  } : { 
    calories: '', protein: '', carbs: '', fats: '', 
    fiber: 0, sodium: 0, potassium: 0, sugar: 0, iron: 0, calcium: 0, magnesium: 0, zinc: 0, vitA: 0, vitC: 0, vitD: 0, vitB12: 0 
  });

  const handleSelectSuggestion = (prod) => {
    setForm({ ...form, name: prod.product_name });
    const n = prod.nutriments;
    setManualNutrients({
      calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal_serving'] || 0),
      protein: (n['proteins_100g'] || n['proteins_serving'] || 0).toFixed(1),
      carbs: (n['carbohydrates_100g'] || n['carbohydrates_serving'] || 0).toFixed(1),
      fats: (n['fat_100g'] || n['fat_serving'] || 0).toFixed(1),
      fiber: n['fiber_100g'] || n['fiber_serving'] || 0,
      sodium: n['sodium_100g'] || n['sodium_serving'] || 0,
      potassium: n['potassium_100g'] || n['potassium_serving'] || 0,
      sugar: n['sugars_100g'] || n['sugars_serving'] || 0,
      iron: n['iron_100g'] || n['iron_serving'] || 0,
      calcium: n['calcium_100g'] || n['calcium_serving'] || 0,
      magnesium: n['magnesium_100g'] || n['magnesium_serving'] || 0,
      zinc: n['zinc_100g'] || n['zinc_serving'] || 0,
      vitA: n['vitamin-a_100g'] || n['vitamin-a_serving'] || 0,
      vitC: n['vitamin-c_100g'] || n['vitamin-c_serving'] || 0,
      vitD: n['vitamin-d_100g'] || n['vitamin-d_serving'] || 0,
      vitB12: n['vitamin-b12_100g'] || n['vitamin-b12_serving'] || 0,
    });
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onAdd === 'function') {
      onAdd({
        product_name: form.name,
        brands: initialData?.brand || initialData?.product?.brands || 'Manual Entry',
        nutriments: {
          'energy-kcal_serving': Number(displayData.calories),
          'proteins_serving': Number(displayData.protein),
          'carbohydrates_serving': Number(displayData.carbs),
          'fat_serving': Number(displayData.fats),
          'fiber_serving': Number(displayData.fiber),
          'sodium_serving': Number(displayData.sodium),
          'potassium_serving': Number(displayData.potassium),
          'sugars_serving': Number(displayData.sugar),
          'iron_serving': Number(displayData.iron),
          'calcium_serving': Number(displayData.calcium),
          'magnesium_serving': Number(displayData.magnesium),
          'zinc_serving': Number(displayData.zinc),
          'vitamin-a_serving': Number(displayData.vitA),
          'vitamin-c_serving': Number(displayData.vitC),
          'vitamin-d_serving': Number(displayData.vitD),
          'vitamin-b12_serving': Number(displayData.vitB12),
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-md p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300 relative my-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-2xl text-slate-800 tracking-tight">
            {initialData?.isNewFromScan ? 'Confirm Scan' : initialData ? 'Edit Entry' : 'Quick Log'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Food Name</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500" 
              value={form.name} 
              placeholder="Start typing..."
              onChange={e => { setForm({...form, name: e.target.value}); setManualNutrients(null); }} 
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-2xl z-[100] overflow-hidden">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    onClick={() => handleSelectSuggestion(s)} 
                    className="w-full p-4 text-left hover:bg-blue-50 border-b border-slate-50 font-bold text-sm capitalize"
                  >
                    {s.product_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-[2]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Quantity</label>
              <input type="number" step="0.1" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Unit</label>
              <select className="w-full p-4 bg-slate-100 border-2 border-slate-100 rounded-2xl font-bold" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                <option value="pc">Serving</option>
                <option value="g">Grams</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-inner">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-50">
                <label className="block text-[9px] font-black text-blue-400 uppercase">Calories</label>
                <input type="number" className="w-full bg-transparent font-black text-xl text-blue-900 outline-none" value={displayData.calories} onChange={e => setManualNutrients({...displayData, calories: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { k: 'protein', l: 'Protein', c: 'text-rose-500' },
                { k: 'carbs', l: 'Carbs', c: 'text-emerald-500' },
                { k: 'fats', l: 'Fats', c: 'text-amber-500' }
              ].map((m) => (
                <div key={m.k} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <label className={`block text-[9px] font-black uppercase ${m.c}`}>{m.l}</label>
                  <input type="number" step="0.1" className="w-full bg-transparent font-bold text-slate-700 outline-none" value={displayData[m.k]} onChange={e => setManualNutrients({...displayData, [m.k]: e.target.value})} />
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={() => setShowMicros(!showMicros)} 
              className="w-full mt-6 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100/50 rounded-2xl hover:bg-blue-100 transition-all active:scale-95"
            >
              {showMicros ? 'Hide' : 'Edit'} All Micronutrients
            </button>

            {showMicros && (
              <div className="grid grid-cols-2 gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {[
                  { k: 'fiber', l: 'Fiber (g)' }, { k: 'sugar', l: 'Sugar (g)' },
                  { k: 'sodium', l: 'Sodium (mg)' }, { k: 'potassium', l: 'Potassium (mg)' },
                  { k: 'iron', l: 'Iron (mg)' }, { k: 'calcium', l: 'Calcium (mg)' },
                  { k: 'magnesium', l: 'Magnesium (mg)' }, { k: 'zinc', l: 'Zinc (mg)' },
                  { k: 'vitA', l: 'Vit A (IU)' }, { k: 'vitC', l: 'Vit C (mg)' },
                  { k: 'vitD', l: 'Vit D (IU)' }, { k: 'vitB12', l: 'Vit B12 (mcg)' }
                ].map((m) => (
                  <div key={m.k} className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">{m.l}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-transparent font-bold text-xs text-slate-800 outline-none" 
                      value={displayData[m.k] || 0} 
                      onChange={e => setManualNutrients({...displayData, [m.k]: e.target.value})} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-[2rem] shadow-xl shadow-blue-100 active:scale-95 transition-all mt-4 uppercase tracking-widest text-sm"
          >
            {initialData?.isNewFromScan ? 'Confirm and Log' : initialData ? 'Update Entry' : `Log ${displayData.calories || 0} kcal`}
          </button>
        </form>
      </div>
    </div>
  );
}