import { z } from "zod";

import { SDK_INGEST } from "@/lib/constants";

/**
 * Zod schemas describing the payloads accepted by the SDK ingestion API.
 * These validate untrusted input at the boundary and bound string/array sizes.
 */

const envSchema = z.enum(["production", "staging", "development"]);
const metricNum = z.number().finite();
const timestampSchema = z.union([z.string().max(40), z.number()]).optional();

const stringMax = (max: number) => z.string().max(max);

const browserSchema = z
  .object({
    name: stringMax(120),
    version: stringMax(60),
    userAgent: stringMax(2000),
  })
  .partial();

const osSchema = z
  .object({ name: stringMax(120), version: stringMax(60) })
  .partial();

const deviceSchema = z
  .object({ type: z.enum(["desktop", "mobile", "tablet", "unknown"]) })
  .partial();

const screenSchema = z
  .object({
    width: metricNum,
    height: metricNum,
    pixelRatio: metricNum,
  })
  .partial();

const memorySchema = z
  .object({
    usedJSHeapSize: metricNum,
    totalJSHeapSize: metricNum,
    jsHeapSizeLimit: metricNum,
  })
  .partial();

const networkSchema = z
  .object({
    effectiveType: stringMax(20),
    downlink: metricNum,
    rtt: metricNum,
    online: z.boolean(),
  })
  .partial();

const performanceMetricsSchema = z
  .object({
    pageLoad: metricNum,
    fcp: metricNum,
    lcp: metricNum,
    cls: metricNum,
    inp: metricNum,
    ttfb: metricNum,
    navigation: z.record(metricNum),
  })
  .partial();

const levelSchema = z.enum(["debug", "info", "warning", "error", "fatal"]);

export const errorPayloadSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: stringMax(20000).nullish(),
  type: stringMax(200).nullish(),
  level: levelSchema.optional(),
  url: stringMax(2000).nullish(),
  browser: browserSchema.nullish(),
  os: osSchema.nullish(),
  device: deviceSchema.nullish(),
  screen: screenSchema.nullish(),
  language: stringMax(20).nullish(),
  timezone: stringMax(60).nullish(),
  environment: envSchema.optional(),
  release: stringMax(80).nullish(),
  timestamp: timestampSchema,
  performance: performanceMetricsSchema.nullish(),
  network: networkSchema.nullish(),
  memory: memorySchema.nullish(),
});

export const heartbeatPayloadSchema = z.object({
  timestamp: timestampSchema,
  memory: memorySchema.nullish(),
  uptime: metricNum.optional(),
  page: stringMax(2000).nullish(),
  environment: envSchema.optional(),
  release: stringMax(80).nullish(),
});

export const performancePayloadSchema = z.object({
  url: stringMax(2000).nullish(),
  pageLoad: metricNum.optional(),
  fcp: metricNum.optional(),
  lcp: metricNum.optional(),
  cls: metricNum.optional(),
  inp: metricNum.optional(),
  ttfb: metricNum.optional(),
  navigation: z.record(metricNum).nullish(),
  environment: envSchema.optional(),
  release: stringMax(80).nullish(),
  timestamp: timestampSchema,
});

const eventSchema = z.object({
  type: z.string().min(1).max(120),
  name: stringMax(200).nullish(),
  level: levelSchema.optional(),
  message: stringMax(2000).nullish(),
  url: stringMax(2000).nullish(),
  metadata: z.record(z.unknown()).nullish(),
  timestamp: timestampSchema,
});

export const eventsPayloadSchema = z.object({
  environment: envSchema.optional(),
  release: stringMax(80).nullish(),
  events: z.array(eventSchema).min(1).max(SDK_INGEST.maxEventsPerRequest),
});

export type ErrorPayload = z.infer<typeof errorPayloadSchema>;
export type HeartbeatPayload = z.infer<typeof heartbeatPayloadSchema>;
export type PerformancePayload = z.infer<typeof performancePayloadSchema>;
export type EventsPayload = z.infer<typeof eventsPayloadSchema>;
export type SdkEvent = z.infer<typeof eventSchema>;
