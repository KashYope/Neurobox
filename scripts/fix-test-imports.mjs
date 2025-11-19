import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url);
const DIST_DIR = path.resolve(ROOT.pathname, 'dist-test');
const EXTENSIONS = new Set(['.js', '.json', '.node']);

const collectFiles = async dir => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(fullPath);
      }
      if (entry.isFile() && fullPath.endsWith('.js')) {
        return [fullPath];
      }
      return [];
    })
  );
  return files.flat();
};

const appendExtension = specifier => {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return specifier;
  }
  if (EXTENSIONS.has(path.extname(specifier))) {
    return specifier;
  }
  return `${specifier}.js`;
};

const patchFile = async file => {
  let content = await readFile(file, 'utf8');
  let updated = content.replace(/(from\s+['"])(\.\.\/|\.\/)([^'"\n]+)(['"])/g, (match, start, prefix, rest, end) => {
    const spec = `${prefix}${rest}`;
    const next = appendExtension(spec);
    return `${start}${next}${end}`;
  });
  updated = updated.replace(/(import\s*\(\s*['"])(\.\.\/|\.\/)([^'"\n]+)(['"]\s*\))/g, (match, start, prefix, rest, end) => {
    const spec = `${prefix}${rest}`;
    const next = appendExtension(spec);
    return `${start}${next}${end}`;
  });
  if (updated !== content) {
    await writeFile(file, updated, 'utf8');
  }
};

const main = async () => {
  try {
    await stat(DIST_DIR);
  } catch {
    return;
  }
  const files = await collectFiles(DIST_DIR);
  await Promise.all(files.map(file => patchFile(file)));
};

await main();
