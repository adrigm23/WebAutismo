const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const EXCLUDED_DIRS = new Set(['node_modules', '.next', 'tests', 'scripts']);

const replacements = [
  // Valores muy grandes → rounded-xl (12px / 1rem)
  [/rounded-\[2\.5rem\]/g, 'rounded-xl'],
  [/rounded-\[2rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.75rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.7rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.6rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.5rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.4rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.35rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.3rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.25rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.2rem\]/g, 'rounded-xl'],
  [/rounded-\[1\.15rem\]/g, 'rounded-xl'],
  [/rounded-\[40px\]/g, 'rounded-xl'],
  [/rounded-\[32px\]/g, 'rounded-xl'],
  [/rounded-\[28px\]/g, 'rounded-xl'],
  [/rounded-\[24px\]/g, 'rounded-xl'],
  [/rounded-3xl/g, 'rounded-xl'],
  [/rounded-2xl/g, 'rounded-xl'],

  // Valores medios → rounded-lg
  [/rounded-\[1\.1rem\]/g, 'rounded-lg'],
  [/rounded-\[1\.05rem\]/g, 'rounded-lg'],
  [/rounded-\[1rem\]/g, 'rounded-lg'],
  [/rounded-\[0\.95rem\]/g, 'rounded-lg'],
  [/rounded-\[18px\]/g, 'rounded-lg'],

  // Valores pequeños → rounded-md
  [/rounded-\[0\.8rem\]/g, 'rounded-md'],
];

let totalFiles = 0;
let modifiedFiles = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  totalFiles++;
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;

  for (const [pattern, replacement] of replacements) {
    const before = content;
    content = content.replace(pattern, replacement);
    // Count approximate replacements by comparing lengths or occurrences
    const matches = before.match(pattern);
    if (matches) count += matches.length;
  }

  if (count > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    const rel = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`  [${count} replacements] ${rel}`);
    modifiedFiles++;
  }
}

console.log('Unifying border-radius values in src/...\n');
walkDir(SRC_DIR);
console.log(`\nDone. Scanned ${totalFiles} files, modified ${modifiedFiles} files.`);
