import { writeFile } from 'node:fs/promises';

const apiKey = process.env.CARTODB_API_KEY ?? '';
const styleUrl = process.env.CARTODB_STYLE_URL ?? '';

await writeFile(
  'env.js',
  `window.CARTODB_CONFIG = ${JSON.stringify({ apiKey, styleUrl })};\n`,
  'utf8',
);
