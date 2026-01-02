import { TOTP, Secret, URI } from "otpauth";

export function normaliseB32Secret(input: string) {
  return input.replace(/\s+/g, "").toUpperCase();
}

export function parseOtpAuthUri(uri: string): {
  secret: string;
  issuer?: string;
  account?: string;
} {
  const parsed = URI.parse(uri);

  if (!(parsed instanceof TOTP)) throw new Error("Not a TOTP URI");

  const secret = parsed.secret.base32;
  if (!secret) throw new Error("TOTP URI missing secret");

  return {
    secret,
    issuer: parsed.issuer ?? undefined,
    account: parsed.label ?? undefined,
  };
}

export function makeTotp(b32secret: string, issuer?: string, label?: string) {
  const secret = Secret.fromBase32(normaliseB32Secret(b32secret));

  return new TOTP({
    algorithm: "SHA1",
    period: 30,
    issuer,
    label,
    secret,
  });
}

export function genTotp(secret: string, issuer?: string, label?: string) {
  const totp = makeTotp(secret, issuer, label);
  const now = Date.now();

  const code = totp.generate({ timestamp: now });

  const epoch = Math.floor(now / 1000);
  const remaining = totp.period - (epoch % totp.period);

  return { code, remaining, period: totp.period };
}
