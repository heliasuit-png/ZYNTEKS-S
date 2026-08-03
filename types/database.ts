/**
 * Supabase database types.
 *
 * Kept in sync with the SQL migrations in `supabase/migrations`. Regenerate
 * from a live project with:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive" | "banned";
export type SubscriptionPlan = "free" | "pro" | "enterprise";

export type ProjectFramework =
  | "nextjs"
  | "react"
  | "vue"
  | "angular"
  | "nuxt"
  | "express"
  | "nodejs"
  | "laravel"
  | "django"
  | "aspnet"
  | "flutter_web"
  | "other";
export type ProjectStatus = "active" | "paused" | "archived";
export type ApiKeyEnvironment = "production" | "staging" | "development";
export type ApiKeyStatus = "active" | "revoked";
export type ApiKeyLogEvent =
  | "created"
  | "used"
  | "revoked"
  | "regenerated"
  | "auth_success"
  | "auth_failed";
export type EventLevel = "debug" | "info" | "warning" | "error" | "fatal";
export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentSource = "monitor" | "manual";
export type NotificationType =
  | "incident_created"
  | "incident_resolved"
  | "critical_error"
  | "api_key_revoked"
  | "project_created";
export type NotificationChannel = "email" | "dashboard" | "slack" | "discord";
export type NotificationDeliveryStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "skipped";
export type NotificationLevel = "info" | "success" | "warning" | "error";
export type AiMessageRole = "user" | "assistant" | "system";
export type AiFeedbackRating = "up" | "down";
export type StatusMaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type WorkspaceRole =
  | "owner"
  | "administrator"
  | "developer"
  | "viewer"
  | "billing_manager";
export type WorkspaceMemberStatus = "active" | "suspended";
export type WorkspaceInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";
export type AuditAction =
  | "login"
  | "logout"
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "api_key_generated"
  | "api_key_revoked"
  | "incident_closed"
  | "ai_analysis"
  | "billing_changed"
  | "invitation_sent"
  | "invitation_accepted"
  | "invitation_declined"
  | "invitation_cancelled"
  | "member_removed"
  | "member_suspended"
  | "member_restored"
  | "role_changed"
  | "ownership_transferred"
  | "workspace_updated"
  | "session_revoked"
  | "password_changed"
  | "security_updated";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_plan: SubscriptionPlan;
          role: UserRole;
          status: UserStatus;
          language: string;
          timezone: string;
          password_changed_at: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_plan?: SubscriptionPlan;
          role?: UserRole;
          status?: UserStatus;
          language?: string;
          timezone?: string;
          password_changed_at?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_plan?: SubscriptionPlan;
          role?: UserRole;
          status?: UserStatus;
          language?: string;
          timezone?: string;
          password_changed_at?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          name: string;
          slug: string;
          description: string | null;
          framework: ProjectFramework;
          production_url: string | null;
          staging_url: string | null;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          name: string;
          slug: string;
          description?: string | null;
          framework?: ProjectFramework;
          production_url?: string | null;
          staging_url?: string | null;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          framework?: ProjectFramework;
          production_url?: string | null;
          staging_url?: string | null;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          owner_id: string;
          timezone: string;
          brand_color: string;
          plan: SubscriptionPlan;
          notification_defaults: Json;
          security_policies: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          owner_id: string;
          timezone?: string;
          brand_color?: string;
          plan?: SubscriptionPlan;
          notification_defaults?: Json;
          security_policies?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          owner_id?: string;
          timezone?: string;
          brand_color?: string;
          plan?: SubscriptionPlan;
          notification_defaults?: Json;
          security_policies?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          status: WorkspaceMemberStatus;
          invited_by: string | null;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          status?: WorkspaceMemberStatus;
          invited_by?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          status?: WorkspaceMemberStatus;
          invited_by?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: WorkspaceRole;
          status: WorkspaceInvitationStatus;
          token: string;
          invited_by: string;
          accepted_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role?: WorkspaceRole;
          status?: WorkspaceInvitationStatus;
          token: string;
          invited_by: string;
          accepted_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: WorkspaceRole;
          status?: WorkspaceInvitationStatus;
          token?: string;
          invited_by?: string;
          accepted_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          actor_id: string | null;
          action: AuditAction;
          resource_type: string | null;
          resource_id: string | null;
          summary: string;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          actor_id?: string | null;
          action: AuditAction;
          resource_type?: string | null;
          resource_id?: string | null;
          summary: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          actor_id?: string | null;
          action?: AuditAction;
          resource_type?: string | null;
          resource_id?: string | null;
          summary?: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token_hash: string;
          device_label: string | null;
          browser: string | null;
          os: string | null;
          country: string | null;
          ip_address: string | null;
          user_agent: string | null;
          is_current: boolean;
          last_active_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token_hash: string;
          device_label?: string | null;
          browser?: string | null;
          os?: string | null;
          country?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          is_current?: boolean;
          last_active_at?: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token_hash?: string;
          device_label?: string | null;
          browser?: string | null;
          os?: string | null;
          country?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          is_current?: boolean;
          last_active_at?: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          environment: ApiKeyEnvironment;
          status: ApiKeyStatus;
          last_used_at: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          environment?: ApiKeyEnvironment;
          status?: ApiKeyStatus;
          last_used_at?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          environment?: ApiKeyEnvironment;
          status?: ApiKeyStatus;
          last_used_at?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      api_key_logs: {
        Row: {
          id: string;
          api_key_id: string | null;
          project_id: string | null;
          user_id: string | null;
          event: ApiKeyLogEvent;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          api_key_id?: string | null;
          project_id?: string | null;
          user_id?: string | null;
          event: ApiKeyLogEvent;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          api_key_id?: string | null;
          project_id?: string | null;
          user_id?: string | null;
          event?: ApiKeyLogEvent;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      errors: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          fingerprint: string;
          message: string;
          stack: string | null;
          type: string | null;
          level: EventLevel;
          url: string | null;
          browser: Json | null;
          os: Json | null;
          device: Json | null;
          screen: Json | null;
          language: string | null;
          timezone: string | null;
          environment: ApiKeyEnvironment;
          release: string | null;
          performance: Json | null;
          network: Json | null;
          memory: Json | null;
          occurrences: number;
          first_seen: string;
          last_seen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          fingerprint: string;
          message: string;
          stack?: string | null;
          type?: string | null;
          level?: EventLevel;
          url?: string | null;
          browser?: Json | null;
          os?: Json | null;
          device?: Json | null;
          screen?: Json | null;
          language?: string | null;
          timezone?: string | null;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          performance?: Json | null;
          network?: Json | null;
          memory?: Json | null;
          occurrences?: number;
          first_seen?: string;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          fingerprint?: string;
          message?: string;
          stack?: string | null;
          type?: string | null;
          level?: EventLevel;
          url?: string | null;
          browser?: Json | null;
          os?: Json | null;
          device?: Json | null;
          screen?: Json | null;
          language?: string | null;
          timezone?: string | null;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          performance?: Json | null;
          network?: Json | null;
          memory?: Json | null;
          occurrences?: number;
          first_seen?: string;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      error_events: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: string;
          name: string | null;
          level: EventLevel;
          message: string | null;
          url: string | null;
          metadata: Json;
          environment: ApiKeyEnvironment;
          release: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: string;
          name?: string | null;
          level?: EventLevel;
          message?: string | null;
          url?: string | null;
          metadata?: Json;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          type?: string;
          name?: string | null;
          level?: EventLevel;
          message?: string | null;
          url?: string | null;
          metadata?: Json;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      heartbeats: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          memory: Json | null;
          uptime: number | null;
          page: string | null;
          environment: ApiKeyEnvironment;
          release: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          memory?: Json | null;
          uptime?: number | null;
          page?: string | null;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          memory?: Json | null;
          uptime?: number | null;
          page?: string | null;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      performance_logs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          url: string | null;
          page_load: number | null;
          fcp: number | null;
          lcp: number | null;
          cls: number | null;
          inp: number | null;
          ttfb: number | null;
          navigation: Json | null;
          environment: ApiKeyEnvironment;
          release: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          url?: string | null;
          page_load?: number | null;
          fcp?: number | null;
          lcp?: number | null;
          cls?: number | null;
          inp?: number | null;
          ttfb?: number | null;
          navigation?: Json | null;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          url?: string | null;
          page_load?: number | null;
          fcp?: number | null;
          lcp?: number | null;
          cls?: number | null;
          inp?: number | null;
          ttfb?: number | null;
          navigation?: Json | null;
          environment?: ApiKeyEnvironment;
          release?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: IncidentStatus;
          severity: IncidentSeverity;
          source: IncidentSource;
          started_at: string;
          detected_at: string;
          resolved_at: string | null;
          downtime_seconds: number | null;
          last_heartbeat_at: string | null;
          auto_resolved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: IncidentStatus;
          severity?: IncidentSeverity;
          source?: IncidentSource;
          started_at?: string;
          detected_at?: string;
          resolved_at?: string | null;
          downtime_seconds?: number | null;
          last_heartbeat_at?: string | null;
          auto_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: IncidentStatus;
          severity?: IncidentSeverity;
          source?: IncidentSource;
          started_at?: string;
          detected_at?: string;
          resolved_at?: string | null;
          downtime_seconds?: number | null;
          last_heartbeat_at?: string | null;
          auto_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incident_updates: {
        Row: {
          id: string;
          incident_id: string;
          user_id: string;
          status: IncidentStatus | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          user_id: string;
          status?: IncidentStatus | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          user_id?: string;
          status?: IncidentStatus | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_enabled: boolean;
          dashboard_enabled: boolean;
          slack_enabled: boolean;
          slack_webhook_url: string | null;
          discord_enabled: boolean;
          discord_webhook_url: string | null;
          type_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_enabled?: boolean;
          dashboard_enabled?: boolean;
          slack_enabled?: boolean;
          slack_webhook_url?: string | null;
          discord_enabled?: boolean;
          discord_webhook_url?: string | null;
          type_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_enabled?: boolean;
          dashboard_enabled?: boolean;
          slack_enabled?: boolean;
          slack_webhook_url?: string | null;
          discord_enabled?: boolean;
          discord_webhook_url?: string | null;
          type_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_queue: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          type: NotificationType;
          channel: NotificationChannel;
          level: NotificationLevel;
          title: string;
          body: string;
          data: Json;
          status: NotificationDeliveryStatus;
          attempts: number;
          scheduled_for: string;
          processed_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          type: NotificationType;
          channel: NotificationChannel;
          level?: NotificationLevel;
          title: string;
          body: string;
          data?: Json;
          status?: NotificationDeliveryStatus;
          attempts?: number;
          scheduled_for?: string;
          processed_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          type?: NotificationType;
          channel?: NotificationChannel;
          level?: NotificationLevel;
          title?: string;
          body?: string;
          data?: Json;
          status?: NotificationDeliveryStatus;
          attempts?: number;
          scheduled_for?: string;
          processed_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          queue_id: string | null;
          type: NotificationType;
          channel: NotificationChannel;
          level: NotificationLevel;
          title: string;
          body: string;
          data: Json;
          status: NotificationDeliveryStatus;
          provider_message_id: string | null;
          error: string | null;
          read_at: string | null;
          archived_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          queue_id?: string | null;
          type: NotificationType;
          channel: NotificationChannel;
          level?: NotificationLevel;
          title: string;
          body: string;
          data?: Json;
          status?: NotificationDeliveryStatus;
          provider_message_id?: string | null;
          error?: string | null;
          read_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          queue_id?: string | null;
          type?: NotificationType;
          channel?: NotificationChannel;
          level?: NotificationLevel;
          title?: string;
          body?: string;
          data?: Json;
          status?: NotificationDeliveryStatus;
          provider_message_id?: string | null;
          error?: string | null;
          read_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      status_pages: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          slug: string;
          name: string;
          description: string | null;
          is_public: boolean;
          logo_url: string | null;
          brand_color: string;
          timezone: string;
          contact_email: string | null;
          footer_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          slug: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          logo_url?: string | null;
          brand_color?: string;
          timezone?: string;
          contact_email?: string | null;
          footer_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          logo_url?: string | null;
          brand_color?: string;
          timezone?: string;
          contact_email?: string | null;
          footer_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      status_page_components: {
        Row: {
          id: string;
          status_page_id: string;
          project_id: string;
          user_id: string;
          name: string;
          description: string | null;
          component_key: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status_page_id: string;
          project_id: string;
          user_id: string;
          name: string;
          description?: string | null;
          component_key?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status_page_id?: string;
          project_id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          component_key?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      status_page_maintenance: {
        Row: {
          id: string;
          status_page_id: string;
          project_id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: StatusMaintenanceStatus;
          scheduled_start: string;
          scheduled_end: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status_page_id: string;
          project_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: StatusMaintenanceStatus;
          scheduled_start: string;
          scheduled_end: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status_page_id?: string;
          project_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: StatusMaintenanceStatus;
          scheduled_start?: string;
          scheduled_end?: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          model: string;
          pinned: boolean;
          message_count: number;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title?: string;
          model: string;
          pinned?: boolean;
          message_count?: number;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          model?: string;
          pinned?: boolean;
          message_count?: number;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: AiMessageRole;
          content: string;
          model: string | null;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          total_tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: AiMessageRole;
          content: string;
          model?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          total_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: AiMessageRole;
          content?: string;
          model?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          total_tokens?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_feedback: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          rating: AiFeedbackRating;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          rating: AiFeedbackRating;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          rating?: AiFeedbackRating;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string | null;
          message_id: string | null;
          model: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id?: string | null;
          message_id?: string | null;
          model: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string | null;
          message_id?: string | null;
          model?: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      subscription_plan: SubscriptionPlan;
      project_framework: ProjectFramework;
      project_status: ProjectStatus;
      api_key_environment: ApiKeyEnvironment;
      api_key_status: ApiKeyStatus;
      api_key_log_event: ApiKeyLogEvent;
      event_level: EventLevel;
      incident_status: IncidentStatus;
      incident_severity: IncidentSeverity;
      incident_source: IncidentSource;
      notification_type: NotificationType;
      notification_channel: NotificationChannel;
      notification_delivery_status: NotificationDeliveryStatus;
      notification_level: NotificationLevel;
      ai_message_role: AiMessageRole;
      ai_feedback_rating: AiFeedbackRating;
      workspace_role: WorkspaceRole;
      workspace_member_status: WorkspaceMemberStatus;
      workspace_invitation_status: WorkspaceInvitationStatus;
      audit_action: AuditAction;
      status_maintenance_status: StatusMaintenanceStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
