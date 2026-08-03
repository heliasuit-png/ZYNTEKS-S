import { INCIDENT_SEVERITY_LABELS } from "@/lib/constants";
import { formatDateTime, truncate } from "@/utils/format";
import type { ComposedNotification, NotificationEvent } from "./types";

/**
 * Translates a raw notification event into presentation-ready content used for
 * both the in-app feed and the email. Keeping this in one place guarantees the
 * dashboard and email stay consistent.
 */
export function composeNotification(
  event: NotificationEvent,
): ComposedNotification {
  switch (event.type) {
    case "incident_created": {
      const severityLabel = INCIDENT_SEVERITY_LABELS[event.severity];
      return {
        type: event.type,
        level: event.severity === "critical" ? "error" : "warning",
        title: `Incident: ${event.incidentTitle}`,
        body: `A ${severityLabel.toLowerCase()} incident was opened for ${event.projectName}.`,
        details: [
          { label: "Project", value: event.projectName },
          { label: "Severity", value: severityLabel },
          { label: "Started", value: formatDateTime(event.startedAt) },
        ],
        actionPath: `/incidents/${event.incidentId}`,
        actionLabel: "View incident",
        dedupeKey: "incidentId",
        dedupeValue: event.incidentId,
        data: {
          incidentId: event.incidentId,
          projectName: event.projectName,
          severity: event.severity,
          startedAt: event.startedAt,
        },
      };
    }
    case "incident_resolved": {
      return {
        type: event.type,
        level: "success",
        title: `Resolved: ${event.incidentTitle}`,
        body: `The incident affecting ${event.projectName} has been resolved.`,
        details: [
          { label: "Project", value: event.projectName },
          { label: "Downtime", value: event.durationText },
          { label: "Resolved", value: formatDateTime(event.resolvedAt) },
        ],
        actionPath: `/incidents/${event.incidentId}`,
        actionLabel: "View incident",
        dedupeKey: "incidentResolvedId",
        dedupeValue: event.incidentId,
        data: {
          incidentId: event.incidentId,
          projectName: event.projectName,
          durationText: event.durationText,
          resolvedAt: event.resolvedAt,
        },
      };
    }
    case "critical_error": {
      const details = [
        { label: "Project", value: event.projectName },
        { label: "When", value: formatDateTime(event.occurredAt) },
      ];
      if (event.url) {
        details.push({ label: "URL", value: event.url });
      }
      return {
        type: event.type,
        level: "error",
        title: `Critical error in ${event.projectName}`,
        body: truncate(event.message, 200),
        details,
        actionPath: "/errors",
        actionLabel: "View errors",
        dedupeKey: "errorId",
        dedupeValue: event.errorId,
        data: {
          errorId: event.errorId,
          projectName: event.projectName,
          message: truncate(event.message, 500),
          url: event.url ?? null,
        },
      };
    }
    case "api_key_revoked": {
      return {
        type: event.type,
        level: "warning",
        title: "API key revoked",
        body: `The API key "${event.keyName}" for ${event.projectName} was revoked.`,
        details: [
          { label: "Project", value: event.projectName },
          { label: "Key", value: `${event.keyName} (${event.keyPrefix})` },
          { label: "Revoked", value: formatDateTime(event.revokedAt) },
        ],
        actionPath: "/api-keys",
        actionLabel: "Manage keys",
        dedupeKey: "keyId",
        dedupeValue: event.keyId,
        data: {
          keyId: event.keyId,
          keyName: event.keyName,
          projectName: event.projectName,
        },
      };
    }
    case "project_created": {
      const details = [{ label: "Project", value: event.projectName }];
      if (event.framework) {
        details.push({ label: "Framework", value: event.framework });
      }
      details.push({ label: "Created", value: formatDateTime(event.createdAt) });
      return {
        type: event.type,
        level: "success",
        title: "Project created",
        body: `Your project "${event.projectName}" is ready to receive events.`,
        details,
        actionPath: "/projects",
        actionLabel: "Open projects",
        dedupeKey: "projectCreatedId",
        dedupeValue: event.projectId,
        data: {
          projectId: event.projectId,
          projectName: event.projectName,
          framework: event.framework ?? null,
        },
      };
    }
  }
}
