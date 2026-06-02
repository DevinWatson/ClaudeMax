const useColor = process.env.NO_COLOR === undefined && process.stdout.isTTY === true;

function wrap(code: string, s: string): string {
  return useColor ? `[${code}m${s}[0m` : s;
}

export const c = {
  red: (s: string) => wrap("31", s),
  green: (s: string) => wrap("32", s),
  yellow: (s: string) => wrap("33", s),
  blue: (s: string) => wrap("34", s),
  magenta: (s: string) => wrap("35", s),
  cyan: (s: string) => wrap("36", s),
  gray: (s: string) => wrap("90", s),
  bold: (s: string) => wrap("1", s),
};

export function info(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

export function warn(msg: string): void {
  process.stderr.write(`${c.yellow("warn")} ${msg}\n`);
}

export function error(msg: string): void {
  process.stderr.write(`${c.red("error")} ${msg}\n`);
}

export function ok(msg: string): void {
  process.stdout.write(`${c.green("✓")} ${msg}\n`);
}
