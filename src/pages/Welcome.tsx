import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";

export default function Welcome({
  appName,
  onCreate,
  onOpen,
  error,
}: {
  appName: string;
  onCreate: (masterPassword: string) => void | Promise<void>;
  onOpen: () => void | Promise<void>;
  error?: string;
}) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pwRef.current?.focus();
  }, []);

  const canCreate =
    pw.trim().length >= 8 &&
    confirm.trim().length >= 8 &&
    pw === confirm &&
    !isPending;

  async function handleCreate() {
    setLocalError(null);

    if (pw.trim().length < 8) {
      setLocalError("Use at least 8 characters");
      return;
    }
    if (pw !== confirm) {
      setLocalError("Passwords don’t match");
      return;
    }

    setIsPending(true);
    try {
      await onCreate(pw);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-xl">
        <Card.Header>
          <Card.Title className="text-2xl">{appName}</Card.Title>
          <Card.Description>
            Local-only password manager. Encrypted storage. No accounts. All on
            YOUR device. NEVER to the cloud.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <TextField isRequired isInvalid={Boolean(localError || error)}>
            <Label>Master password</Label>
            <Input
              ref={pwRef}
              type="password"
              placeholder="At least 8 characters"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </TextField>

          <TextField isRequired isInvalid={Boolean(localError || error)}>
            <Label>Confirm password</Label>
            <Input
              type="password"
              placeholder="Re-enter it"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) void handleCreate();
              }}
            />

            {localError ? <FieldError>{localError}</FieldError> : null}
            {!localError && error ? <FieldError>{error}</FieldError> : null}
          </TextField>

          <div className="flex gap-3">
            <Button
              fullWidth
              size="lg"
              onPress={handleCreate}
              isDisabled={!canCreate}
              isPending={isPending}
            >
              Create new vault
            </Button>

            {/* TODO: implement this */}
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onPress={onOpen}
              isDisabled={isPending}
            >
              Open existing vault
            </Button>
          </div>

          <p className="pt-2 text-xs text-muted">
            USE FAKE CREDENTIALS. NOT real secrets!!!!!!!!!!! Well until crypto
            and ts are done at least
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
