import { useEffect, useMemo, useState } from "react";
import Welcome from "@/pages/Welcome";
import Unlock from "@/pages/Unlock";
import Vault from "@/pages/Vault";
import type { VaultData } from "@/lib/types";

type Screen = "welcome" | "unlock" | "vault";

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
  const [screen, setScreen] = useState<Screen>("welcome");
  const [vault, setVault] = useState<VaultData | null>(null);

  const appName = "Keynest";

  const demoVault = useMemo(() => createDemoVault(), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Initial check
    handleChange(mediaQuery);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <>
      {screen === "welcome" && (
        <Welcome
          appName={appName}
          onCreate={() => {
            setVault(demoVault);
            setScreen("vault");
          }}
          onOpen={() => setScreen("unlock")}
        />
      )}

      {screen === "unlock" && (
        <Unlock
          appName={appName}
          onBack={() => setScreen("welcome")}
          onUnlock={() => {
            // TODO: actually unlock with Rust
            setVault(demoVault);
            setScreen("vault");
          }}
        />
      )}

      {screen === "vault" && vault && (
        <Vault
          appName={appName}
          vault={vault}
          onLock={() => {
            setVault(null);
            setScreen("unlock");
          }}
          onChange={setVault}
        />
      )}
    </>
  );
}
