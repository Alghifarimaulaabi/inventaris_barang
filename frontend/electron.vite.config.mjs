import { defineConfig } from 'electron-vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { readdirSync, statSync } from 'fs'

// Helper function to find all HTML files
function getHtmlFiles(dir, fileList = {}) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = resolve(dir, file);
    if (statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      const name = filePath.replace(resolve(__dirname, 'src/renderer'), '').replace(/\\/g, '/').replace(/^\//, '').replace(/\.html$/, '');
      fileList[name || 'index'] = filePath;
    }
  });
  return fileList;
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [
      tailwindcss()
    ],
    build: {
      rollupOptions: {
        input: getHtmlFiles(resolve(__dirname, 'src/renderer'))
      }
    }
  }
})
