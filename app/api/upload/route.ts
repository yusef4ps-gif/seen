import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.gif': ['image/gif'],
  '.pdf': ['application/pdf'],
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم إرسال أي ملف' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedMimes = ALLOWED_EXTENSIONS[ext];
    if (!allowedMimes) {
      return NextResponse.json(
        { success: false, error: 'نوع الملف غير مدعوم. المسموح: JPG, PNG, WEBP, GIF, PDF فقط.' },
        { status: 400 }
      );
    }

    if (file.type && !allowedMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'نوع محتوى الملف (MIME) لا يطابق الامتداد المسموح.' },
        { status: 400 }
      );
    }

    const maxBytes = ext === '.pdf' ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ success: false, error: 'حجم الملف يتجاوز الحد المسموح' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Prevent path traversal and unpredictable MIME execution using random ID
    const safeBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40) || 'file';
    const uniqueName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${safeBase}${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

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
