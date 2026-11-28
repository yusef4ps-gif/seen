'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  RefreshCw,
  X,
  ExternalLink,
  Check,
  Edit3,
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PortfolioItem } from '@/lib/types';
import ImageUploader from '@/components/ImageUploader';

interface PortfolioManagerProps {
  items: PortfolioItem[];
  onChange: (nextItems: PortfolioItem[]) => void;
}

export default function PortfolioManager({ items, onChange }: PortfolioManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setFileUrl('');
    setFileName('');
    setExternalUrl('');
  };

  const handleStartEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setImageUrl(item.imageUrl || '');
    setFileUrl(item.fileUrl || '');
    setFileName(item.fileName || '');
    setExternalUrl(item.externalUrl || '');
    setIsAdding(true);
  };

  const handleSaveItem = () => {
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان العمل أو المشروع');
      return;
    }

    const nextItem: PortfolioItem = {
      id: editingId || `port_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: description.trim() || '',
      imageUrl: imageUrl.trim() || '',
      fileUrl: fileUrl.trim() || '',
      fileName: fileName.trim() || '',
      externalUrl: externalUrl.trim() || '',
    };

    if (editingId) {
      onChange(items.map((it) => (it.id === editingId ? nextItem : it)));
      toast.success('تم تحديث العمل في القائمة — اضغط حفظ الإعدادات لاعتماد التغيير');
    } else {
      onChange([...items, nextItem]);
      toast.success('تمت إضافة العمل للقائمة — اضغط حفظ الإعدادات لاعتماد التغيير');
    }
    resetForm();
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
    if (editingId === id) resetForm();
  };

  const isLocalUploaded =
    fileUrl.startsWith('/api/digital/') || fileUrl.startsWith('/uploads/');

  return (
    <div className="mt-3 p-4 rounded-2xl border border-teal-200 dark:border-teal-800/70 bg-white dark:bg-slate-900 space-y-4 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-teal-600" />
            <span>قائمة أعمالي ومشاريعي السابقة ({items.length})</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            أضف أعمالك الحقيقية مع إمكانية إرفاق ملف (PDF, Word, Excel, PowerPoint, ZIP) أو صورة أو رابط مشروع. لن تظهر أي أعمال وهمية في متجرك.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عمل جديد</span>
          </button>
        )}
      </div>

      {/* Add / Edit Item Form */}
      {isAdding && (
        <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-teal-900 dark:text-teal-200">
              {editingId ? 'تعديل العمل المحدد' : 'إضافة عمل / مشروع جديد لقائمتك'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان العمل / المشروع <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: دراسة جدوى لمشروع تجاري متكامل"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                وصف العمل والنتائج المحققة (اختياري)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب نبذة مختصرة عن تفاصيل العمل أو ما تم إنجازه..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none resize-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Optional File Upload / External File URL */}
              <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  إرفاق ملف العمل (PDF / Word / Excel / PowerPoint / ZIP):
                </label>

                <div className="flex items-center gap-2">
                  <label
                    className={`flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold transition-all truncate ${
                      isUploadingFile ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    {isUploadingFile ? (
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">
                      {isUploadingFile
                        ? 'جارٍ رفع الملف...'
                        : fileUrl
                        ? isLocalUploaded
                          ? `تم رفع الملف: ${fileName || 'ملف العمل'} ✓`
                          : 'رابط ملف مضاف ✓'
                        : 'اختر ملفاً من جهازك...'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.epub,.txt,.csv,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      disabled={isUploadingFile}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 4.5 * 1024 * 1024) {
                          toast.error('حجم الملف يتجاوز 4.5MB، يمكنك وضع رابط Google Drive في الحقل أدناه.');
                          e.target.value = '';
                          return;
                        }
                        setIsUploadingFile(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', file);
                          const res = await fetch('/api/upload', { method: 'POST', body: fd });
                          const data = await res.json();
                          if (data.success && data.url) {
                            setFileUrl(data.url);
                            setFileName(data.fileName || file.name);
                            toast.success('تم رفع الملف بنجاح! 📥');
                          } else {
                            toast.error(data.error || 'فشل رفع الملف');
                          }
                        } catch (err: any) {
                          toast.error(err?.message || 'حدث خطأ أثناء رفع الملف');
                        } finally {
                          e.target.value = '';
                          setIsUploadingFile(false);
                        }
                      }}
                    />
                  </label>
                  {fileUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl('');
                        setFileName('');
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                      title="إزالة الملف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  type="url"
                  placeholder="أو رابط ملف خارجي (https://drive.google.com/...)"
                  value={isLocalUploaded ? '' : fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500"
                />

                {fileUrl && (
                  <input
                    type="text"
                    placeholder="اسم الملف المعروض للعميل (مثال: ملف_سابقة_الأعمال.docx)"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-teal-500"
                  />
                )}
              </div>

              {/* Optional Preview Image */}
              <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <ImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="صورة معاينة للعمل (اختياري)"
                  maxSizeMB={4}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                رابط خارجي للمشروع (اختياري)
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none text-left focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isUploadingFile}
                onClick={handleSaveItem}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingId ? 'تحديث في القائمة' : 'إضافة للقائمة ✓'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Portfolio Items List */}
      {items.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
          لم تقم بإضافة أي أعمال بعد. اضغط «إضافة عمل جديد» لإضافة مشاريعك وملفاتك الحقيقية.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-teal-600/15 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[10px] text-slate-500">
                    {item.fileUrl && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                        <FileText className="w-2.5 h-2.5" />
                        <span>{item.fileName || 'ملف مرفق'}</span>
                      </span>
                    )}
                    {item.externalUrl && (
                      <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold">
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>رابط خارجي</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartEdit(item)}
                  className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg transition-colors"
                  title="تعديل"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
