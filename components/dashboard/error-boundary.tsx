"use client";

import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import type { ErrorInfo, ReactNode } from "react";

import { useDictionaryOptional } from "@/components/i18n/locale-provider";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const fallbackShell = dictionaries.en.dash.shell;

function DefaultSectionFallback() {
  const ctx = useDictionaryOptional();
  const title = ctx?.dict.dash.shell.sectionFailed ?? fallbackShell.sectionFailed;
  const description =
    ctx?.dict.dash.shell.sectionFailedDesc ?? fallbackShell.sectionFailedDesc;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zt-danger/30 bg-zt-danger/10 px-6 py-10 text-center">
      <AlertTriangle className="size-6 text-zt-danger" aria-hidden />
      <p className="text-sm font-semibold text-zt-text">{title}</p>
      <p className="max-w-sm text-sm text-zt-muted">{description}</p>
    </div>
  );
}

/** Client error boundary for isolating dashboard sections from crashes. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Dashboard section error:", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultSectionFallback />;
    }
    return this.props.children;
  }
}
