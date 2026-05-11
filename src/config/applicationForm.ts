export const APPLICATION_FIELD_KEYS = [
  "name",
  "organization",
  "email",
  "phone",
  "preferredVisitDate",
  "visitorCount",
  "message",
] as const;

export type ApplicationFieldKey = (typeof APPLICATION_FIELD_KEYS)[number];

export type ApplicationPayload = Partial<Record<ApplicationFieldKey, string>>;

export const REQUIRED_APPLICATION_FIELD_KEYS = ["name", "email"] as const satisfies readonly ApplicationFieldKey[];
