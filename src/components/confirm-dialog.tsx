"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

type ConfirmState = { message: string; resolve: (ok: boolean) => void } | null;

/**
 * Promise-based replacement for `window.confirm()`, styled as the Repline
 * design's full-screen confirm modal. Usage:
 *
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   if (!(await confirm("Biztosan törlöd?"))) return;
 *   ...
 *   return <>{dialog}{...rest of the component}</>;
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => setState({ message, resolve }));
  }, []);

  const dialog = state ? (
    <ConfirmOverlay
      message={state.message}
      onCancel={() => {
        state.resolve(false);
        setState(null);
      }}
      onConfirm={() => {
        state.resolve(true);
        setState(null);
      }}
    />
  ) : null;

  return { confirm, dialog };
}

function ConfirmOverlay({
  message,
  onCancel,
  onConfirm,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#060608]/72 p-6.5">
      <div className="flex w-full max-w-[358px] flex-col gap-4 rounded-[26px] border border-white/16 bg-[#15151A] p-5.5">
        <div className="text-[19px] font-extrabold tracking-[-0.02em]">Megerősítés</div>
        <p className="m-0 text-[13px] leading-relaxed text-white/75">{message}</p>
        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Mégsem
          </Button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full border-0 bg-[#FF6B6B] px-5 py-4 text-[13px] font-extrabold text-[#0A0A0B]"
          >
            Törlés
          </button>
        </div>
      </div>
    </div>
  );
}
