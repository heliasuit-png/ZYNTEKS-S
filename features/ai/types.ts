export interface ConversationListItem {
  id: string;
  title: string;
  pinned: boolean;
  projectId: string | null;
  messageCount: number;
  updatedAt: string;
}

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  feedback?: "up" | "down" | null;
}

export interface UsageView {
  used: number;
  limit: number | null;
  remaining: number | null;
  tokensThisMonth: number;
}

export interface ProjectOption {
  id: string;
  name: string;
}
