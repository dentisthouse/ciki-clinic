const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src/locales/portalTranslations.js');
let locales = fs.readFileSync(localesPath, 'utf-8');

// Add new keys to EN
locales = locales.replace(
    /"branch_ladprao": "Ladprao Branch",/g,
    `"branch_ladprao": "Ladprao Branch",
        "branch_prachinburi": "Prachinburi Branch",
        "see_all": "See All",
        "select_service_label": "SELECT SERVICE",
        "select_branch_label": "SELECT BRANCH",
        "avail_slots": "AVAILABLE SLOTS",
        "tier_standard": "Standard",
        "premium_services": "Premium Services",`
);

// Add new keys to TH
locales = locales.replace(
    /"branch_ladprao": "สาขาลาดพร้าว",/g,
    `"branch_ladprao": "สาขาลาดพร้าว",
        "branch_prachinburi": "สาขาปราจีนบุรี",
        "see_all": "ดูทั้งหมด",
        "select_service_label": "เลือกบริการ",
        "select_branch_label": "เลือกสาขา",
        "avail_slots": "ช่วงเวลาที่ว่าง",
        "tier_standard": "ระดับมาตรฐาน",
        "premium_services": "บริการดูแลพิเศษ",`
);

// Add new keys to CN
locales = locales.replace(
    /"branch_ladprao": "拉普绕分店 \(Ladprao\)",/g,
    `"branch_ladprao": "拉普绕分店 (Ladprao)",
        "branch_prachinburi": "巴真府分店",
        "see_all": "查看全部",
        "select_service_label": "选择服务",
        "select_branch_label": "选择分店",
        "avail_slots": "可用时间段",
        "tier_standard": "标准会员",
        "premium_services": "高级服务",`
);

fs.writeFileSync(localesPath, locales, 'utf-8');


const portalPath = path.join(__dirname, 'src/pages/LinePortal.jsx');
let content = fs.readFileSync(portalPath, 'utf-8');

// Replacements
const replacements = {
    ">Premium Services<": ">{pt('premium_services')}<",
    "\"Premium Services\"": "{pt('premium_services')}",
    "title=\"Premium Services\"": "title={pt('premium_services')}",
    
    // "See All" matches the literal React text block without quotes
    "See All": "{pt('see_all')}",
    "SELECT SERVICE": "{pt('select_service_label')}",
    "SELECT BRANCH": "{pt('select_branch_label')}",
    "AVAILABLE SLOTS": "{pt('avail_slots')}",
    
    "{currentUser?.tier || 'Standard'}": "{pt('tier_' + (currentUser?.tier?.toLowerCase() || 'standard'))}",
    
    // Modify the branches array to only include Prachinburi
    "[pt('branch_sukhumvit'), pt('branch_siam'), pt('branch_ladprao')]": "[pt('branch_prachinburi')]",
};

for (const [key, val] of Object.entries(replacements)) {
    content = content.replaceAll(key, val);
}

fs.writeFileSync(portalPath, content, 'utf-8');
console.log('Translations fixed successfully.');
