import { useEffect, useRef, useState } from "react";
import Welcome from "@/pages/Welcome";
import Unlock from "@/pages/Unlock";
import Vault from "@/pages/Vault";
import VaultHealth from "./pages/VaultHealth";
import type { VaultData } from "@/lib/types";
import {
  vaultExists,
  initVault,
  unlockVault,
  lockVault,
  saveVault,
} from "@/lib/persist";

export type Screen = "welcome" | "unlock" | "vault" | "health";
type SaveState = "idle" | "saving" | "saved" | "error";

export default function App() {
  const appName = "Keynest";

  const [screen, setScreen] = useState<Screen>("welcome");
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    vault ? vault.entries[0]?.id ?? null : null
  );

  const saveTimer = useRef<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const exists = await vaultExists();
        setScreen(exists ? "unlock" : "welcome");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!vault) return;
    if (screen !== "vault") return;

    setSaveState("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      void (async () => {
        try {
          await saveVault(vault);
          setSaveState("saved");
          window.setTimeout(() => setSaveState("idle"), 1200);
        } catch {
          setSaveState("error");
        }
      })();
    }, 400);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [vault, screen]);

  useEffect(() => {
    if (screen !== "vault") return;

    let timer: number | null = null;

    const reset = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void (async () => {
          try {
            await lockVault();
          } finally {
            setVault(null);
            setScreen("unlock");
          }
        })();
      }, 3 * 60 * 1000);
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    events.forEach((ev) =>
      window.addEventListener(ev, reset, {
        passive: true,
      } as AddEventListenerOptions)
    );
    reset();

    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [screen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches =
        "matches" in e ? e.matches : (e as MediaQueryList).matches;
      document.documentElement.classList.toggle("dark", matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (loading) return null;

  return (
    <>
      {screen === "welcome" && (
        <Welcome
          appName={appName}
          error={createError ?? undefined}
          onCreate={async (masterPassword: string) => {
            setCreateError(null);
            try {
              await initVault(masterPassword);
              const v = await unlockVault(masterPassword);
              setVault(v);
              setScreen("vault");
            } catch (e) {
              setCreateError(
                typeof e === "string"
                  ? e
                  : e instanceof Error
                  ? e.message
                  : "Could not create vault."
              );
            }
          }}
          onOpen={async () => {
            const exists = await vaultExists();
            setScreen(exists ? "unlock" : "welcome");
          }}
        />
      )}

      {screen === "unlock" && (
        <Unlock
          appName={appName}
          error={unlockError ?? undefined}
          onBack={async () => {
            const exists = await vaultExists();
            setUnlockError(null);
            setScreen(exists ? "unlock" : "welcome");
          }}
          onUnlock={async (masterPassword: string) => {
            setUnlockError(null);
            try {
              const v = await unlockVault(masterPassword);
              setVault(v);
              setScreen("vault");
            } catch (e) {
              setUnlockError(
                typeof e === "string"
                  ? e
                  : e instanceof Error
                  ? e.message
                  : "Wrong password."
              );
            }
          }}
        />
      )}

      {screen === "vault" && vault && (
        <Vault
          appName={appName}
          vault={vault}
          onLock={async () => {
            try {
              await lockVault();
            } finally {
              setVault(null);
              setScreen("unlock");
            }
          }}
          setScreen={setScreen}
          onChange={setVault}
          saveState={saveState}
          selectedId={selectedEntryId}
          setSelectedId={setSelectedEntryId}
        />
      )}

      {screen === "health" && vault && (
        <VaultHealth
          vault={vault}
          onBack={() => setScreen("vault")}
          onOpenEntry={(entryId: string) => {
            setSelectedEntryId(entryId);
            setScreen("vault");
          }}
        />
      )}
    </>
  );
}
