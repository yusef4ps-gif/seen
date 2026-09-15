const fs = require('fs');
let code = fs.readFileSync('app/actions/order.ts', 'utf8');

const newAction = `
export async function requestOrderReturnAction(data: { orderId: string; reason: string; items: any[] }) {
  try {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) return { success: false, error: 'الطلب غير موجود' };

    if (order.status !== 'delivered') {
      return { success: false, error: 'لا يمكن إرجاع هذا الطلب لأن حالته ليست مكتملة' };
    }

    let refundAmount = 0;
    const orderItems = JSON.parse(order.items);
    
    data.items.forEach(retItem => {
      const origItem = orderItems.find((i: any) => i.id === retItem.id);
      if (origItem) {
        refundAmount += (origItem.price || 0) * (retItem.quantity || 1);
      }
    });

    const orderReturn = await prisma.orderReturn.create({
      data: {
        orderId: data.orderId,
        storeId: order.storeId,
        refundAmount: refundAmount,
        reason: data.reason,
        items: JSON.stringify(data.items),
        status: 'pending_inspection',
      }
    });

    const isFullReturn = data.items.length === orderItems.length && data.items.every((it: any, idx: number) => it.quantity === (orderItems[idx]?.quantity || 1));
    
    await prisma.order.update({
      where: { id: data.orderId },
      data: { status: isFullReturn ? 'returned' : 'partially_returned' }
    });

    return { success: true, orderReturn };
  } catch (error) {
    console.error('Error requesting order return:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
`;

if (!code.includes('requestOrderReturnAction')) {
  code += '\n' + newAction;
  fs.writeFileSync('app/actions/order.ts', code);
  console.log('Added requestOrderReturnAction');
} else {
  console.log('Action already exists');
}
