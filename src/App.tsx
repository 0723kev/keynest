import { useEffect, useRef, useState } from "react";
import Welcome from "@/pages/Welcome";
import Unlock from "@/pages/Unlock";
import Vault from "@/pages/Vault";
import type { VaultData } from "@/lib/types";
import { loadVault, saveVault } from "@/lib/persist";

type Screen = "welcome" | "unlock" | "vault";
type SaveState = "idle" | "saving" | "saved" | "error";

function createDemoVault(): VaultData {
  return {
    version: 1,
    entries: [
      {
        id: crypto.randomUUID(),
        title: "Discord",
        username: "user@example.com",
        password: "demo-password",
        notes: "Fake data only. Don't commit real secrets!!!!!!!!!!!",
        updatedAt: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        title: "GitHub",
        username: "kevin",
        password: "not-a-real-password",
        updatedAt: Date.now(),
      },
    ],
  };
}

export default function App() {
  const appName = "Keynest";

  const [screen, setScreen] = useState<Screen>("welcome");
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);

  const saveTimer = useRef<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    void (async () => {
      try {
        const existing = await loadVault();
        if (existing) {
          setVault(existing);
          // TODO: later, go to unlock if encrypted
          setScreen("vault");
        } else {
          setVault(null);
          setScreen("welcome");
        }
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
        setScreen("unlock");
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
      if ("matches" in e && e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
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
          onCreate={() => {
            const v = createDemoVault();
            setVault(v);
            setScreen("vault");
          }}
          onOpen={() => {
            // TODO: show file picker to open existing vault
            setScreen("vault");
          }}
        />
      )}

      {screen === "unlock" && (
        <Unlock
          appName={appName}
          onBack={() => setScreen("welcome")}
          onUnlock={async () => {
            // TODO: actually load and decrypt vault
            const existing = await loadVault();
            if (existing) setVault(existing);
            setScreen("vault");
          }}
        />
      )}

      {screen === "vault" && vault && (
        <Vault
          appName={appName}
          vault={vault}
          onLock={() => {
            // TODO: clear sensitive data from memory
            setScreen("unlock");
          }}
          onChange={setVault}
          saveState={saveState}
        />
      )}
    </>
  );
}
