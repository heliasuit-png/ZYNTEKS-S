"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useDictionaryOptional } from "@/components/i18n/locale-provider";
import { dictionaries } from "@/lib/i18n/dictionaries";

const fallbackSystem = dictionaries.en.system;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ctx = useDictionaryOptional();
  const system = ctx?.dict.system ?? fallbackSystem;

  useEffect(() => {
    // Report to the browser console; server-side capture happens in the API
    // and monitoring layers.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{system.somethingWrong}</h1>
        <p className="text-sm text-muted-foreground">{system.unexpectedError}</p>
      </div>
      <Button onClick={reset}>{system.tryAgain}</Button>
    </main>
  );
}
