import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
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
export declare class ZynteksisErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): ReactNode;
}
export { ZynteksisErrorBoundary as ErrorBoundary };
//# sourceMappingURL=error-boundary.d.ts.map