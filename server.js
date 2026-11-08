// server.js - IDEMO Universal Server Runner
// Ensures clean execution across any Node runtime (Node 20, 22+)
import fs from 'fs';
import path from 'path';

const distServer = path.join(process.cwd(), 'dist', 'server.js');
if (fs.existsSync(distServer)) {
  await import('./dist/server.js');
} else {
  await import('./server.ts');
}
