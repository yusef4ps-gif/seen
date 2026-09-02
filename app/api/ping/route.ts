import { NextResponse } from 'next/server';

const globalForTracking = globalThis as unknown as {
  activeVisitors: Record<string, Record<string, number>>;
};

const activeVisitors = globalForTracking.activeVisitors || {};
if (process.env.NODE_ENV !== 'production') {
  globalForTracking.activeVisitors = activeVisitors;
}

export async function POST(req: Request) {
  try {
    const { storeId, visitorId } = await req.json();

    if (!storeId || !visitorId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!activeVisitors[storeId]) {
      activeVisitors[storeId] = {};
    }

    // Register heartbeat for this visitor
    activeVisitors[storeId][visitorId] = Date.now();

    // Clean up visitors older than 10 seconds and count active ones
    const now = Date.now();
    let currentActive = 0;

    for (const [vId, timestamp] of Object.entries(activeVisitors[storeId])) {
      if (now - timestamp > 10000) {
        delete activeVisitors[storeId][vId];
      } else {
        currentActive++;
      }
    }

    return NextResponse.json({ success: true, activeVisitorsNow: currentActive });
  } catch (error) {
    console.error('Error in ping API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
