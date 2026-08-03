import type { Database } from "@/types/database";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

/** Serializable state returned by the project server actions. */
export interface ProjectFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  project?: Project;
}

export const initialProjectFormState: ProjectFormState = { status: "idle" };

/** Serializable state returned by the delete-project action. */
export interface ProjectActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialProjectActionState: ProjectActionState = { status: "idle" };
