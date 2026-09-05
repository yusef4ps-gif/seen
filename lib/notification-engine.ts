import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
// It will gracefully fail if the key is missing (logs to console instead)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender email (should be configured in Resend, e.g., no-reply@seen.com)
const DEFAULT_SENDER = process.env.DEFAULT_SENDER_EMAIL || 'no-reply@seen.app';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Sends an email using Resend API.
 * If RESEND_API_KEY is not set, it will log the email to the console (useful for development).
 */
export async function sendEmail(payload: EmailPayload) {
  if (!resend) {
    console.log('----------------------------------------------------');
    console.log(`[Notification Engine - DRY RUN]`);
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body (HTML length): ${payload.html.length} chars`);
    console.log('Set RESEND_API_KEY in .env to actually send this email.');
    console.log('----------------------------------------------------');
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: `SEEN Platform <${DEFAULT_SENDER}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    
    console.log(`[Notification Engine] Email sent successfully to ${payload.to}. ID: ${data.data?.id}`);
    return { success: true, id: data.data?.id };
  } catch (error) {
    console.error('[Notification Engine] Error sending email:', error);
    return { success: false, error };
  }
}

// ---------------------------------------------------------------------------
// HTML Email Templates
// ---------------------------------------------------------------------------

export const EmailTemplates = {
  
  /**
   * Order Confirmation for Customer
   */
  OrderConfirmation: (
    customerName: string, 
    storeName: string, 
    orderId: string, 
    total: number, 
    currency: string
  ) => {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">تم تأكيد طلبك بنجاح! 🎉</h2>
        <p>مرحباً <strong>${customerName}</strong>،</p>
        <p>شكراً لتسوقك من <strong>${storeName}</strong>. لقد تلقينا طلبك رقم <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">#${orderId.slice(-6)}</span>.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #334155;">ملخص الطلب:</h3>
          <p style="font-size: 18px; font-weight: bold; color: #0f172a;">الإجمالي: ${total.toLocaleString()} ${currency}</p>
        </div>
        
        <p>سيقوم فريق المتجر بالتواصل معك قريباً لتأكيد تفاصيل الشحن والتسليم.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="text-align: center; color: #64748b; font-size: 12px;">
          تم إنشاء هذا المتجر بواسطة منصة <a href="https://seen.app" style="color: #0d9488; text-decoration: none;">سِين SEEN</a>
        </p>
      </div>
    `;
  },

  /**
   * New Order Alert for Merchant
   */
  MerchantNewOrder: (
    merchantName: string,
    orderId: string,
    customerName: string,
    total: number,
    currency: string,
    dashboardLink: string
  ) => {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ea580c; text-align: center;">طلب جديد وصلك! 🛒</h2>
        <p>مرحباً <strong>${merchantName}</strong>،</p>
        <p>لقد استلمت للتو طلباً جديداً من العميل <strong>${customerName}</strong> بقيمة <strong>${total.toLocaleString()} ${currency}</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            عرض تفاصيل الطلب
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">يرجى مراجعة الطلب وتأكيده بأسرع وقت لضمان رضا العميل.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="text-align: center; color: #64748b; font-size: 12px;">
          إدارة منصة سِين SEEN
        </p>
      </div>
    `;
  },

  /**
   * Welcome Email for New Merchants
   */
  WelcomeMerchant: (
    merchantName: string,
    storeName: string,
    storeLink: string,
    dashboardLink: string
  ) => {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">مرحباً بك في سِين! 🚀</h2>
        <p>أهلاً <strong>${merchantName}</strong>،</p>
        <p>يسعدنا انضمامك إلينا! لقد تم إعداد متجرك <strong>${storeName}</strong> بنجاح، وهو الآن جاهز لاستقبال عملائك.</p>
        
        <div style="margin: 20px 0; display: flex; flex-direction: column; gap: 10px;">
          <a href="${dashboardLink}" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: block; text-align: center;">
            لوحة التحكم الخاصة بك
          </a>
          <a href="${storeLink}" style="background: #f1f5f9; color: #334155; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: block; text-align: center; border: 1px solid #e2e8f0;">
            زيارة متجرك الآن
          </a>
        </div>
        
        <h3 style="color: #334155; margin-top: 30px;">خطواتك الأولى:</h3>
        <ul style="color: #475569; line-height: 1.6;">
          <li>أضف منتجك الأول من خلال لوحة التحكم.</li>
          <li>قم بتخصيص ألوان وتصميم متجرك ليناسب هويتك.</li>
          <li>شارك رابط متجرك في منصات التواصل الاجتماعي لتبدأ البيع.</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="text-align: center; color: #64748b; font-size: 12px;">
          فريق الدعم الفني - منصة سِين SEEN
        </p>
      </div>
    `;
  }
};
