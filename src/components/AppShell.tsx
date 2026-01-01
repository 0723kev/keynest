import type { ReactNode } from "react";

export default function AppShell(props: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10">
        {props.children}
      </div>
    </div>
  );
}
