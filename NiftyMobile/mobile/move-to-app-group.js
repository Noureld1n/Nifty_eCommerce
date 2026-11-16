#!/usr/bin/env node
/*
 * Moves the main app screens into src/app/(app) and fixes every relative
 * import that is affected (in the moved files AND in files that import them).
 *
 *   node move-to-app-group.js          Dry run: shows the plan, changes nothing.
 *   node move-to-app-group.js --apply  Does it.
 *
 * By default these stay where they are (outside the app shell):
 *   _layout, index, login, register, forgot-password, reset-password,
 *   and anything starting with "+" (+html, +not-found).
 * To change that list:  --keep=_layout,index,login,register,my-other-screen
 *
 * Run it from the project root (the folder that contains "src").
 * Commit or back up first if you use git.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcDir = path.join(root, 'src');
const appDir = path.join(srcDir, 'app');
const groupName = '(app)';
const groupDir = path.join(appDir, groupName);
const apply = process.argv.includes('--apply');
const keepArg = process.argv.find((arg) => arg.startsWith('--keep='));

const DEFAULT_KEEP = [
  '_layout',
  'index',
  'login',
  'register',
  'forgot-password',
  'reset-password',
];

if (!fs.existsSync(appDir)) {
  console.error('Cannot find src/app. Run this from the project root.');
  process.exit(1);
}

const keep = new Set(
  (keepArg ? keepArg.slice('--keep='.length).split(',') : DEFAULT_KEEP)
    .map((name) => name.trim())
    .filter(Boolean),
);
keep.add(groupName);

const baseName = (entry) => entry.replace(/\.(tsx|ts|jsx|js)$/, '');

const moved = fs
  .readdirSync(appDir)
  .filter((entry) => !entry.startsWith('.'))
  .filter((entry) => !entry.startsWith('+'))
  .filter((entry) => !keep.has(baseName(entry)));

for (const entry of moved) {
  if (fs.existsSync(path.join(groupDir, entry))) {
    console.error(`"${entry}" already exists inside ${groupName}. Stopping.`);
    process.exit(1);
  }
}

// Old location (without extension) -> new location, for every moved entry.
const movedBases = moved.map((entry) => ({
  from: path.join(appDir, baseName(entry)),
  to: path.join(groupDir, baseName(entry)),
}));

function mapTarget(absolutePath) {
  for (const item of movedBases) {
    if (absolutePath === item.from || absolutePath.startsWith(item.from + path.sep)) {
      return item.to + absolutePath.slice(item.from.length);
    }
  }
  return absolutePath;
}

function newLocation(file) {
  for (const entry of moved) {
    const entryPath = path.join(appDir, entry);
    if (file === entryPath || file.startsWith(entryPath + path.sep)) {
      return path.join(groupDir, file.slice(appDir.length + 1));
    }
  }
  return file;
}

const codeFile = /\.(tsx|ts|jsx|js)$/;
function walk(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name.startsWith('.')) {
      continue;
    }
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(full, out);
    } else if (codeFile.test(item.name)) {
      out.push(full);
    }
  }
  return out;
}

// from '...'  import '...'  import('...')  require('...')   (relative only)
const SPECIFIER =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])(\.{1,2}(?:\/[^'"\n]*)?)\2/g;

function rewrite(file, text) {
  const oldDir = path.dirname(file);
  const newDir = path.dirname(newLocation(file));
  let changes = 0;
  const output = text.replace(SPECIFIER, (match, lead, quote, spec) => {
    const target = mapTarget(path.resolve(oldDir, spec));
    let relative = path.relative(newDir, target).split(path.sep).join('/');
    if (relative === '') {
      relative = '.';
    } else if (!relative.startsWith('.')) {
      relative = `./${relative}`;
    }
    if (path.posix.normalize(relative) === path.posix.normalize(spec)) {
      return match;
    }
    changes += 1;
    return `${lead}${quote}${relative}${quote}`;
  });
  return { output, changes };
}

const files = walk(srcDir);
const writes = [];
let totalChanges = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const { output, changes } = rewrite(file, text);
  const destination = newLocation(file);
  if (changes > 0 || destination !== file) {
    writes.push({ destination, output, changes, from: file });
    totalChanges += changes;
  }
}

console.log(`\nWill MOVE into src/app/${groupName}/ :`);
for (const entry of moved) {
  console.log(`  ${entry}`);
}
console.log(`\nStays in src/app/ : ${[...keep].filter((k) => k !== groupName).join(', ')} (and +files)`);
console.log(`\nImports to fix: ${totalChanges} in ${writes.filter((w) => w.changes > 0).length} files`);

if (!apply) {
  console.log('\nDry run only. Nothing was changed.');
  console.log('If the lists above look right, run:  node move-to-app-group.js --apply\n');
  process.exit(0);
}

fs.mkdirSync(groupDir, { recursive: true });
for (const entry of moved) {
  fs.renameSync(path.join(appDir, entry), path.join(groupDir, entry));
}
for (const item of writes) {
  fs.mkdirSync(path.dirname(item.destination), { recursive: true });
  fs.writeFileSync(item.destination, item.output, 'utf8');
}

console.log('\nDone. Now restart Metro with a clean cache:  npx expo start -c\n');