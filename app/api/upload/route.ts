import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  CANONICAL_MIME_BY_EXT,
  MAX_DOCUMENT_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
  isDocumentExtension,
} from '@/lib/digital-assets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم إرسال أي ملف' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedMimes = ALLOWED_UPLOAD_EXTENSIONS[ext];
    if (!allowedMimes) {
      return NextResponse.json(
        {
          success: false,
          error:
            'نوع الملف غير مدعوم. المسموح: الصور (JPG, PNG, WEBP, GIF) والمستندات (PDF, Word, Excel, PowerPoint, ZIP, RAR, EPUB, TXT).',
        },
        { status: 400 }
      );
    }

    const rawMime = (file.type || '').split(';')[0].trim().toLowerCase();
    if (rawMime && !allowedMimes.includes(rawMime)) {
      return NextResponse.json(
        { success: false, error: 'نوع محتوى الملف (MIME) لا يطابق الامتداد المسموح.' },
        { status: 400 }
      );
    }

    const maxBytes = isDocumentExtension(ext) ? MAX_DOCUMENT_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          error:
            'حجم الملف يتجاوز الحد المسموح للرفع المباشر (4.5 ميجابايت). للملفات الأكبر يُنصح برفعها على Google Drive وإدخال الرابط الخارجي.',
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Persist uploaded file in PostgreSQL (survives serverless cold starts on Netlify & local runs)
    const assetId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const canonicalMime = CANONICAL_MIME_BY_EXT[ext] || rawMime || 'application/octet-stream';

    await prisma.siteContent.create({
      data: {
        key: `digital_asset_${assetId}`,
        group: 'digital_assets',
        label: file.name,
        value: JSON.stringify({
          fileName: file.name,
          ext,
          mimeType: canonicalMime,
          size: file.size,
          dataBase64: buffer.toString('base64'),
        }),
      },
    });

    const publicUrl = `/api/digital/${assetId}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'فشل رفع الملف' }, { status: 500 });
  }
}
