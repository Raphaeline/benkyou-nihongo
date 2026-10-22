// Pratinjau draf materi (Markdown) sebagai HTML dengan furigana dan font manga.
// Pemakaian: npm run preview:draft -- content/drafts/L001-perkenalan-diri.md
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { marked } from "marked";

const src = process.argv[2] ?? "content/drafts/L001-perkenalan-diri.md";
const outDir = ".preview";
const out = join(outDir, basename(src).replace(/\.md$/, ".html"));

const body = marked.parse(readFileSync(src, "utf8"));
const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pratinjau — ${basename(src)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Antique&family=Dela+Gothic+One&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap">
<style>
  body { background:#f6f6f3; color:#000; font-family:Literata, Georgia, serif; font-size:18px; line-height:1.7; max-width:56rem; margin:0 auto; padding:24px 16px 64px; }
  h1, h2 { font-family:"Dela Gothic One", sans-serif; font-weight:400; }
  h2 { border-top:3px solid #000; padding-top:16px; margin-top:48px; }
  ruby, td, li, p { font-feature-settings: normal; }
  :is(p, td, li, strong, h1, h2, h3):has(ruby) { font-family:"Shippori Antique", Literata, sans-serif; line-height:2.4; }
  rt { font-size:0.5em; line-height:1; }
  body.no-furigana rt { visibility:hidden; }
  table { border-collapse:collapse; width:100%; display:block; overflow-x:auto; }
  th, td { border:1px solid #595959; padding:6px 10px; vertical-align:top; }
  th { background:#e6e6e3; text-align:left; }
  em { color:#3d3d3d; }
  blockquote { border-left:3px solid #000; margin:8px 0; padding:4px 12px; color:#3d3d3d; }
  .bar { position:sticky; top:0; background:#f6f6f3; border-bottom:1px solid #000; padding:8px 0; font-family:system-ui, sans-serif; font-size:14px; }
</style>
</head>
<body>
<div class="bar"><label><input type="checkbox" checked onchange="document.body.classList.toggle('no-furigana', !this.checked)"> Furigana</label> · Pratinjau draf, bukan tampilan akhir</div>
${body}
</body>
</html>`;
mkdirSync(outDir, { recursive: true });
writeFileSync(out, html);
console.log(out);
