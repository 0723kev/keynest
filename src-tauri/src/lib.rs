use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};

use argon2::{Argon2, Params};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    Key, XChaCha20Poly1305, XNonce,
};
use getrandom::getrandom;
use tauri::Manager;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

#[derive(Debug, Serialize, Deserialize, Clone, Zeroize, ZeroizeOnDrop)]
struct VaultEntry {
    id: String,
    title: String,
    username: String,
    password: String,

    #[serde(rename = "totpSecret")]
    totp_secret: Option<String>,

    #[serde(rename = "totpIssuer")]
    totp_issuer: Option<String>,

    #[serde(rename = "totpAccount")]
    totp_account: Option<String>,

    tags: Option<Vec<String>>,
    notes: Option<String>,

    #[serde(rename = "updatedAt")]
    updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Zeroize, ZeroizeOnDrop)]
struct VaultData {
    version: u32,
    entries: Vec<VaultEntry>,
}

// encrypted file format
const MAGIC: &[u8; 8] = b"KEYNEST\0";
const FILE_VERSION: u8 = 1;
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 24;

const MAGIC_LEN: usize = 8;
const HEADER_LEN: usize = MAGIC_LEN + 1 + SALT_LEN + NONCE_LEN; // 8 + 1 + 16 + 24 = 49

struct CryptoState {
    key: Mutex<Option<Zeroizing<[u8; 32]>>>,
    salt: Mutex<Option<[u8; SALT_LEN]>>,
}

impl CryptoState {
    fn new() -> Self {
        Self {
            key: Mutex::new(None),
            salt: Mutex::new(None),
        }
    }
}

fn derive_key(password: &str, salt: &[u8; SALT_LEN]) -> Result<Zeroizing<[u8; 32]>, String> {
    let params = Params::new(64 * 1024, 3, 1, Some(32)).map_err(|e| e.to_string())?;
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    let mut out = Zeroizing::new([0u8; 32]);
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut *out)
        .map_err(|_| "Key derivation failed".to_string())?;

    Ok(out)
}

fn encrypt_vault(
    key_bytes: &[u8; 32],
    plaintext: &[u8],
) -> Result<([u8; NONCE_LEN], Vec<u8>), String> {
    let key = Key::from_slice(key_bytes);
    let cipher = XChaCha20Poly1305::new(key);

    let mut nonce = [0u8; NONCE_LEN];
    getrandom(&mut nonce).map_err(|e| e.to_string())?;
    let xnonce = XNonce::from_slice(&nonce);

    let ciphertext = cipher
        .encrypt(xnonce, plaintext)
        .map_err(|_| "Encryption failed".to_string())?;

    Ok((nonce, ciphertext))
}

fn decrypt_vault(
    key_bytes: &[u8; 32],
    nonce: &[u8; NONCE_LEN],
    ciphertext: &[u8],
) -> Result<Vec<u8>, String> {
    let key = Key::from_slice(key_bytes);
    let cipher = XChaCha20Poly1305::new(key);

    let xnonce = XNonce::from_slice(nonce);

    let plaintext = cipher
        .decrypt(xnonce, ciphertext)
        .map_err(|_| "Wrong password or corrupted vault".to_string())?;

    Ok(plaintext)
}

fn write_file(
    path: &PathBuf,
    salt: &[u8; SALT_LEN],
    nonce: &[u8; NONCE_LEN],
    ciphertext: &[u8],
) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let mut bytes = Vec::with_capacity(HEADER_LEN + ciphertext.len());
    bytes.extend_from_slice(MAGIC);
    bytes.push(FILE_VERSION);
    bytes.extend_from_slice(salt);
    bytes.extend_from_slice(nonce);
    bytes.extend_from_slice(ciphertext);

    let tmp_path = path.with_extension("tmp");
    fs::write(&tmp_path, &bytes).map_err(|e| e.to_string())?;
    let _ = fs::remove_file(path);
    fs::rename(&tmp_path, path).map_err(|e| e.to_string())?;
    Ok(())
}

fn read_file(path: &PathBuf) -> Result<([u8; SALT_LEN], [u8; NONCE_LEN], Vec<u8>), String> {
    let bytes = fs::read(path).map_err(|e| e.to_string())?;
    if bytes.len() < HEADER_LEN {
        return Err("Vault file too small".to_string());
    }

    if &bytes[0..MAGIC_LEN] != MAGIC {
        return Err("Invalid vault file".to_string());
    }

    let ver = bytes[MAGIC_LEN];
    if ver != FILE_VERSION {
        return Err(format!("Unsupported vault file version: {}", ver));
    }

    let salt_start = MAGIC_LEN + 1;
    let nonce_start = salt_start + SALT_LEN;
    let ct_start = nonce_start + NONCE_LEN;

    let mut salt = [0u8; SALT_LEN];
    salt.copy_from_slice(&bytes[salt_start..nonce_start]);

    let mut nonce = [0u8; NONCE_LEN];
    nonce.copy_from_slice(&bytes[nonce_start..ct_start]);

    let ciphertext = bytes[ct_start..].to_vec();
    Ok((salt, nonce, ciphertext))
}

fn vault_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    Ok(dir.join("vault.bin"))
}

// Commands

#[tauri::command]
fn vault_exists(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(vault_path(&app)?.exists())
}

#[tauri::command]
fn init_vault(
    app: tauri::AppHandle,
    state: tauri::State<CryptoState>,
    master_password: String,
) -> Result<(), String> {
    let path = vault_path(&app)?;
    if path.exists() {
        return Err("Vault already exists".to_string());
    }

    let mut salt = [0u8; SALT_LEN];
    getrandom(&mut salt).map_err(|e| e.to_string())?;

    let key = derive_key(&master_password, &salt)?;

    let empty = VaultData {
        version: 1,
        entries: vec![],
    };
    let plaintext = serde_json::to_vec(&empty).map_err(|e| e.to_string())?;
    let (nonce, ciphertext) = encrypt_vault(&key, &plaintext)?;
    write_file(&path, &salt, &nonce, &ciphertext)?;

    *state.key.lock().unwrap() = Some(key);
    *state.salt.lock().unwrap() = Some(salt);

    Ok(())
}

#[tauri::command]
fn unlock_vault(
    app: tauri::AppHandle,
    state: tauri::State<CryptoState>,
    master_password: String,
) -> Result<VaultData, String> {
    let path = vault_path(&app)?;
    if !path.exists() {
        return Err("Vault does not exist".to_string());
    }

    let (salt, nonce, ciphertext) = read_file(&path)?;
    let key = derive_key(&master_password, &salt)?;
    let plaintext = decrypt_vault(&key, &nonce, &ciphertext)?;

    let vault: VaultData = serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;

    *state.key.lock().unwrap() = Some(key);
    *state.salt.lock().unwrap() = Some(salt);

    Ok(vault)
}

#[tauri::command]
fn lock_vault(state: tauri::State<CryptoState>) -> Result<(), String> {
    *state.key.lock().unwrap() = None;
    *state.salt.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
fn load_vault(
    app: tauri::AppHandle,
    state: tauri::State<CryptoState>,
) -> Result<Option<VaultData>, String> {
    let key_guard = state.key.lock().unwrap();
    let key = match key_guard.as_ref() {
        Some(k) => k,
        None => return Err("Vault is locked".to_string()),
    };

    let path = vault_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }

    let (salt, nonce, ciphertext) = read_file(&path)?;

    if let Some(cached) = state.salt.lock().unwrap().as_ref() {
        if cached != &salt {
            return Err("Salt mismatch".to_string());
        }
    } else {
        return Err("Missing cached salt".to_string());
    }

    let plaintext = decrypt_vault(key, &nonce, &ciphertext)?;

    let vault: VaultData = serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;
    Ok(Some(vault))
}

#[tauri::command]
fn save_vault(
    app: tauri::AppHandle,
    state: tauri::State<CryptoState>,
    vault: VaultData,
) -> Result<(), String> {
    let key_guard = state.key.lock().unwrap();
    let key = key_guard
        .as_ref()
        .ok_or_else(|| "Vault is locked".to_string())?;
    let salt_guard = state.salt.lock().unwrap();
    let salt = salt_guard
        .as_ref()
        .ok_or_else(|| "Missing salt".to_string())?;

    let path = vault_path(&app)?;
    let plaintext = serde_json::to_vec(&vault).map_err(|e| e.to_string())?;

    let (nonce, ciphertext) = encrypt_vault(key, &plaintext)?;
    write_file(&path, salt, &nonce, &ciphertext)?;

    Ok(())
}

// App entry

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(CryptoState::new())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            vault_exists,
            init_vault,
            unlock_vault,
            lock_vault,
            load_vault,
            save_vault
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
