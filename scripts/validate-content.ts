// npm run validate:content — validasi semua file content/lessons/*.json.
// Kode keluar 1 jika ada error; warning dicetak tetapi tidak menggagalkan.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Lesson } from "../src/lib/content/schema.ts";
import { validateLesson, type Issue } from "../src/lib/content/validate.ts";

const dir = process.argv[2] ?? "content/lessons";
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
let errors = 0;
let warnings = 0;

for (const f of files) {
  const file = join(dir, f);
  const parsed = Lesson.safeParse(JSON.parse(readFileSync(file, "utf8")));
  let issues: Issue[];
  if (!parsed.success) {
    issues = parsed.error.issues.map((i) => ({ level: "error", code: "schema", path: i.path.join("."), message: i.message }));
  } else {
    issues = validateLesson(parsed.data);
  }
  for (const i of issues) {
    console.log(`${i.level === "error" ? "ERROR" : "warn "} ${file} [${i.code}] ${i.path}: ${i.message}`);
    if (i.level === "error") errors++;
    else warnings++;
  }
}

console.log(`\n${files.length} file, ${errors} error, ${warnings} warning`);
process.exit(errors ? 1 : 0);
