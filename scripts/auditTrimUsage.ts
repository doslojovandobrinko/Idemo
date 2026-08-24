import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve('supabase/migrations');
const FUNCTIONS_DIR = path.resolve('supabase/functions');

const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .map(f => path.join(MIGRATIONS_DIR, f));

console.log(`Auditing ${files.length} migration files for trim / pg_catalog.trim / btrim patterns...`);

interface MatchInfo {
  file: string;
  line: number;
  content: string;
  type: string;
}

const matches: MatchInfo[] = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('pg_catalog.trim(')) {
      matches.push({ file: path.basename(file), line: idx + 1, content: line.trim(), type: 'pg_catalog.trim' });
    } else if (/\btrim\s*\(/.test(line) && !line.includes('pg_catalog.btrim') && !line.includes('btrim(') && !line.trim().startsWith('--')) {
      matches.push({ file: path.basename(file), line: idx + 1, content: line.trim(), type: 'unqualified trim' });
    }
  });
}

console.log(`\nFound ${matches.length} matches across migrations:`);
matches.forEach(m => {
  console.log(`[${m.type}] ${m.file}:${m.line} -> ${m.content}`);
});
