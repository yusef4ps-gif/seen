const fs = require('fs');

// Fix 1: Update auth.ts to allow dev bypass
const authPath = 'app/actions/auth.ts';
let authContent = fs.readFileSync(authPath, 'utf8');
authContent = authContent.replace(
  "  if (!userId) {\n    throw new Error('Unauthorized');\n  }",
  "  if (!userId) {\n    // Development bypass for easy testing\n    if (process.env.NODE_ENV === 'development') {\n      return { userId: 'dev-user', role: 'SUPER_ADMIN', storeId: 'dev-store' };\n    }\n    throw new Error('Unauthorized');\n  }"
);
fs.writeFileSync(authPath, authContent, 'utf8');

// Fix 2: Update order.ts to serialize errors correctly
const orderPath = 'app/actions/order.ts';
let orderContent = fs.readFileSync(orderPath, 'utf8');
orderContent = orderContent.replace(
  /return \{ success: false, error \};/g,
  "return { success: false, error: error instanceof Error ? error.message : String(error) };"
);
fs.writeFileSync(orderPath, orderContent, 'utf8');
