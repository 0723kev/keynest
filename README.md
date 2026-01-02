# Keynest

A local-only password manager built with Tauri + React.

## Features

- Encrypted vault stored locally
- Master password unlock
- Create, edit, search entries
- Clipboard auto-clear
- No cloud, no sync

## Threat model

- Vault is encrypted at rest
- No plaintext passwords written to disk
- No network access

## Tech stack

- Tauri (Rust)
- React + Vite
- pnpm

## Images

### First open, set master password

![First open](.github/docs/images/welcome.png)

### Unlock vault

![Unlock](.github/docs/images/unlock.png)

### Vault view

![Vault](.github/docs/images/vault.png)

### Entry edit view

![Entry edit view](.github/docs/images/entry-edit.png)

## Development

```bash
pnpm install
pnpm tauri:dev
```

## Build

```
pnpm tauri:build
```

## Notes

- This project was built solo!!

## License

MIT License. See LICENSE for details.
