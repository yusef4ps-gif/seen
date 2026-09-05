const fs = require('fs');

const productsPath = 'app/merchant/[slug]/products/page.tsx';
let content = fs.readFileSync(productsPath, 'utf8');

// Add papaparse import and action import
content = content.replace(
  "import { createProductAction, updateProductAction, deleteProductAction } from '@/app/actions/product';",
  "import { createProductAction, updateProductAction, deleteProductAction } from '@/app/actions/product';\nimport { bulkCreateProductsAction } from '@/app/actions/importProducts';\nimport Papa from 'papaparse';"
);

// Replace handleExcelImport function
const newHandleExcelImport = `
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    
    setIsImportingExcel(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const productsToImport = results.data.map((row: any) => ({
            name: row.name || row['الاسم'] || row['اسم المنتج'],
            description: row.description || row['الوصف'] || '',
            category: row.category || row['التصنيف'] || 'مستورد',
            price: row.price || row['السعر'] || 0,
            comparePrice: row.comparePrice || row['السعر قبل الخصم'],
            stock: row.stock || row['المخزون'] || 0,
            images: row.image ? [row.image] : [],
          })).filter(p => p.name);
          
          if (productsToImport.length === 0) {
            alert('لم يتم العثور على منتجات صالحة في الملف. يرجى التأكد من وجود أعمدة بالأسماء (الاسم, الوصف, السعر, المخزون)');
            setIsImportingExcel(false);
            return;
          }

          const res = await bulkCreateProductsAction(store.id, productsToImport);
          
          if (res.success) {
            const user = authEngine.getCurrentUser();
            if (user) {
              await logActivityAction({
                storeId: store.id,
                userName: user.name,
                action: 'إضافة',
                entity: 'منتج',
                details: \`تم استيراد \${res.count} منتج من ملف \${file.name}\`,
                device: navigator.userAgent.includes('Mobile') ? 'جوال' : 'كمبيوتر/لابتوب'
              });
            }
            alert(\`تم استيراد \${res.count} منتج بنجاح!\`);
            await refreshProducts();
            setIsImportModalOpen(false);
          } else {
            alert('حدث خطأ أثناء حفظ المنتجات في قاعدة البيانات');
          }
        } catch (error) {
          console.error(error);
          alert('حدث خطأ أثناء قراءة الملف');
        } finally {
          setIsImportingExcel(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error(error);
        alert('فشل في قراءة ملف الإكسل/CSV');
        setIsImportingExcel(false);
      }
    });
  };
`;

content = content.replace(
  /const handleExcelImport = \([\s\S]*?\}, 2000\);\n  \};/,
  newHandleExcelImport
);

fs.writeFileSync(productsPath, content, 'utf8');
