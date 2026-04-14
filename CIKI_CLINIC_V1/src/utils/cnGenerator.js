const charMap = {
    'ก': '1', 'ข': '1', 'ค': '1', 'ฆ': '1', 'A': '1', 'B': '1', 'C': '1', 'a': '1', 'b': '1', 'c': '1',
    'ง': '2', 'จ': '2', 'ฉ': '2', 'ช': '2', 'ซ': '2', 'ฌ': '2', 'D': '2', 'E': '2', 'F': '2', 'd': '2', 'e': '2', 'f': '2',
    'ญ': '3', 'ฎ': '3', 'ฏ': '3', 'ฐ': '3', 'ฑ': '3', 'ฒ': '3', 'ณ': '3', 'G': '3', 'H': '3', 'I': '3', 'g': '3', 'h': '3', 'i': '3',
    'ด': '4', 'ต': '4', 'ถ': '4', 'ท': '4', 'ธ': '4', 'J': '4', 'K': '4', 'L': '4', 'j': '4', 'k': '4', 'l': '4',
    'น': '5', 'บ': '5', 'ป': '5', 'ผ': '5', 'ฝ': '5', 'M': '5', 'N': '5', 'O': '5', 'm': '5', 'n': '5', 'o': '5',
    'พ': '6', 'ฟ': '6', 'ภ': '6', 'ม': '6', 'ย': '6', 'P': '6', 'Q': '6', 'R': '6', 'p': '6', 'q': '6', 'r': '6',
    'ร': '7', 'ล': '7', 'ว': '7', 'S': '7', 'T': '7', 's': '7', 't': '7',
    'ศ': '8', 'ษ': '8', 'ส': '8', 'U': '8', 'V': '8', 'W': '8', 'u': '8', 'v': '8', 'w': '8',
    'ห': '9', 'ฬ': '9', 'อ': '9', 'ฮ': '9', 'X': '9', 'Y': '9', 'Z': '9', 'x': '9', 'y': '9', 'z': '9'
};

/**
 * Extracts the 2-digit code for a name/surname based on the mapping table.
 * It ignores vowels/tone marks and looks for characters defined in charMap.
 */
export const getNameCode = (text) => {
    if (!text) return '00';
    
    let code = '';
    for (let char of text) {
        if (charMap[char]) {
            code += charMap[char];
        }
        if (code.length === 2) break;
    }
    
    // Pad with '0' if the name is too short or doesn't have enough consonants
    return code.padEnd(2, '0');
};

/**
 * Generates the CN prefix (4 digits).
 */
export const generateCNPrefix = (firstName, lastName) => {
    const fCode = getNameCode(firstName);
    const lCode = getNameCode(lastName);
    return `${fCode}${lCode}`;
};

/**
 * Generates the full CN by checking against existing patients.
 * Format: [4-digit prefix]-[running number]
 * Example: 8642-001
 */
export const generateFullCN = (firstName, lastName, existingPatients = []) => {
    const prefix = generateCNPrefix(firstName, lastName);
    
    // Find all patients with the same prefix
    const matchingPatients = existingPatients.filter(p => p.hn && p.hn.startsWith(prefix));
    
    let nextNum = 1;
    if (matchingPatients.length > 0) {
        // Extract the numbers after the dash and find the max
        const numbers = matchingPatients.map(p => {
            const parts = p.hn.split('-');
            return parts.length > 1 ? parseInt(parts[1], 10) : 0;
        }).filter(n => !isNaN(n));
        
        if (numbers.length > 0) {
            nextNum = Math.max(...numbers) + 1;
        }
    }
    
    const runningNum = String(nextNum).padStart(3, '0');
    return `${prefix}-${runningNum}`;
};
