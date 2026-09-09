'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  storeId: string;
}

export default function LiveVisitorPill({ storeId }: Props) {
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
        // ignore errors
      }
    };

    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000);
    return () => clearInterval(interval);
  }, [storeId]);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      <span className="hidden sm:inline">{activeVisitors} متسوق متصل</span>
      <span className="sm:hidden">{activeVisitors} متصل</span>
    </div>
  );
}
