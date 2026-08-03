export { getResendClient, getDefaultFromAddress } from "@/emails/client";
export { sendEmail } from "@/emails/send";
export type { SendEmailInput, SendEmailResult } from "@/emails/send";
export { renderNotificationEmail } from "@/emails/render";
export { renderEmailLayout } from "@/emails/templates/layout";
export type {
  EmailContent,
  EmailDetail,
  NotificationEmailInput,
} from "@/emails/types";
