import { Button, Card } from "@heroui/react";

export default function Welcome({
  appName,
  onCreate,
  onOpen,
}: {
  appName: string;
  onCreate: () => void;
  onOpen: () => void;
}) {
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

        <Card.Content className="flex flex-col gap-3">
          <Button fullWidth size="lg" onPress={onCreate}>
            Create new vault
          </Button>

          <Button fullWidth size="lg" variant="secondary" onPress={onOpen}>
            Open existing vault
          </Button>

          <p className="pt-2 text-xs text-muted">
            USE FAKE CREDENTIALS. NOT real secrets!!!!!!!!!!! Well until crypto
            and ts are done at least
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
