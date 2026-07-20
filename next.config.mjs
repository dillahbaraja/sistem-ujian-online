import path from 'node:path';
import fs from 'node:fs';

function loadLocalEnv() {
  const candidates = [path.join(process.cwd(), 'env.local'), path.join(process.cwd(), '.env.local')];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key]) {
        continue;
      }

      const unquoted = rawValue.replace(/^['"]|['"]$/g, '');
      process.env[key] = unquoted;
    }

    break;
  }
}

loadLocalEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd())
};

export default nextConfig;
