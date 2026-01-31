const fs = require('fs');
const path = require('path');

const preloadPath = path.join(__dirname, '../dist/preload/preload/index.js');

if (fs.existsSync(preloadPath)) {
  let content = fs.readFileSync(preloadPath, 'utf8');
  
  // Replace the require paths to point to the correct location and add .js extension
  content = content.replace(
    /require\("\.\.\/shared\/([^"]+)"\)/g,
    'require("../../shared/$1.js")'
  );
  
  fs.writeFileSync(preloadPath, content, 'utf8');
  console.log('✓ Fixed preload imports');
} else {
  console.log('⚠ Preload file not found');
}
