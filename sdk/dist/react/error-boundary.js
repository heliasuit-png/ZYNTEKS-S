import { Component } from "react";
import { getCurrentClient } from "../core/registry";
/**
 * React error boundary that reports render-time errors to the active ZYNTEKSIS
 * client. Use it to capture React runtime errors and render a fallback UI.
 */
export class ZynteksisErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
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
    render() {
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
//# sourceMappingURL=error-boundary.js.map