import fs from "node:fs";
import path from "node:path";

const [, , output, ...inputs] = process.argv;
if (!output || inputs.length === 0) {
  throw new Error("Uso: node scripts/make-ico.mjs <output.ico> <16.png> <32.png> …");
}

const images = inputs.map((input) => {
  const data = fs.readFileSync(input);
  const basename = path.basename(input);
  const size = Number(basename.match(/(\d+)(?=\.png$)/)?.[1]);
  if (!size || size > 256) throw new Error(`Dimensione ICO non valida: ${basename}`);
  return { data, size };
});

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

let offset = 6 + images.length * 16;
const entries = images.map(({ data, size }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

fs.writeFileSync(output, Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]));
