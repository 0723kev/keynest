import { invoke } from "@tauri-apps/api/core";
import type { VaultData } from "@/lib/types";

export async function loadVault(): Promise<VaultData | null> {
  const res = await invoke<VaultData | null>("load_vault");
  return res ?? null;
}

export async function saveVault(vault: VaultData): Promise<void> {
  await invoke("save_vault", { vault });
}
