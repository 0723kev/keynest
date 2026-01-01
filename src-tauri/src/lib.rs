use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct VaultEntry {
  id: String,
  title: String,
  username: String,
  password: String,
  notes: Option<String>,
  
  #[serde(rename = "updatedAt")]
  updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct VaultData{
  version: u32,
  entries: Vec<VaultEntry>,
}

fn vault_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let dir = app
    .path()
    .app_data_dir()
    .map_err(|e| e.to_string())?;

  Ok(dir.join("vault.json"))
}

#[tauri::command]
fn load_vault(app: tauri::AppHandle) -> Result<Option<VaultData>, String> {
  let path = vault_path(&app)?;
  if !path.exists() {
    return Ok(None);
  }

  let bytes = fs::read(&path).map_err(|e| e.to_string())?;
  let vault: VaultData = serde_json::from_slice(&bytes).map_err(|e| e.to_string())?;
  Ok(Some(vault))
}

#[tauri::command]
fn save_vault(app: tauri::AppHandle, vault: VaultData) -> Result<(), String> {
  let path = vault_path(&app)?;

  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }

  let bytes = serde_json::to_vec_pretty(&vault).map_err(|e| e.to_string())?;
  fs::write(&path, bytes).map_err(|e| e.to_string())?;
  Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
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
    .invoke_handler(tauri::generate_handler![load_vault, save_vault])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
