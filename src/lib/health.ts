import zxcvbn from "zxcvbn";
import type { VaultEntry } from "./types";

export type PasswordIssueType = "weak" | "reused" | "old" | "no-2fa";

export type PasswordIssue = {
  entryId: string;
  type: PasswordIssueType;
  detail?: string;
};

export type VaultHealthReport = {
  issues: PasswordIssue[];
  summary: {
    weak: number;
    reused: number;
    old: number;
    no2fa: number;
  };
};

const MAX_PASSWORD_AGE_DAYS = 180;

export function analyseVault(entries: VaultEntry[]): VaultHealthReport {
  const issues: PasswordIssue[] = [];

  for (const entry of entries) {
    const score = zxcvbn(entry.password).score;
    if (score < 3) {
      issues.push({
        entryId: entry.id,
        type: "weak",
        detail: `Strength score ${score}/4`,
      });
    }
  }

  const passwordMap = new Map<string, VaultEntry[]>();

  for (const entry of entries) {
    const key = entry.password;
    if (!passwordMap.has(key)) passwordMap.set(key, []);
    passwordMap.get(key)!.push(entry);
  }

  for (const [, group] of passwordMap) {
    if (group.length > 1) {
      for (const entry of group) {
        issues.push({
          entryId: entry.id,
          type: "reused",
          detail: `Reused ${group.length} times`,
        });
      }
    }
  }

  const now = Date.now();
  const maxAgeMs = MAX_PASSWORD_AGE_DAYS * 24 * 60 * 60 * 1000;

  for (const entry of entries) {
    if (now - entry.updatedAt > maxAgeMs) {
      issues.push({
        entryId: entry.id,
        type: "old",
        detail: `Last updated on ${new Date(
          entry.updatedAt
        ).toLocaleDateString()} (over ${MAX_PASSWORD_AGE_DAYS} days ago)`,
      });
    }
  }

  for (const entry of entries) {
    if (!entry.totpSecret) {
      issues.push({
        entryId: entry.id,
        type: "no-2fa",
      });
    }
  }

  return {
    issues,
    summary: {
      weak: issues.filter((i) => i.type === "weak").length,
      reused: issues.filter((i) => i.type === "reused").length,
      old: issues.filter((i) => i.type === "old").length,
      no2fa: issues.filter((i) => i.type === "no-2fa").length,
    },
  };
}
