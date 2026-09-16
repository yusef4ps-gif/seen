import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'سِين (SEEN) | منصة إنشاء وإدارة المتاجر الإلكترونية المتكاملة',
  description: 'منصة سِين (SEEN) السحابية الرائدة لإنشاء وإدارة المتاجر الإلكترونية الذكية في اليمن والمنطقة مع دعم كامل للمحافظ المحلية والدفع عند الاستلام وأسعار الصرف الحية.',
};

import { ThemeProvider } from '@/components/ThemeProvider';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { Toaster } from 'react-hot-toast';
import { headers, cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import BanCookieSetter from '@/components/BanCookieSetter';
import { ShieldAlert } from 'lucide-react';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const isDeviceBanned = cookieStore.get('seen_device_ban')?.value === 'true';
  const headersList = headers();

  let isBanned = isDeviceBanned;
  let isGeoBlocked = false;
  let banReason = 'لقد تم حظر جهازك وعنوان الشبكة الخاص بك من الوصول إلى منصة سِين ومتاجرها، نتيجة اكتشاف سلوك مريب أو محاولات اختراق للأنظمة الأمنية.';
  let errCode = 'ERR_ACCESS_DENIED_SEC_POLICY';

  // Geo-blocking Check (Cloudflare CF-IPCountry)
  // Allowed: Yemen, Saudi Arabia, UAE, Qatar, Bahrain, Kuwait, Oman
  const country = headersList.get('cf-ipcountry');
  const allowedCountries = ['YE', 'SA', 'AE', 'QA', 'BH', 'KW', 'OM'];
  
  if (country && country !== 'XX' && !allowedCountries.includes(country)) {
    isGeoBlocked = true;
    isBanned = true;
    banReason = 'عذراً، خدمات منصة سِين (SEEN) غير متاحة حالياً في منطقتك الجغرافية. تقتصر خدماتنا حالياً على دول الخليج العربي واليمن.';
    errCode = `ERR_GEO_BLOCKED_REGION_${country}`;
  }

  if (!isBanned) {
    let ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
    if (ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim();
    
    if (ipAddress !== 'Unknown') {
      try {
        const blocked = await prisma.blockedIP.findUnique({ where: { ipAddress } });
        if (blocked) {
          isBanned = true;
        }
      } catch (err) {}
    }
  }

  if (isBanned) {
    return (
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700;900&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-red-950 text-red-500 font-sans min-h-screen m-0 p-0 overflow-hidden">
          {!isGeoBlocked && <BanCookieSetter />}
          <div className="fixed inset-0 z-[99999] bg-red-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15)_0%,transparent_80%)] pointer-events-none" />
            <ShieldAlert className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
            <h1 className="text-4xl sm:text-5xl font-black text-red-500 mb-4 drop-shadow-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>⛔ الوصول محظور</h1>
            <p className="text-red-200 text-lg sm:text-xl max-w-2xl leading-relaxed font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {banReason}
            </p>
            <div className="mt-12 text-sm text-red-400/60 font-mono bg-red-950/50 px-6 py-3 rounded-full border border-red-900/50">
              {errCode}
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme') || 'system';
                if (theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slateDark-950 dark:text-slate-100 min-h-screen flex flex-col font-sans selection:bg-brand-500 selection:text-white transition-colors duration-300">
        <ThemeProvider>
          {children}
          <FloatingWhatsApp />
          <Toaster position="top-center" toastOptions={{ 
            duration: 3000, 
            style: { background: '#333', color: '#fff', borderRadius: '10px' },
            success: { style: { background: '#059669', color: '#fff' } }
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
