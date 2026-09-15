const fs = require('fs');

const path = 'components/CustomerAuthModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add new states
code = code.replace(
  "const [emailOrPhone, setEmailOrPhone] = useState('');",
  "const [emailOrPhone, setEmailOrPhone] = useState('');\n  const [registerEmail, setRegisterEmail] = useState('');\n  const [registerPhone, setRegisterPhone] = useState('');"
);

// 2. Update reset state
code = code.replace(
  "setEmailOrPhone('');",
  "setEmailOrPhone('');\n      setRegisterEmail('');\n      setRegisterPhone('');"
);

// 3. Update handleSubmit
const oldSubmitLogic = `if (mode === 'register') {
      const isEmail = emailOrPhone.includes('@');
      res = await registerCustomerAction(
        storeId, 
        name, 
        isEmail ? emailOrPhone : '', 
        isEmail ? '' : emailOrPhone, 
        password
      );
    }`;

const newSubmitLogic = `if (mode === 'register') {
      if (!registerEmail && !registerPhone) {
        setError('الرجاء إدخال البريد الإلكتروني أو رقم الهاتف على الأقل');
        setLoading(false);
        return;
      }
      res = await registerCustomerAction(storeId, name, registerEmail, registerPhone, password);
    }`;

code = code.replace(oldSubmitLogic, newSubmitLogic);

// update OTP email
code = code.replace(
  "const otpRes = await sendCustomerVerificationCodeAction(emailOrPhone, customerName);",
  "const otpRes = await sendCustomerVerificationCodeAction(mode === 'register' ? (registerEmail || registerPhone) : emailOrPhone, customerName);"
);

// Update UI
const oldEmailOrPhoneJSX = `<div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  البريد الإلكتروني أو رقم الهاتف
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="name@example.com أو 77xxxxxxx"
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                  />
                </div>
              </div>`;

const newEmailOrPhoneJSX = `{mode === 'login' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  البريد الإلكتروني أو رقم الهاتف
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="name@example.com أو 77xxxxxxx"
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                  />
                </div>
              </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم الهاتف (للتواصل عبر واتساب)</label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="77xxxxxxx"
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                      />
                    </div>
                  </div>
                </>
              )}`;

code = code.replace(oldEmailOrPhoneJSX, newEmailOrPhoneJSX);

fs.writeFileSync(path, code);
console.log('Patch complete!');
