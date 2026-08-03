/** Normalizes any thrown value into a {@link RawError}. */
export function errorToRaw(error) {
    if (error instanceof Error) {
        return {
            message: error.message || error.name || "Error",
            stack: error.stack ?? null,
            type: error.name || "Error",
        };
    }
    if (typeof error === "string") {
        return { message: error, stack: null, type: "Error" };
    }
    try {
        return { message: JSON.stringify(error), stack: null, type: "Error" };
    }
    catch {
        return { message: String(error), stack: null, type: "Error" };
    }
}
//# sourceMappingURL=error.js.map