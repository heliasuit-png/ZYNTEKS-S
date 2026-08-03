export interface PreferencesFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialPreferencesFormState: PreferencesFormState = {
  status: "idle",
};
