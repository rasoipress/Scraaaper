import fs from "node:fs";

const [, , source, ...outputs] = process.argv;
if (!source || outputs.length === 0) {
  throw new Error("Uso: node scripts/wrap-logo.mjs <logo.svg> <output.svg> …");
}

const encoded = Buffer.from(fs.readFileSync(source, "utf8")).toString("base64");
const wrapper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Scraaaper">
  <rect width="1024" height="1024" fill="#000"/>
  <image href="data:image/svg+xml;base64,${encoded}" x="0" y="0" width="1024" height="1024" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;

for (const output of outputs) fs.writeFileSync(output, wrapper);
