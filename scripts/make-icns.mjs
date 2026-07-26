import fs from "node:fs";

const [, , output, ...entries] = process.argv;
if (!output || entries.length === 0) {
  throw new Error("Uso: node scripts/make-icns.mjs <output.icns> <tipo=png> …");
}

const chunks = entries.map((entry) => {
  const [type, input] = entry.split("=", 2);
  if (!/^[A-Za-z0-9]{4}$/.test(type) || !input) {
    throw new Error(`Voce ICNS non valida: ${entry}`);
  }
  const data = fs.readFileSync(input);
  const chunk = Buffer.alloc(8 + data.length);
  chunk.write(type, 0, 4, "ascii");
  chunk.writeUInt32BE(chunk.length, 4);
  data.copy(chunk, 8);
  return chunk;
});

const header = Buffer.alloc(8);
header.write("icns", 0, 4, "ascii");
header.writeUInt32BE(8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0), 4);
fs.writeFileSync(output, Buffer.concat([header, ...chunks]));
