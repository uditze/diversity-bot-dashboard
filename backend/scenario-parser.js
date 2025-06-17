import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarioFile = path.join(__dirname, 'scenarios.txt');

// פונקציה זו קוראת את כל התרחישים מהקובץ ומחזירה אותם כמערך
export function getAllScenarios() {
  try {
    const content = fs.readFileSync(scenarioFile, 'utf8');
    const blocks = content.split('================================================================================').filter(b => b.trim() !== '');

    const allScenarios = blocks.map((block, index) => {
      const heMatch = block.match(/\s*\[HEBREW\]\s*([\s\S]*?)(?=\s*\[[A-Z]+\]|$)/);
      const enMatch = block.match(/\s*\[ENGLISH\]\s*([\s\S]*?)(?=\s*\[[A-Z]+\]|$)/);
      const arMatch = block.match(/\s*\[ARABIC\]\s*([\s\S]*?)(?=\s*\[[A-Z]+\]|$)/);

      return {
        id: index,
        he: heMatch ? heMatch[1].trim() : null,
        en: enMatch ? enMatch[1].trim() : null,
        ar: arMatch ? arMatch[1].trim() : null,
      };
    });

    return allScenarios;

  } catch (error) {
    console.error("Error reading scenarios file:", error);
    return [];
  }
}
