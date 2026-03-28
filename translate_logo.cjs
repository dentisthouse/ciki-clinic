const fs = require('fs');
const path = require('path');

const portalPath = path.join(__dirname, 'src/pages/LinePortal.jsx');
let content = fs.readFileSync(portalPath, 'utf-8');

// Replace all occurrences of physical strings "บ้านหมอฟัน" mapping them to the translation key
content = content.replaceAll('alt="บ้านหมอฟัน"', 'alt={pt("ciki_dental")}');
content = content.replaceAll('>บ้านหมอฟัน</span>', '>{pt("ciki_dental")}</span>');
content = content.replaceAll('>บ้านหมอฟัน</h1>', '>{pt("ciki_dental")}</h1>');

fs.writeFileSync(portalPath, content, 'utf-8');
console.log('Logo translations fixed successfully.');
