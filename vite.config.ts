import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

function copyImagesPlugin() {
  return {
    name: 'copy-images-plugin',
    closeBundle() {
      const srcDir = path.join(process.cwd(), 'src/assets/images');
      const distDir = path.join(process.cwd(), 'dist/assets/images');
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(distDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        files.forEach(f => {
          const s = path.join(srcDir, f);
          const d = path.join(distDir, f);
          if (fs.statSync(s).isFile()) {
            fs.copyFileSync(s, d);
          }
        });
      }
    }
  };
}

export default defineConfig({
  plugins: [
    copyImagesPlugin(),
    react(),
    tailwindcss(),
    {
      name: 'gemini-api-middleware',
      configureServer(server) {
        server.middlewares.use('/api/gemini', async (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { prompt, systemInstruction } = JSON.parse(body || '{}');
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'GEMINI_API_KEY environment variable missing' }));
                  return;
                }
                const ai = new GoogleGenAI({
                  apiKey,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: prompt,
                  config: {
                    systemInstruction: systemInstruction || 'You are IDEMO, an ultra-compact, minimalistic private travel concierge for Serbia and EXPO 2027 Belgrade. Provide tailored, highly specific, authentic local insights without fluff. Suggest exact venues, timeframes, and practical tips.',
                  }
                });
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text: response.text }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Error processing AI query' }));
              }
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
