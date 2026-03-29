const fs = require('fs');

const path = './src/locales/portalTranslations.js';
let content = fs.readFileSync(path, 'utf8');

// Insert EN keys
if (!content.includes('"choose_treatment"')) {
    content = content.replace(/"ciki_dental": "Baan More Fun Dental",/, '"ciki_dental": "Baan More Fun Dental",\n        "choose_treatment": "Choose a treatment...",\n        "choose_date": "CHOOSE DATE",');
}

// Insert TH keys
if (!content.includes('"เลือกบริการ..."')) {
    content = content.replace(/"ciki_dental": "บ้านหมอฟัน",/, '"ciki_dental": "บ้านหมอฟัน",\n        "choose_treatment": "เลือกบริการ...",\n        "choose_date": "เลือกวันที่",');
}

// Insert CN keys
if (!content.includes('"选择治疗..."')) {
    content = content.replace(/"ciki_dental": "บ้านหมอฟัน \(牙科\)",/, '"ciki_dental": "บ้านหมอฟัน (牙科)",\n        "choose_treatment": "选择服务...",\n        "choose_date": "选择日期",');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Translations updated successfully.');
