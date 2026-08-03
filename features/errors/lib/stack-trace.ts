export interface StackFrame {
  id: string;
  raw: string;
  functionName: string | null;
  file: string | null;
  line: number | null;
  column: number | null;
  isAppCode: boolean;
  isFramework: boolean;
}

const FRAMEWORK_PATTERNS = [
  /node_modules/i,
  /webpack/i,
  /next[\\/]dist/i,
  /react-dom/i,
  /react[\\/]/i,
  /zone\.js/i,
  /@angular/i,
  /@vue/i,
  /vite[\\/]deps/i,
  /polyfill/i,
  /<anonymous>/i,
  /internal\//i,
];

const FRAME_RE =
  /^\s*at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|(.+?))\)?$/;

function isFrameworkPath(file: string | null): boolean {
  if (!file) return false;
  return FRAMEWORK_PATTERNS.some((re) => re.test(file));
}

function isAppPath(file: string | null): boolean {
  if (!file) return false;
  if (isFrameworkPath(file)) return false;
  if (file.startsWith("http") || file.startsWith("webpack") || file.startsWith("file:")) {
    return !isFrameworkPath(file);
  }
  return (
    file.includes("/src/") ||
    file.includes("/app/") ||
    file.includes("/pages/") ||
    file.includes("/components/") ||
    file.includes("\\src\\") ||
    file.includes("\\app\\") ||
    !file.includes("node_modules")
  );
}

/** Parse a raw JS/TS stack string into structured frames. */
export function parseStackTrace(stack: string | null | undefined): StackFrame[] {
  if (!stack?.trim()) return [];

  const lines = stack.split(/\r?\n/);
  const frames: StackFrame[] = [];
  let index = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(Error|TypeError|ReferenceError|SyntaxError|RangeError)\b/.test(trimmed)) {
      continue;
    }

    const match = trimmed.match(FRAME_RE);
    if (!match) {
      if (trimmed.startsWith("at ") || trimmed.includes("@")) {
        const fileGuess = trimmed.replace(/^at\s+/, "");
        frames.push({
          id: `frame-${index++}`,
          raw: trimmed,
          functionName: null,
          file: fileGuess,
          line: null,
          column: null,
          isAppCode: isAppPath(fileGuess),
          isFramework: isFrameworkPath(fileGuess),
        });
      }
      continue;
    }

    const functionName = match[1] ?? null;
    const file = match[2] ?? match[5] ?? null;
    const lineNum = match[3] ? Number(match[3]) : null;
    const column = match[4] ? Number(match[4]) : null;
    const framework = isFrameworkPath(file);

    frames.push({
      id: `frame-${index++}`,
      raw: trimmed,
      functionName,
      file,
      line: Number.isFinite(lineNum) ? lineNum : null,
      column: Number.isFinite(column) ? column : null,
      isAppCode: !framework && isAppPath(file),
      isFramework: framework,
    });
  }

  return frames;
}
