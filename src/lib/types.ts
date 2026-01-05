export type VaultEntry = {
  id: string;
  title: string;
  username: string;
  password: string;
  notes?: string;
  tags?: string[];

  totpSecret?: string;
  totpIssuer?: string;
  totpAccount?: string;

  history?: VaultEntryHistoryItem[];

  updatedAt: number;
};

export type VaultData = {
  version: 1;
  entries: VaultEntry[];
};

export type VaultEntryHistoryItem = {
  title: string;
  username: string;
  password: string;
  notes?: string;
  tags?: string[];
  totpSecret?: string;
  updatedAt: number;
};
