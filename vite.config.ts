import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

// Custom plugin to copy src/assets/images to dist/assets/images during production builds
function copyImagesPlugin() {
  return {
    name: 'copy-images',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'src/assets/images');
      const destDir = path.resolve(__dirname, 'dist/assets/images');

      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        for (const file of files) {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(destDir, file);
          fs.copyFileSync(srcFile, destFile);
        }
        console.log(`[copy-images] Successfully copied ${files.length} images to dist/assets/images`);
      }
    }
  };
}

// Custom plugin to serve src/assets/images over /assets/images/ in development mode
function devImagesPlugin() {
  return {
    name: 'dev-images-middleware',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.includes('assets/images/')) {
          const urlObj = new URL(req.url, 'http://localhost');
          const pathname = decodeURIComponent(urlObj.pathname);
          const matchIndex = pathname.indexOf('assets/images/');
          if (matchIndex !== -1) {
            const cleanPath = pathname.substring(matchIndex + 'assets/images/'.length);
            
            // Try src/assets/images then public/assets/images
            let localFilePath = path.resolve(__dirname, 'src/assets/images', cleanPath);
            if (!fs.existsSync(localFilePath)) {
              localFilePath = path.resolve(__dirname, 'public/assets/images', cleanPath);
            }
            
            // If requested .webp and doesn't exist, try .png or vice versa
            if (!fs.existsSync(localFilePath)) {
              if (cleanPath.endsWith('.webp')) {
                const pngAlt = localFilePath.replace(/\.webp$/, '.png');
                if (fs.existsSync(pngAlt)) localFilePath = pngAlt;
              } else if (cleanPath.endsWith('.png')) {
                const webpAlt = localFilePath.replace(/\.png$/, '.webp');
                if (fs.existsSync(webpAlt)) localFilePath = webpAlt;
              }
            }

            if (fs.existsSync(localFilePath)) {
              let contentType = 'image/png';
              if (localFilePath.endsWith('.jpg') || localFilePath.endsWith('.jpeg')) {
                contentType = 'image/jpeg';
              } else if (localFilePath.endsWith('.svg')) {
                contentType = 'image/svg+xml';
              } else if (localFilePath.endsWith('.webp')) {
                contentType = 'image/webp';
              }
              res.setHeader('Content-Type', contentType);
              res.end(fs.readFileSync(localFilePath));
              return;
            }
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({mode, command}) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: './',
    plugins: [react(), tailwindcss(), copyImagesPlugin(), devImagesPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
