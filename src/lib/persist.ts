import { invoke } from "@tauri-apps/api/core";
import type { VaultData } from "@/lib/types";

export async function vaultExists(): Promise<boolean> {
  return invoke<boolean>("vault_exists");
}

export async function initVault(masterPassword: string): Promise<void> {
  await invoke("init_vault", { masterPassword });
}

export async function unlockVault(masterPassword: string): Promise<VaultData> {
  return invoke<VaultData>("unlock_vault", { masterPassword });
}

export async function lockVault(): Promise<void> {
  await invoke("lock_vault");
}

export async function saveVault(vault: VaultData): Promise<void> {
  await invoke("save_vault", { vault });
}

export async function loadVault(): Promise<VaultData | null> {
  const res = await invoke<VaultData | null>("load_vault");
  return res ?? null;
}
