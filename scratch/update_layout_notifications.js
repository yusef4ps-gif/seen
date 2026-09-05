const fs = require('fs');

const targetPath = 'app/merchant/[slug]/layout.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Import getStoreNotificationsAction
content = content.replace(
  "import { getStoreBySlugAction, getStoresAction } from '@/app/actions/store';",
  "import { getStoreBySlugAction, getStoresAction } from '@/app/actions/store';\nimport { getStoreNotificationsAction } from '@/app/actions/notifications';"
);

// 2. Change `notifications` to state and add `trialDaysLeft` state
const oldNotificationsPattern = /const notifications = \[\s*\{ id: 1, type: 'warning'[\s\S]*?\];/;
const newStates = `
  const [notifications, setNotifications] = useState<any[]>([]);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
`;
content = content.replace(oldNotificationsPattern, newStates);

// 3. Update the useEffect logic
const oldUseEffectPattern = /async function loadData\(\) \{[\s\S]*?loadData\(\);\n    setBroadcasts\(storeEngine\.getBroadcasts\(\)\);\n  \}, \[slug\]\);/;

const newUseEffect = `
    async function loadData() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          
          // Fetch Real Notifications
          const notifsRes = await getStoreNotificationsAction(s.id);
          if (notifsRes.success && notifsRes.data) {
            const dynamicNotifs: any[] = [];
            let unread = 0;
            let currentId = 1;

            // Abandoned Carts
            if (notifsRes.data.abandoned.count > 0) {
              dynamicNotifs.push({
                id: currentId++,
                type: 'warning',
                title: 'سلات متروكة',
                message: \`يوجد \${notifsRes.data.abandoned.count} سلات متروكة بقيمة \${formatCurrency(notifsRes.data.abandoned.total, s.baseCurrency)}، قم بمتابعتها.\`,
                time: 'جديد'
              });
              unread++;
            }

            // Low Stock
            if (notifsRes.data.lowStock && notifsRes.data.lowStock.length > 0) {
              notifsRes.data.lowStock.forEach((prod: any) => {
                dynamicNotifs.push({
                  id: currentId++,
                  type: 'danger',
                  title: 'تنبيه المخزون',
                  message: \`تنبيه: منتج "\${prod.name}" قارب على النفاذ (باقي \${prod.stock} قطع فقط).\`,
                  time: 'جديد'
                });
                unread++;
              });
            }

            // Subscription Calculation
            if (notifsRes.data.storeDetails) {
              const createdAt = new Date(notifsRes.data.storeDetails.createdAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - createdAt.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const maxTrialDays = 14;
              
              const remaining = maxTrialDays - diffDays;
              setTrialDaysLeft(remaining);

              if (notifsRes.data.storeDetails.planStatus === 'trial') {
                if (remaining <= 3 && remaining > 0) {
                  dynamicNotifs.push({
                    id: currentId++,
                    type: 'info',
                    title: 'تنبيه الاشتراك',
                    message: \`باقة المتجر الأساسية (الفترة التجريبية) ستنتهي بعد \${remaining} أيام، يرجى التجديد قريباً لتجنب الإيقاف.\`,
                    time: 'اليوم'
                  });
                  unread++;
                } else if (remaining <= 0) {
                  dynamicNotifs.push({
                    id: currentId++,
                    type: 'danger',
                    title: 'انتهاء الاشتراك',
                    message: \`انتهت الفترة التجريبية المجانية الخاصة بك. يرجى الاشتراك في إحدى الباقات للاستمرار في استقبال الطلبات.\`,
                    time: 'الآن'
                  });
                  unread++;
                }
              }
            }

            setNotifications(dynamicNotifs);
            setUnreadCount(unread);
          }
        }
      }
      const all = await getStoresAction();
      setAllStores(all as any);
    }
    
    loadData();
    setBroadcasts(storeEngine.getBroadcasts());
  }, [slug]);
`;

content = content.replace(oldUseEffectPattern, newUseEffect);


// 4. Update Header Bell badge from `notifications.length` to `unreadCount`
content = content.replace(
  /\{notifications\.length > 0 && \(/,
  "{unreadCount > 0 && ("
);

content = content.replace(
  /<span className="text-\[10px\] text-brand-600 font-bold px-2 py-0\.5 rounded-full bg-brand-50 dark:bg-brand-900\/30">جديد \{notifications\.length\}<\/span>/,
  '<span className="text-[10px] text-brand-600 font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30">جديد {unreadCount}</span>'
);

content = content.replace(
  /<button className="text-\[11px\] font-bold text-brand-600 hover:text-brand-700">تحديد الكل كمقروء<\/button>/,
  '<button onClick={() => setUnreadCount(0)} className="text-[11px] font-bold text-brand-600 hover:text-brand-700">تحديد الكل كمقروء</button>'
);

// 5. Update the Trial Countdown Banner UI
const oldTrialBanner = /\{store\.planStatus === 'trial' && \([\s\S]*?<\/Link>\n          <\/div>\n        \)\}/;

const newTrialBanner = `
        {store.planStatus === 'trial' && trialDaysLeft !== null && (
          <div className={\`mx-3 sm:mx-8 mt-3 p-3 sm:p-3.5 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 shadow-md \${trialDaysLeft <= 0 ? 'bg-gradient-to-r from-red-900 via-red-800 to-red-600' : 'bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6]'}\`}>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-sm shrink-0">
                {trialDaysLeft <= 0 ? '⚠️' : '🎁'}
              </span>
              <div>
                <div className="text-xs font-black flex items-center gap-2">
                  <span>
                    {trialDaysLeft > 0 
                      ? \`أنت حالياً في الفترة التجريبية المجانية (\${trialDaysLeft} يوماً متبقية)\` 
                      : 'لقد انتهت الفترة التجريبية المجانية الخاصة بك'}
                  </span>
                  {trialDaysLeft > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#2dd4bf] text-[#0f2b48] text-[10px] font-black">
                      تجربة مجانية نشطة
                    </span>
                  )}
                  {trialDaysLeft <= 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 text-[10px] font-black animate-pulse">
                      الاشتراك منتهي
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-200">
                  {trialDaysLeft > 0 
                    ? \`بدأت تجربتك بتاريخ \${new Date(store.createdAt).toLocaleDateString('ar-YE')}، استمتع بكافة الميزات الاحترافية مجاناً.\`
                    : 'يرجى ترقية الباقة لاستعادة وصولك إلى كافة ميزات المتجر وتفعيل استقبال الطلبات.'}
                </div>
              </div>
            </div>

            <Link
              href={\`/merchant/\${store.slug}/settings\`}
              className="px-4 py-1.5 rounded-xl bg-white text-[#0f2b48] hover:bg-slate-100 text-xs font-black shadow-sm transition-all"
            >
              ترقية واختيار باقة ⚡
            </Link>
          </div>
        )}
`;

content = content.replace(oldTrialBanner, newTrialBanner);

fs.writeFileSync(targetPath, content, 'utf8');
