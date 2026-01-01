import { useMemo, useState } from "react";
import { Button, Card, Label, SearchField } from "@heroui/react";
import type { VaultData, VaultEntry } from "@/lib/types";
import { EntryModal } from "@/components/EntryModal";

export default function Vault({
  appName,
  vault,
  onLock,
  onChange,
}: {
  appName: string;
  vault: VaultData;
  onLock: () => void;
  onChange: (next: VaultData) => void;
}) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    vault.entries[0]?.id ?? null
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return vault.entries;
    return vault.entries.filter((e) => {
      const notes = (e.notes ?? "").toLowerCase();
      return (
        e.title.toLowerCase().includes(s) ||
        e.username.toLowerCase().includes(s) ||
        notes.includes(s)
      );
    });
  }, [q, vault.entries]);

  const selected = useMemo(
    () => vault.entries.find((e) => e.id === selectedId) ?? null,
    [vault.entries, selectedId]
  );

  const editingEntry = useMemo(() => {
    if (!editingId) return null;
    return vault.entries.find((e) => e.id === editingId) ?? null;
  }, [editingId, vault.entries]);

  function upsertEntry(nextEntry: VaultEntry) {
    const nextEntries = vault.entries.some((e) => e.id === nextEntry.id)
      ? vault.entries.map((e) => (e.id === nextEntry.id ? nextEntry : e))
      : [nextEntry, ...vault.entries];

    onChange({ ...vault, entries: nextEntries });
    setSelectedId(nextEntry.id);
  }

  function deleteEntry(id: string) {
    const nextEntries = vault.entries.filter((e) => e.id !== id);
    onChange({ ...vault, entries: nextEntries });

    if (selectedId === id) {
      setSelectedId(nextEntries[0]?.id ?? null);
    }
  }

  function addEntry() {
    const now = Date.now();
    const next: VaultEntry = {
      id: crypto.randomUUID(),
      title: "New entry",
      username: "",
      password: "",
      notes: "",
      updatedAt: now,
    };

    // Create it immediately so it’s selectable, then open editor.
    upsertEntry(next);
    setEditingId(next.id);
    setIsModalOpen(true);
  }

  function openEditor(id: string) {
    setEditingId(id);
    setIsModalOpen(true);
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{appName}</h1>
            <p className="text-sm text-muted">{vault.entries.length} entries</p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onPress={addEntry}>
              Add
            </Button>
            <Button variant="danger" onPress={onLock}>
              Lock
            </Button>
          </div>
        </header>

        <Card>
          <Card.Content className="flex flex-col gap-4">
            <SearchField value={q} onChange={setQ} fullWidth>
              <Label>Search</Label>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Title, username, notes…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <div className="grid gap-4 md:grid-cols-2">
              {/* List */}
              <div className="grid gap-2">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-border p-4 text-sm text-muted">
                    No matches.
                  </div>
                ) : (
                  filtered.map((e) => (
                    <EntryRow
                      key={e.id}
                      entry={e}
                      selected={e.id === selectedId}
                      onPress={() => setSelectedId(e.id)}
                      onEdit={() => openEditor(e.id)}
                    />
                  ))
                )}
              </div>

              {/* Detail */}
              <div>
                {selected ? (
                  <Card className="border border-border">
                    <Card.Header>
                      <Card.Title className="text-lg">
                        {selected.title}
                      </Card.Title>
                      <Card.Description>
                        {selected.username || "—"}
                      </Card.Description>
                    </Card.Header>

                    <Card.Content className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onPress={() => openEditor(selected.id)}
                          variant="secondary"
                        >
                          Edit
                        </Button>
                        <Button
                          onPress={() => {
                            void navigator.clipboard.writeText(
                              selected.password
                            );
                          }}
                        >
                          Copy password
                        </Button>
                        <Button
                          variant="tertiary"
                          onPress={() => {
                            void navigator.clipboard.writeText(
                              selected.username
                            );
                          }}
                        >
                          Copy username
                        </Button>
                      </div>

                      {selected.notes ? (
                        <div className="rounded-xl border border-border p-3">
                          <div className="text-xs text-muted">Notes</div>
                          <div className="whitespace-pre-wrap text-sm">
                            {selected.notes}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted">No notes.</div>
                      )}
                    </Card.Content>
                  </Card>
                ) : (
                  <div className="rounded-xl border border-border p-6 text-sm text-muted">
                    Select an entry.
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>

        <EntryModal
          isOpen={isModalOpen}
          entry={editingEntry}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setEditingId(null);
          }}
          onSave={(next) => upsertEntry(next)}
          onDelete={(id) => deleteEntry(id)}
        />
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  selected,
  onPress,
  onEdit,
}: {
  entry: VaultEntry;
  selected: boolean;
  onPress: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={[
        "rounded-xl border transition",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-foreground/5",
      ].join(" ")}
    >
      <button onClick={onPress} className="w-full text-left px-4 py-3">
        <div className="font-medium truncate">{entry.title}</div>
        <div className="text-sm text-muted truncate">
          {entry.username || "—"}
        </div>
      </button>

      <div className="flex justify-end gap-2 px-3 pb-3">
        <Button size="sm" variant="secondary" onPress={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}
