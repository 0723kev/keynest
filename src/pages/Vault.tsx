import type { VaultData } from "../lib/types.ts";

export default function Vault(props: {
  vault: VaultData;
  onChange: (vault: VaultData) => void;
  onLock: () => void;
}) {
  return (
    <div>
      <h1>Vault</h1>
      {/* WIP */}
    </div>
  );
}