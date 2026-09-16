const fs = require('fs');
let content = fs.readFileSync('app/seenayhq7x/page.tsx', 'utf8');

// Tab: Packages
content = content.replace(
  '<div className="flex items-center gap-3">\n                    <button onClick={() => setPlanFormOpen(true)}',
  '<div className="flex items-center gap-3">\n                    <RefreshTabButton />\n                    <button onClick={() => setPlanFormOpen(true)}'
);

// Tab: Stores
content = content.replace(
  '<div className="flex items-center gap-2">\n                    <button \n                      onClick={() => setCreateStoreOpen(true)}',
  '<div className="flex items-center gap-2">\n                    <RefreshTabButton />\n                    <button \n                      onClick={() => setCreateStoreOpen(true)}'
);

// Tab: Texts
content = content.replace(
  '                  {textsSaveSuccess && (',
  '                  <div className="flex items-center gap-3">\n                    <RefreshTabButton />\n                  </div>\n                  {textsSaveSuccess && ('
);

fs.writeFileSync('app/seenayhq7x/page.tsx', content);
console.log('Successfully updated the remaining tabs.');
