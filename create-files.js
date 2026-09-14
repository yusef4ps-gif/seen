const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const data = [
    {
      'اسم المنتج': 'بنطلون جينز بقصة مستقيمة',
      'الوصف': 'جينز كلاسيكي مريح ومناسب للاستخدام اليومي',
      'التصنيف': 'رجالي > بناطيل > جينز',
      'السعر': 15,
      'المخزون': 10,
      'الصورة': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'
    },
    {
      'اسم المنتج': 'شورت صيفي قطني',
      'الوصف': 'شورت قطني خفيف مناسب للصيف',
      'التصنيف': 'رجالي > بناطيل > شورت',
      'السعر': 15,
      'المخزون': 10,
      'الصورة': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800'
    },
    {
      'اسم المنتج': 'بنطلون قطن مريح',
      'الوصف': 'بنطلون قطني مناسب للرياضة',
      'التصنيف': 'رجالي > بناطيل > قطن',
      'السعر': 15,
      'المخزون': 10,
      'الصورة': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'
    },
    {
      'اسم المنتج': 'تيشرت بولو أبيض',
      'الوصف': 'تيشرت بولو كلاسيكي بأكمام قصيرة',
      'التصنيف': 'رجالي > تيشرتات > صيفي',
      'السعر': 15,
      'المخزون': 10,
      'الصورة': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'
    },
    {
      'اسم المنتج': 'بلوفر شتوي صوف',
      'الوصف': 'بلوفر دافئ من الصوف الناعم',
      'التصنيف': 'رجالي > تيشرتات > بلوفرات',
      'السعر': 15,
      'المخزون': 10,
      'الصورة': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'
    },
    {
      'اسم المنتج': 'حذاء رياضي أسود',
      'الوصف': 'حذاء رياضي خفيف ومريح للجري',
      'التصنيف': 'رجالي > جزمات',
      'السعر': 15,
      'المخزون': 10,
      'الصورة': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'
    },
    {
      'اسم المنتج': 'طقم ملابس ولادي',
      'الوصف': 'طقم ولادي مكون من قطعتين',
      'التصنيف': 'ولادي > ملابس أطقم',
      'السعر': 15,
      'المخزون': 10,
      'الصورة': 'https://images.unsplash.com/photo-1519238263530-99bad11153f0?w=800'
    }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(wb, ws, 'Products');

const desktopPath = path.join(require('os').homedir(), 'Desktop');
const xlsxPath = path.join(desktopPath, 'ملابس_رجالي.xlsx');
const csvPath = path.join(desktopPath, 'ملابس_رجالي.csv');

xlsx.writeFile(wb, xlsxPath);

const csv = xlsx.utils.sheet_to_csv(ws);
fs.writeFileSync(csvPath, '\uFEFF' + csv, 'utf8');

console.log('Files created at:', desktopPath);
