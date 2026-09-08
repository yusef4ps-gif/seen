'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface Props {
  storeId: string;
}

export default function ActiveVisitorsCounter({ storeId }: Props) {
  const [activeVisitors, setActiveVisitors] = useState(0);

  useEffect(() => {
    if (!storeId) return;

    const fetchVisitors = async () => {
      try {
        const res = await fetch(`/api/ping?storeId=${storeId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.activeVisitorsNow === 'number') {
            setActiveVisitors(data.activeVisitorsNow);
          }
        }
      } catch (error) {
        // ignore errors to avoid console spam
      }
    };

    fetchVisitors();
    const interval = setInterval(fetchVisitors, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  return (
    <div className="bg-[#0f2b48] text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-[#0f2b48]/20 group">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
          <Users className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <p className="text-[10px] text-slate-300 font-bold mb-0.5">زوار المتجر الآن</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black">{activeVisitors}</span>
            <span className="text-xs text-teal-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              نشط
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
