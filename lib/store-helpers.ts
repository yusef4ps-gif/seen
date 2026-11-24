import { Store } from './types';

export const getSubscriptionExpiryInfo = (store: Store | any) => {
  if (store.planStatus === 'suspended') {
    return {
      type: 'suspended',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      rowClass: 'bg-slate-100/50 dark:bg-slateDark-900/60 border-r-4 border-r-slate-500',
      dotClass: 'bg-slate-500',
      label: '🔒 مُجمد (موقوف)',
      remainingText: 'المتجر موقوف بقرار إداري',
      textColor: 'text-slate-600 dark:text-slate-400 font-bold',
      daysLeft: 0,
      isExpiringSoon: false,
      isExpired: true,
    };
  }

  const startDateStr = store.planStartDate || store.createdAt;
  let endDateStr = store.planEndDate;
  if (!endDateStr) {
    const fallbackEnd = new Date(startDateStr || new Date());
    fallbackEnd.setDate(fallbackEnd.getDate() + 14);
    endDateStr = fallbackEnd;
  }

  const endDate = new Date(endDateStr);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 3600 * 24));

  if (daysLeft <= 0 || store.planStatus === 'expired') {
    return {
      type: 'expired',
      badgeClass: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 shadow-sm font-black',
      rowClass: 'bg-red-50/40 dark:bg-red-950/20 border-r-4 border-r-red-500',
      dotClass: 'bg-red-500 animate-pulse',
      label: '⛔ الاشتراك منتهي',
      remainingText: 'انتهت الصلاحية (مطلوب التجديد)',
      textColor: 'text-red-600 dark:text-red-400 font-bold',
      daysLeft,
      isExpiringSoon: false,
      isExpired: true,
    };
  }

  if (daysLeft <= 7) {
    return {
      type: 'expiring_soon',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 shadow-sm font-black',
      rowClass: 'bg-amber-50/40 dark:bg-amber-950/20 border-r-4 border-r-amber-500',
      dotClass: 'bg-amber-500 animate-ping',
      label: '⏳ قارب على الانتهاء',
      remainingText: `متبقي ${daysLeft} ${daysLeft === 1 ? 'يوم' : daysLeft === 2 ? 'يومان' : 'أيام'} (أصفر)`,
      textColor: 'text-amber-700 dark:text-amber-400 font-bold',
      daysLeft,
      isExpiringSoon: true,
      isExpired: false,
    };
  }

  if (store.planStatus === 'trial') {
    return {
      type: 'trial',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-bold',
      rowClass: '',
      dotClass: 'bg-sky-500',
      label: '✨ تجربة مجانية',
      remainingText: `متبقي ${daysLeft} يوم`,
      textColor: 'text-slate-500 dark:text-slate-400',
      daysLeft,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  return {
    type: 'active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold',
    rowClass: '',
    dotClass: 'bg-emerald-500',
    label: '✓ نشط',
    remainingText: `متبقي ${daysLeft} يوم`,
    textColor: 'text-slate-500 dark:text-slate-400',
    daysLeft,
    isExpiringSoon: false,
    isExpired: false,
  };
};
