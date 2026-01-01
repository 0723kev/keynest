export type PasswordOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
};

const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?",
} as const;

function randInt(maxExclusive: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % maxExclusive;
}

function pickChar(from: string) {
  return from[randInt(from.length)];
}

function shuffleInPlace(arr: string[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function enabledSets(opts: PasswordOptions): string[] {
  const sets: string[] = [];
  if (opts.lower) sets.push(CHARSETS.lower);
  if (opts.upper) sets.push(CHARSETS.upper);
  if (opts.numbers) sets.push(CHARSETS.numbers);
  if (opts.symbols) sets.push(CHARSETS.symbols);
  return sets;
}

export function generatePassword(opts: PasswordOptions) {
  const sets = enabledSets(opts);
  if (sets.length === 0) throw new Error("No character sets enabled");

  const length = Math.max(opts.length, sets.length);
  const pool = sets.join("");

  const chars: string[] = [];

  for (const set of sets) chars.push(pickChar(set));

  while (chars.length < length) chars.push(pickChar(pool));

  shuffleInPlace(chars);

  return chars.join("");
}
