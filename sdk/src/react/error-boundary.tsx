import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

import { getCurrentClient } from "../core/registry";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered when an error is caught. Receives the error when a function. */
  fallback?: ReactNode | ((error: Error) => ReactNode);
  /** Invoked with the captured error and React component stack. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * React error boundary that reports render-time errors to the active ZYNTEKSIS
 * client. Use it to capture React runtime errors and render a fallback UI.
 */
export class ZynteksisErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const client = getCurrentClient();
    if (client) {
      client.captureException(error, { type: "react", level: "error" });
      client.captureEvent({
        type: "react.componentStack",
        level: "error",
        message: info.componentStack ?? undefined,
        metadata: {},
      });
    }
    this.props.onError?.(error, info);
  }

  override render(): ReactNode {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === "function") {
        return fallback(this.state.error);
      }
      if (fallback !== undefined) {
        return fallback;
      }
      return null;
    }
    return this.props.children;
  }
}

export { ZynteksisErrorBoundary as ErrorBoundary };
