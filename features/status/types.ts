export interface StatusPageFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialStatusPageFormState: StatusPageFormState = {
  status: "idle",
};
