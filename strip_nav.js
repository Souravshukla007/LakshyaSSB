const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function cleanFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;
  if (filePath.includes('layout.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove Navbar and Footer imports
  content = content.replace(/import\s+Navbar\s+from\s+['"][^'"]+['"];?\n?/g, '');
  content = content.replace(/import\s+Footer\s+from\s+['"][^'"]+['"];?\n?/g, '');
  content = content.replace(/import\s+\{\s*Navbar\s*\}\s+from\s+['"][^'"]+['"];?\n?/g, '');
  content = content.replace(/import\s+\{\s*Footer\s*\}\s+from\s+['"][^'"]+['"];?\n?/g, '');

  // Remove JSX tags
  content = content.replace(/<Navbar\s*\/>\n?/g, '');
  content = content.replace(/<Footer\s*\/>\n?/g, '');
  // Also catch variations with spaces
  content = content.replace(/<\s*Navbar\s*\/?>[\s\S]*?<\/\s*Navbar\s*>\n?/g, '');
  content = content.replace(/<\s*Footer\s*\/?>[\s\S]*?<\/\s*Footer\s*>\n?/g, '');
  
  // A somewhat aggressive sweeping out of empty lines that might be left behind:
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

const appDir = path.join(__dirname, 'app');
console.log(`Scanning ${appDir} for Navbar/Footer duplicates...`);
walkDir(appDir, cleanFile);
console.log('Cleanup complete.');
