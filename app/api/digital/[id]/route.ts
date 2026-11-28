import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  CANONICAL_MIME_BY_EXT,
  buildContentDisposition,
} from '@/lib/digital-assets';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = params?.id || '';
    if (!/^[a-zA-Z0-9_-]{4,80}$/.test(assetId)) {
      return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
    }

    const row = await prisma.siteContent.findUnique({
      where: { key: `digital_asset_${assetId}` },
    });

    if (!row || row.group !== 'digital_assets' || !row.value) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    const payload = JSON.parse(row.value) as {
      fileName?: string;
      ext?: string;
      mimeType?: string;
      dataBase64?: string;
    };

    if (!payload?.dataBase64) {
      return NextResponse.json({ error: 'بيانات الملف غير صالحة' }, { status: 404 });
    }

    const ext = (payload.ext || '').toLowerCase();
    const safeMime =
      CANONICAL_MIME_BY_EXT[ext] ||
      (payload.mimeType && !payload.mimeType.includes('html') && !payload.mimeType.includes('svg')
        ? payload.mimeType
        : 'application/octet-stream');

    const buffer = Buffer.from(payload.dataBase64, 'base64');
    const isImage = safeMime.startsWith('image/');
    const fileName = payload.fileName || `asset${ext || ''}`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': safeMime,
        'Content-Length': String(buffer.length),
        'Content-Disposition': buildContentDisposition(fileName, isImage),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Digital asset download error:', error);
    return NextResponse.json({ error: 'تعذر تحميل الملف' }, { status: 500 });
  }
}
