'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export default function WeeklyInsights({ userId, dailyCalorieTarget }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyLogs = async () => {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const logsRef = collection(db, "users", userId, "logs");
      const q = query(logsRef, where("date", ">=", startDate), orderBy("date", "asc"));

      const snapshot = await getDocs(q);
      const groupedData = {};

      // Initialize last 7 days with 0s
      for (let i = 0; i <= 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        groupedData[dateStr] = { 
            name: d.toLocaleDateString(undefined, { weekday: 'short' }), 
            calories: 0,
            fullDate: dateStr 
        };
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (groupedData[data.date]) {
          groupedData[data.date].calories += data.calories || 0;
        }
      });

      setWeeklyData(Object.values(groupedData));
      setLoading(false);
    };

    fetchWeeklyLogs();
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold">Analysing your week...</div>;

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50">
      <div className="mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Calorie Intake</h3>
        <p className="text-sm text-slate-500 font-medium">Goal: {dailyCalorieTarget} kcal / day</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} 
            />
            <YAxis hide domain={[0, 'dataMax + 500']} />
            <Tooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <ReferenceLine y={dailyCalorieTarget} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'right', value: 'GOAL', fill: '#94a3b8', fontSize: 10, fontWeight: 'black' }} />
            <Bar dataKey="calories" radius={[10, 10, 10, 10]} barSize={30}>
              {weeklyData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.calories > dailyCalorieTarget + 100 ? '#ef4444' : entry.calories < dailyCalorieTarget - 300 ? '#3b82f6' : '#10b981'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex justify-between text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"/> Under</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"/> On Track</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"/> Over</div>
      </div>
    </div>
  );
}