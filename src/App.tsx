import { useMemo, useState } from "react";
import Welcome from "@/pages/Welcome";
import Unlock from "@/pages/Unlock";
import Vault from "@/pages/Vault";
import type { VaultData } from "./lib/types";

type Screen = "welcome" | "unlock" | "vault";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [vault, setVault] = useState<VaultData | null>(null);

  const demoVault = useMemo<VaultData>(
    () => ({
      version: 1,
      entries: [
        {
          id: "1",
          title: "Slack",
          username: "kev",
          password: "fakepassword123",
          notes: "Demo data only",
          updatedAt: Date.now(),
        },
      ],
    }),
    []
  );

  return (
    <>
      {screen === "welcome" && (
        <Welcome
          onCreate={() => {
            setVault(demoVault);
            setScreen("vault");
          }}
          onOpen={() => setScreen("unlock")}
        />
      )}

      {screen === "unlock" && (
        <Unlock
          onBack={() => setScreen("welcome")}
          onUnlock={() => {
            setVault(demoVault);
            setScreen("vault");
          }}
        />
      )}

      {screen === "vault" && vault && (
        <Vault
          vault={vault}
          onChange={setVault}
          onLock={() => {
            setVault(null);
            setScreen("unlock");
          }}
        />
      )}
    </>
  );
}
