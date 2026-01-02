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

  updatedAt: number;
};

export type VaultData = {
  version: 1;
  entries: VaultEntry[];
};
