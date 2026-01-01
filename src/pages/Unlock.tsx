import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  TextField,
} from "@heroui/react";

export default function Unlock({
  appName,
  onBack,
  onUnlock,
}: {
  appName: string;
  onBack: () => void;
  onUnlock: (masterPassword: string) => void;
}) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const canUnlock = pw.length > 0 && !isPending;

  async function handleUnlock() {
    if (!pw) return;
    setError(null);
    setIsPending(true);

    try {
      // TODO: actually verify with Rust
      onUnlock(pw);
    } catch {
      setError("Incorrect master password");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-xl">
        <Card.Header>
          <Card.Title className="text-2xl">Unlock vault</Card.Title>
          <Card.Description>{appName}</Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <TextField isInvalid={Boolean(error)} isRequired>
            <Label>Master password</Label>
            <Input
              ref={ref}
              type="password"
              placeholder="Enter your master password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canUnlock) void handleUnlock();
              }}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </TextField>

          <div className="flex gap-3">
            <Button variant="tertiary" onPress={onBack} isDisabled={isPending}>
              Back
            </Button>
            <Button
              onPress={handleUnlock}
              isDisabled={!canUnlock}
              isPending={isPending}
            >
              Unlock
            </Button>
          </div>

          <p className="text-xs text-muted">
            Forgetting the master password means this vault CANNOT and WILL NOT
            be recovered. Say HASTA-LA-BYE-BYE to your data!!!!!!!!
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
