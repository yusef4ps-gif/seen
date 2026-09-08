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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
