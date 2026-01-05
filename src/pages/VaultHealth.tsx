import { analyseVault, type PasswordIssue } from "@/lib/health";
import type { VaultData } from "@/lib/types";
import { Card, Button, Chip, type ChipRootProps } from "@heroui/react";
import {
  ChevronRight,
  ShieldAlert,
  RefreshCcw,
  History,
  ShieldOff,
  CheckCircle2,
} from "lucide-react";
import { useMemo } from "react";

export default function VaultHealth({
  vault,
  onBack,
  onOpenEntry,
}: {
  vault: VaultData;
  onBack: () => void;
  onOpenEntry: (entryId: string) => void;
}) {
  const report = analyseVault(vault.entries);

  const groupedIssues = useMemo(() => {
    const map = new Map<string, PasswordIssue[]>();
    report.issues.forEach((issue) => {
      if (!map.has(issue.entryId)) map.set(issue.entryId, []);
      map.get(issue.entryId)!.push(issue);
    });
    return map;
  }, [report]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Health Report</h1>
            <p className="text-zinc-500">
              Overview of your password hygiene and vulnerabilities.
            </p>
          </div>
          <Button variant="secondary" onPress={onBack}>
            Back to Vault
          </Button>
        </header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Weak Passwords"
            value={report.summary.weak}
            icon={ShieldAlert}
            color="text-danger"
          />
          <StatCard
            label="Reused"
            value={report.summary.reused}
            icon={RefreshCcw}
            color="text-warning"
          />
          <StatCard
            label="Old Passwords"
            value={report.summary.old}
            icon={History}
            color="text-zinc-600"
          />
          <StatCard
            label="Missing 2FA"
            value={report.summary.no2fa}
            icon={ShieldOff}
            color="text-blue-600"
          />
        </div>

        <Card className="border-none shadow-sm">
          <div className="p-4 pb-0">
            <h2 className="font-semibold text-lg">Action Required</h2>
          </div>

          <div className="divide-y divide-accent-foreground/10">
            {groupedIssues.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-24 w-24 text-success mb-4" />
                <h3 className="text-lg font-medium">All clear!</h3>
                <p className="text-zinc-500">
                  Your vault is healthy and secure.
                </p>
              </div>
            ) : (
              Array.from(groupedIssues.entries()).map(([entryId, issues]) => {
                const vaultEntry = vault.entries.find((e) => e.id === entryId);
                if (!vaultEntry) return null;

                return (
                  <div
                    key={entryId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <p className="font-semibold">{vaultEntry.title}</p>
                        <p className="text-sm text-zinc-400 font-mono">
                          {vaultEntry.username}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {issues.map((issue, index) => (
                          <IssueLabel
                            key={`${issue.type}-${index}`}
                            type={issue.type}
                            detail={issue.detail}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => onOpenEntry(entryId)}
                      >
                        Fix Issue
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card className="relative h-full overflow-hidden border-none shadow-sm">
      <div className="relative z-10 p-5">
        <p className="truncate text-sm font-medium text-zinc-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        <Icon
          className={`absolute -bottom-6 -right-6 h-32 w-32 opacity-[0.35] ${color}`}
          strokeWidth={1.5}
        />
      </div>
    </Card>
  );
}

function IssueLabel({ type, detail }: { type: string; detail?: string }) {
  const map: Record<string, { color: ChipRootProps["color"]; text: string }> = {
    weak: { color: "danger", text: "Weak" },
    reused: { color: "warning", text: "Reused" },
    old: { color: "default", text: "Old" },
    "no-2fa": { color: "default", text: "No 2FA" },
  };

  const config = map[type] || { color: "default", text: type };

  return (
    <Chip color={config.color} className="flex items-center gap-1">
      <span className="font-semibold">{config.text}</span>
      {detail && (
        <>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="opacity-80 font-light text-xs">{detail}</span>
        </>
      )}
    </Chip>
  );
}
