import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatDateTime, truncate } from "@/utils/format";
import type { ComposedNotification, NotificationEvent } from "./types";

async function resolveComposerDict(): Promise<Dictionary> {
  try {
    return (await getDictionary()).dict;
  } catch {
    return dictionaries[DEFAULT_LOCALE];
  }
}

/**
 * Translates a raw notification event into presentation-ready content used for
 * both the in-app feed and the email. Keeping this in one place guarantees the
 * dashboard and email stay consistent.
 */
export async function composeNotification(
  event: NotificationEvent,
): Promise<ComposedNotification> {
  const dict = await resolveComposerDict();
  const t = dict.dash.notifications.composer;
  const severityLabels = dict.dash.incidents.severities;

  switch (event.type) {
    case "incident_created": {
      const severityLabel = severityLabels[event.severity];
      return {
        type: event.type,
        level: event.severity === "critical" ? "error" : "warning",
        title: fillTemplate(t.incidentCreatedTitle, {
          title: event.incidentTitle,
        }),
        body: fillTemplate(t.incidentCreatedBody, {
          severity: severityLabel.toLowerCase(),
          project: event.projectName,
        }),
        details: [
          { label: t.detailProject, value: event.projectName },
          { label: t.detailSeverity, value: severityLabel },
          { label: t.detailStarted, value: formatDateTime(event.startedAt) },
        ],
        actionPath: `/incidents/${event.incidentId}`,
        actionLabel: t.viewIncident,
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
        title: fillTemplate(t.incidentResolvedTitle, {
          title: event.incidentTitle,
        }),
        body: fillTemplate(t.incidentResolvedBody, {
          project: event.projectName,
        }),
        details: [
          { label: t.detailProject, value: event.projectName },
          { label: t.detailDowntime, value: event.durationText },
          { label: t.detailResolved, value: formatDateTime(event.resolvedAt) },
        ],
        actionPath: `/incidents/${event.incidentId}`,
        actionLabel: t.viewIncident,
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
        { label: t.detailProject, value: event.projectName },
        { label: t.detailWhen, value: formatDateTime(event.occurredAt) },
      ];
      if (event.url) {
        details.push({ label: t.detailUrl, value: event.url });
      }
      return {
        type: event.type,
        level: "error",
        title: fillTemplate(t.criticalErrorTitle, {
          project: event.projectName,
        }),
        body: truncate(event.message, 200),
        details,
        actionPath: "/errors",
        actionLabel: t.viewErrors,
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
        title: t.apiKeyRevokedTitle,
        body: fillTemplate(t.apiKeyRevokedBody, {
          key: event.keyName,
          project: event.projectName,
        }),
        details: [
          { label: t.detailProject, value: event.projectName },
          {
            label: t.detailKey,
            value: `${event.keyName} (${event.keyPrefix})`,
          },
          { label: t.detailRevoked, value: formatDateTime(event.revokedAt) },
        ],
        actionPath: "/api-keys",
        actionLabel: t.manageKeys,
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
      const details = [{ label: t.detailProject, value: event.projectName }];
      if (event.framework) {
        details.push({ label: t.detailFramework, value: event.framework });
      }
      details.push({
        label: t.detailCreated,
        value: formatDateTime(event.createdAt),
      });
      return {
        type: event.type,
        level: "success",
        title: t.projectCreatedTitle,
        body: fillTemplate(t.projectCreatedBody, {
          project: event.projectName,
        }),
        details,
        actionPath: "/projects",
        actionLabel: t.openProjects,
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
