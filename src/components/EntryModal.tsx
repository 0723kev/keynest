import { useEffect, useMemo, useState } from "react";
import { ChevronUp, Eye, EyeOff, RotateCcwKey } from "lucide-react";
import {
  Button,
  ButtonGroup,
  Input,
  Label,
  Modal,
  ScrollShadow,
  TextArea,
  TextField,
} from "@heroui/react";
import type { VaultEntry } from "@/lib/types";
import PasswordGenerator from "./PasswordGenerator";

export function EntryModal({
  isOpen,
  entry,
  onOpenChange,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  entry: VaultEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (next: VaultEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");

  useEffect(() => {
    if (!isOpen || !entry) return;
    setTotpSecret(entry.totpSecret ?? "");
  }, [isOpen, entry]);

  const isNewish = useMemo(() => {
    if (!entry) return false;
    return (
      entry.title === "New entry" &&
      !entry.username &&
      !entry.password &&
      !entry.notes
    );
  }, [entry]);

  useEffect(() => {
    if (!isOpen || !entry) return;
    setTitle(entry.title ?? "");
    setUsername(entry.username ?? "");
    setPassword(entry.password ?? "");
    setNotes(entry.notes ?? "");
  }, [isOpen, entry]);

  const canSave = title.trim().length > 0;

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
      >
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            {({ close }: { close: () => void }) => (
              <>
                <Modal.CloseTrigger />

                <Modal.Header className="pb-2">
                  <Modal.Heading>
                    {isNewish ? "Create entry" : "Edit entry"}
                  </Modal.Heading>
                </Modal.Header>

                <ScrollShadow hideScrollBar>
                  <Modal.Body className="flex flex-col gap-4 p-1">
                    <TextField isRequired>
                      <Label>Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. GitHub"
                        autoFocus
                      />
                    </TextField>
                    <TextField>
                      <Label>Username</Label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. kevin@domain.com"
                      />
                    </TextField>
                    <TextField className="w-full">
                      <Label>Password</Label>
                      <ButtonGroup className="w-full">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="font-mono rounded-tr-none rounded-br-none flex-1"
                        />
                        <Button
                          isIconOnly
                          variant="tertiary"
                          onPress={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
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
                          variant="primary"
                          onPress={() => {
                            setExpanded(!expanded);
                          }}
                          aria-label={
                            expanded ? "Hide generator" : "Show generator"
                          }
                        >
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <RotateCcwKey className="w-4 h-4" />
                          )}
                        </Button>
                      </ButtonGroup>
                      <PasswordGenerator
                        setPassword={(pw) => {
                          setPassword(pw);
                        }}
                        expanded={expanded}
                        setExpanded={setExpanded}
                      />
                    </TextField>
                    <TextField>
                      <Label>2FA secret (Base32)</Label>
                      <Input
                        value={totpSecret}
                        onChange={(e) => setTotpSecret(e.target.value)}
                        placeholder="e.g. JBSWY3DPEHPK3PXP"
                      />
                    </TextField>

                    <TextField>
                      <Label>Notes</Label>
                      <TextArea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes…"
                        rows={5}
                      />
                    </TextField>
                  </Modal.Body>
                </ScrollShadow>

                <Modal.Footer className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Button variant="secondary" slot="close">
                      Cancel
                    </Button>

                    {entry ? (
                      <Button
                        variant="danger"
                        onPress={() => {
                          onDelete(entry.id);
                          close();
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>

                  <Button
                    isDisabled={!entry || !canSave}
                    onPress={() => {
                      if (!entry) return;
                      const now = Date.now();
                      onSave({
                        ...entry,
                        title: title.trim(),
                        username,
                        password,
                        notes,
                        totpSecret: totpSecret.trim()
                          ? totpSecret.trim()
                          : undefined,
                        updatedAt: now,
                      });
                      close();
                    }}
                  >
                    Save
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
