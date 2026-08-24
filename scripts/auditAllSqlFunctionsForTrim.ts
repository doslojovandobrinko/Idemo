import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve('supabase/migrations');

const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

interface FunctionDef {
  file: string;
  name: string;
  startLine: number;
  endLine: number;
  body: string;
  hasSearchPathEmpty: boolean;
  trimUsages: { line: number; text: string; kind: string }[];
}

const functions: FunctionDef[] = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  const lines = content.split('\n');

  let currentFunc: FunctionDef | null = null;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const createMatch = line.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/i);
    if (createMatch) {
      if (currentFunc) {
        currentFunc.endLine = lineNum - 1;
        functions.push(currentFunc);
      }
      currentFunc = {
        file,
        name: createMatch[1],
        startLine: lineNum,
        endLine: lineNum,
        body: line,
        hasSearchPathEmpty: false,
        trimUsages: [],
      };
    } else if (currentFunc) {
      currentFunc.body += '\n' + line;
      if (/SET\s+search_path\s*=\s*''/i.test(line)) {
        currentFunc.hasSearchPathEmpty = true;
      }
      if (line.includes('pg_catalog.trim(')) {
        currentFunc.trimUsages.push({ line: lineNum, text: line.trim(), kind: 'pg_catalog.trim' });
      } else if (/\btrim\s*\(/.test(line) && !line.includes('pg_catalog.btrim') && !line.includes('btrim(') && !line.trim().startsWith('--')) {
        currentFunc.trimUsages.push({ line: lineNum, text: line.trim(), kind: 'unqualified trim' });
      }
    }
  });

  if (currentFunc) {
    currentFunc.endLine = lines.length;
    functions.push(currentFunc);
  }
}

console.log(`\n======================================================`);
console.log(`TOTAL FUNCTIONS FOUND: ${functions.length}`);
console.log(`======================================================\n`);

const functionsWithTrim = functions.filter(f => f.trimUsages.length > 0);
console.log(`Functions with trim / pg_catalog.trim usages: ${functionsWithTrim.length}\n`);

functionsWithTrim.forEach(f => {
  console.log(`\n--- [${f.file}] Function: ${f.name} (Lines ${f.startLine}-${f.endLine}) (search_path='': ${f.hasSearchPathEmpty}) ---`);
  f.trimUsages.forEach(u => {
    console.log(`  Line ${u.line} [${u.kind}]: ${u.text}`);
  });
});
