import { useEffect, useMemo, useState } from "react";
import {
  Lock,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Type,
  ClipboardCopy,
} from "lucide-react";
import {
  Button,
  Card,
  Label,
  Modal,
  SearchField,
  Separator,
  ScrollShadow,
  Input,
  ButtonGroup,
  TextArea,
  TagGroup,
  Tag,
  type Key,
} from "@heroui/react";

import type { VaultData, VaultEntry } from "@/lib/types";
import { EntryModal } from "@/components/EntryModal";
import { useSecureClipboard } from "@/utils/copy";
import TotpCard from "@/components/TotpCard.tsx";

// TODO: define interface in diff file
interface VaultProps {
  appName: string;
  vault: VaultData;
  saveState?: "idle" | "saving" | "saved" | "error";
  onLock: () => void;
  onChange: (next: VaultData) => void;
}

export default function Vault({
  appName,
  vault,
  saveState = "idle",
  onLock,
  onChange,
}: VaultProps) {
  const [queue, setQueue] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    vault.entries[0]?.id ?? null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLargeTypeOpen, setIsLargeTypeOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Iterable<Key>>(new Set());

  const { toast, copyWithAutoClear } = useSecureClipboard();

  useEffect(() => {
    setShowPassword(false);
    setIsLargeTypeOpen(false);
  }, [selectedId]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    vault.entries.forEach((entry) =>
      entry.tags?.forEach((tag) => set.add(tag))
    );
    return [...set].sort();
  }, [vault.entries]);

  const selectedTagSet: Set<string> = useMemo(() => {
    return new Set(Array.from(selectedTags) as string[]);
  }, [selectedTags]);

  const filtered = useMemo(() => {
    const query = queue.trim().toLowerCase();
    const hasQuery = query.length > 0;

    const hasTagFilter = selectedTagSet.size > 0;

    const tagMode: "any" | "all" = "any";

    return vault.entries.filter((entry) => {
      const notes = (entry.notes ?? "").toLowerCase();
      const title = entry.title.toLowerCase();
      const username = entry.username.toLowerCase();

      const tags = (entry.tags ?? []).map((tag) => tag.toLowerCase());
      const searchHit =
        !hasQuery ||
        title.includes(query) ||
        username.includes(query) ||
        notes.includes(query);
      tags.some((tag) => tag.includes(query));

      if (!searchHit) return false;
      if (!hasTagFilter) return true;

      if (tagMode === "any")
        return Array.from(selectedTagSet).some((tag) => tags.includes(tag));

      return Array.from(selectedTagSet).every((tag) => tags.includes(tag));
    });
  }, [queue, vault.entries, selectedTagSet]);

  const selectedEntry = useMemo(
    () => vault.entries.find((entry) => entry.id === selectedId) ?? null,
    [vault.entries, selectedId]
  );

  const editingEntry = useMemo(
    () =>
      editingId
        ? vault.entries.find((entry) => entry.id === editingId) ?? null
        : null,
    [editingId, vault.entries]
  );

  function upsertEntry(nextEntry: VaultEntry) {
    const exists = vault.entries.some((entry) => entry.id === nextEntry.id);
    const nextEntries = exists
      ? vault.entries.map((entry) =>
          entry.id === nextEntry.id ? nextEntry : entry
        )
      : [nextEntry, ...vault.entries];

    onChange({ ...vault, entries: nextEntries });
    setSelectedId(nextEntry.id);
  }

  function deleteEntry(id: string) {
    const nextEntries = vault.entries.filter((entry) => entry.id !== id);
    onChange({ ...vault, entries: nextEntries });

    if (selectedId === id) {
      setSelectedId(nextEntries[0]?.id ?? null);
    }
  }

  function handleAdd() {
    const next: VaultEntry = {
      id: crypto.randomUUID(),
      title: "New entry",
      username: "",
      password: "",
      notes: "",
      updatedAt: Date.now(),
    };
    upsertEntry(next);
    setEditingId(next.id);
    setIsModalOpen(true);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setIsModalOpen(true);
  }

  const renderSaveStatus = () => {
    switch (saveState) {
      case "saving":
        return "Saving…";
      case "saved":
        return "Saved";
      case "error":
        return "Save failed";
      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {appName}
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {vault.entries.length} entries
                </p>
                <p className="text-xs text-muted-foreground">
                  {renderSaveStatus()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onPress={handleAdd}>
                <Plus />
                Add
              </Button>
              <Button variant="danger" onPress={onLock}>
                <Lock /> Lock
              </Button>
            </div>
          </header>

          <Card className="min-h-125">
            <Card.Content className="h-full p-4 flex flex-col">
              <SearchField
                value={queue}
                onChange={setQueue}
                aria-label="Search vault"
                className="mb-4"
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Title, username, notes…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
                <TagGroup
                  selectedKeys={selectedTags}
                  selectionMode="multiple"
                  onSelectionChange={setSelectedTags}
                >
                  <TagGroup.List>
                    {allTags.map((tag) => (
                      <Tag key={tag} id={tag}>
                        {tag}
                      </Tag>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              </SearchField>

              <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] h-96">
                <ScrollShadow
                  hideScrollBar
                  className="h-full overflow-y-auto flex flex-col gap-2"
                >
                  {filtered.length === 0 ? (
                    <div className="h-full rounded-xl border border-dashed p-8 grid place-items-center text-center text-sm text-muted-foreground">
                      No matches found.
                    </div>
                  ) : (
                    filtered.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        isSelected={entry.id === selectedId}
                        onSelect={() => setSelectedId(entry.id)}
                        onEdit={() => handleEdit(entry.id)}
                      />
                    ))
                  )}
                </ScrollShadow>

                <Separator
                  orientation="vertical"
                  className="hidden md:block h-full min-h-100"
                />

                <div className="min-h-0 flex flex-col h-full">
                  <ScrollShadow className="h-full overflow-y-auto flex flex-col gap-2">
                    {selectedEntry ? (
                      <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <h2 className="text-xl font-semibold truncate">
                              {selectedEntry.title}
                            </h2>
                            {selectedEntry.tags &&
                            selectedEntry.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                <TagGroup>
                                  <TagGroup.List>
                                    {selectedEntry.tags.map((tag) => (
                                      <Tag
                                        key={tag}
                                        id={tag}
                                        className="hover:cursor-default"
                                      >
                                        {tag}
                                      </Tag>
                                    ))}
                                  </TagGroup.List>
                                </TagGroup>
                              </div>
                            ) : null}
                          </div>
                          <Button
                            isIconOnly
                            onPress={() => handleEdit(selectedEntry.id)}
                            variant="secondary"
                            size="sm"
                          >
                            <Pencil />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Username
                            </Label>
                            <ButtonGroup className="flex items-center">
                              <Input
                                value={selectedEntry.username || "—"}
                                className="focus:outline-none focus:ring-0 flex-1 rounded-r-none truncate text-sm font-mono"
                              />
                              <Button
                                isIconOnly
                                variant="secondary"
                                onPress={() =>
                                  copyWithAutoClear(
                                    selectedEntry.username,
                                    "username"
                                  )
                                }
                                isDisabled={!selectedEntry.username}
                                className="shrink-0"
                              >
                                <ClipboardCopy />
                              </Button>
                            </ButtonGroup>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Password
                            </Label>
                            <div className="font-mono min-w-0 text-sm">
                              <ButtonGroup className="flex items-center w-full">
                                <Input
                                  value={
                                    showPassword
                                      ? selectedEntry.password
                                      : "••••••••"
                                  }
                                  className="focus:outline-none focus:ring-0 flex-1 rounded-r-none truncate text-sm font-mono"
                                />
                                <Button
                                  isIconOnly
                                  variant="tertiary"
                                  onPress={() => setShowPassword(!showPassword)}
                                  aria-label={
                                    showPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  isIconOnly
                                  variant="tertiary"
                                  onPress={() => setIsLargeTypeOpen(true)}
                                  aria-label="Show in large type"
                                >
                                  <Type className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  onPress={() =>
                                    copyWithAutoClear(
                                      selectedEntry.password,
                                      "password"
                                    )
                                  }
                                  className="shrink-0"
                                >
                                  <ClipboardCopy />
                                </Button>
                              </ButtonGroup>
                            </div>
                          </div>
                        </div>
                        {selectedEntry?.totpSecret ? (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              2FA code
                            </Label>
                            <TotpCard
                              secret={selectedEntry.totpSecret}
                              issuer={selectedEntry.totpIssuer}
                              account={selectedEntry.totpAccount}
                              onCopy={copyWithAutoClear}
                            />
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Notes
                          </Label>
                          {selectedEntry.notes ? (
                            <TextArea
                              fullWidth
                              rows={5}
                              isOnSurface
                              value={selectedEntry.notes}
                              className="focus:ring-0 flex text-sm font-mono text-foreground/90 "
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No notes.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                        Select an entry to view details.
                      </div>
                    )}
                  </ScrollShadow>
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
            onSave={upsertEntry}
            onDelete={deleteEntry}
          />

          {selectedEntry && (
            <LargeTypeModal
              isOpen={isLargeTypeOpen}
              onOpenChange={setIsLargeTypeOpen}
              password={selectedEntry.password}
            />
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-zinc-900 text-white px-6 py-2.5 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </>
  );
}

function LargeTypeModal({
  isOpen,
  onOpenChange,
  password,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
}) {
  const getstyle = (char: string) => {
    if (/[A-Z]/.test(char)) return "text-[#8B4513]";
    if (/[a-z]/.test(char)) return "text-white";
    if (/[0-9]/.test(char)) return "text-orange-500";
    return "text-blue-500";
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
      >
        <Modal.Container size="full" placement="center">
          <Modal.Dialog className="bg-zinc-950 border-none shadow-none h-full w-full">
            {({}: { close: () => void }) => (
              <>
                <Modal.CloseTrigger className="z-50 top-6 right-6" />
                <Modal.Body className="flex h-full w-full items-center justify-center p-8 overflow-y-auto">
                  {password ? (
                    <div className="flex flex-wrap justify-center gap-3 max-w-7xl mx-auto">
                      {password.split("").map((char, i) => {
                        return (
                          <div
                            key={i}
                            className={`relative flex h-32 w-24 items-center justify-center rounded-lg border border-zinc-700/50 ${
                              i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-800"
                            } shadow-xl`}
                          >
                            <span className="absolute top-2 left-2 font-mono text-xs text-zinc-500 leading-none select-none">
                              {i + 1}
                            </span>
                            <span
                              className={`font-mono text-6xl font-bold ${getstyle(
                                char
                              )}`}
                            >
                              {char}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-xl font-mono">
                      No password set
                    </div>
                  )}
                </Modal.Body>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function EntryRow({
  entry,
  isSelected,
  onSelect,
  onEdit,
}: {
  entry: VaultEntry;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={`group relative flex items-center justify-between rounded-lg border px-4 py-3 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-500/10 shadow-md"
          : "border-transparent hover:border-border hover:bg-accent/10"
      }`}
    >
      <button
        onClick={onSelect}
        className="absolute inset-0 z-0 w-full h-full text-left focus:outline-none rounded-lg"
        aria-label={`Select ${entry.title}`}
      />

      <div className="z-10 min-w-0 pointer-events-none space-y-0.5">
        <div
          className={`text-sm font-medium truncate ${
            isSelected ? "text-primary font-semibold" : "text-foreground"
          }`}
        >
          {entry.title}
        </div>
        <div className="text-xs text-muted-foreground truncate font-mono">
          {entry.username || "—"}
        </div>
      </div>

      <div
        className={`z-10 transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={onEdit}
          className="h-8 px-3 text-xs font-medium"
        >
          <Pencil />
        </Button>
      </div>
    </div>
  );
}
