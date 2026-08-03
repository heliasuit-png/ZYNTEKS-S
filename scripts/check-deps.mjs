/**
 * One-off dependency presence check for commercial packaging.
 * Usage: node scripts/check-deps.mjs
 */
import { existsSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const skipDirs = new Set(["node_modules", ".next", ".git", "dist"]);
const roots = [
  "app",
  "components",
  "features",
  "services",
  "lib",
  "hooks",
  "middleware",
  "monitoring",
  "cron",
  "ai",
  "emails",
  "sdk",
  "utils",
  "styles",
  "types",
  "supabase",
  "scripts",
];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, acc);
    else if (/\.(ts|tsx|js|mjs|css|json)$/.test(entry.name)) acc.push(path);
  }
  return acc;
}

const files = roots.flatMap((r) => walk(join(root, r)));
for (const f of [
  "middleware.ts",
  "next.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "components.json",
]) {
  const p = join(root, f);
  if (existsSync(p)) files.push(p);
}

const text = files.map((f) => readFileSync(f, "utf8")).join("\n");
const tooling = new Set([
  "typescript",
  "eslint",
  "eslint-config-next",
  "@eslint/eslintrc",
  "prettier",
  "prettier-plugin-tailwindcss",
  "tailwindcss",
  "@tailwindcss/postcss",
  "@types/node",
  "@types/react",
  "@types/react-dom",
]);

const unused = [];
for (const name of Object.keys(deps)) {
  if (tooling.has(name)) continue;
  if (!text.includes(name)) unused.push(name);
}

console.log(
  unused.length
    ? `Possibly unused: ${unused.join(", ")}`
    : "All runtime dependencies referenced in source.",
);

try {
  unlinkSync(join(root, "tsconfig.tsbuildinfo"));
  console.log("Removed tsconfig.tsbuildinfo");
} catch {
  // absent
}
