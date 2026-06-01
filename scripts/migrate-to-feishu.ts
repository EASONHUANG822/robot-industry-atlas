/**
 * One-time migration script: copy all Airtable records to Feishu Bitable.
 *
 * Usage: npx tsx scripts/migrate-to-feishu.ts
 *
 * Reads .env.local for both Airtable and Feishu credentials.
 * Airtable is the source; Feishu is the destination.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";

// ---- manual .env.local parser (no dotenv dependency) ----

function loadEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("ERROR: .env.local not found.");
    process.exit(1);
  }
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return env;
}

// ---- Feishu helpers ----

let cachedFeishuToken: string | null = null;

async function getFeishuToken(env: Record<string, string>): Promise<string> {
  if (cachedFeishuToken) return cachedFeishuToken;

  const body = JSON.stringify({
    app_id: env.LARK_APP_ID,
    app_secret: env.LARK_APP_SECRET,
  });

  const res = await feishuRequest("POST", "/open-apis/auth/v3/tenant_access_token/internal", body);
  cachedFeishuToken = res.tenant_access_token as string;
  return cachedFeishuToken!;
}

function feishuRequest(method: string, path: string, body?: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string | number> = {};

    if (body) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(body);
    }

    const opts: https.RequestOptions = {
      hostname: "open.feishu.cn",
      path,
      method,
      headers,
    };

    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c: Buffer) => (data += c.toString()));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function buildFeishuUrl(appToken: string, tableId: string, suffix = ""): string {
  return `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}${suffix}`;
}

// ---- Airtable helpers ----

function airtableRequest(
  token: string,
  baseId: string,
  tableName: string,
  params: Record<string, string> = {}
): Promise<Record<string, unknown>> {
  const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
      let data = "";
      res.on("data", (c: Buffer) => (data += c.toString()));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid Airtable JSON: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function fetchAllAirtableRecords(
  token: string,
  baseId: string,
  tableName: string
): Promise<Array<{ id: string; fields: Record<string, unknown> }>> {
  const all: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;

  do {
    const params: Record<string, string> = { pageSize: "100" };
    if (offset) params.offset = offset;

    const res = (await airtableRequest(token, baseId, tableName, params)) as {
      records?: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    };

    if (res.records) all.push(...res.records);
    offset = res.offset;
  } while (offset);

  return all;
}

// ---- Field mappings ----

// Feishu application table field names
const APP_FEISHU_FIELDS: Record<string, string> = {
  Name: "Name",
  organization: "organization",
  email: "email",
  phone: "phone",
  preferredVisitDate: "preferredVisitDate",
  visitorCount: "visitorCount",
  message: "message",
  Status: "Status",
  "Submitted At": "Submitted At",
  "Record ID": "Record ID",
};

// Feishu feedback table field names
const FB_FEISHU_FIELDS: Record<string, string> = {
  Name: "Name",
  Role: "Role",
  Message: "Message",
  Status: "Status",
  Featured: "Featured",
  SubmittedAt: "SubmittedAt",
  "Record ID": "Record ID",
};

// ---- Date helpers ----

// Feishu date fields (type 5) expect 13-digit millisecond Unix timestamps
const DATE_FIELDS_APPLICATIONS = new Set(["preferredVisitDate", "Submitted At"]);
const DATE_FIELDS_FEEDBACK = new Set(["SubmittedAt"]);

function toFeishuDate(val: unknown): number | undefined {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const ms = Date.parse(val);
    if (!Number.isNaN(ms)) return ms;
  }
  return undefined;
}

// ---- Main migration ----

async function main() {
  const env = loadEnv();

  // Airtable config
  const atToken = env.AIRTABLE_TOKEN;
  const atBase = env.AIRTABLE_BASE_ID;
  const atAppsTable = env.AIRTABLE_TABLE_NAME; // applications
  const atFbTable = env.AIRTABLE_FEEDBACK_TABLE_NAME; // feedback

  if (!atToken || !atBase || !atAppsTable || !atFbTable) {
    console.error("ERROR: Missing Airtable env vars.");
    process.exit(1);
  }

  // Feishu config
  const larkToken = await getFeishuToken(env);
  const appToken = env.LARK_BITABLE_APP_TOKEN;
  const appsTableId = env.LARK_BITABLE_TABLE_ID_APPLICATIONS;
  const fbTableId = env.LARK_BITABLE_TABLE_ID_FEEDBACK;

  if (!appToken || !appsTableId || !fbTableId) {
    console.error("ERROR: Missing Feishu Bitable env vars.");
    process.exit(1);
  }

  async function writeFeishuRecord(tableId: string, fields: Record<string, unknown>, label: string) {
    const url = buildFeishuUrl(appToken, tableId, "/records");
    const headers = {
      Authorization: `Bearer ${larkToken}`,
      "Content-Type": "application/json",
    };
    const body = JSON.stringify({ fields });

    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      const opts: https.RequestOptions = {
        hostname: "open.feishu.cn",
        path: url,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": String(Buffer.byteLength(body)),
        },
      };
      const req = https.request(opts, (res) => {
        let d = "";
        res.on("data", (c: Buffer) => (d += c.toString()));
        res.on("end", () => {
          try {
            const r = JSON.parse(d);
            if (r.code === 0) {
              process.stdout.write(".");
              resolve({ ok: true });
            } else {
              console.error(`\n  FAIL ${label}: ${r.msg ?? "unknown"} (code: ${r.code})`);
              resolve({ ok: false, error: r.msg });
            }
          } catch {
            console.error(`\n  FAIL ${label}: invalid response`);
            resolve({ ok: false, error: "Invalid response" });
          }
        });
      });
      req.on("error", (e) => {
        console.error(`\n  FAIL ${label}: ${e.message}`);
        resolve({ ok: false, error: e.message });
      });
      req.write(body);
      req.end();
    });
  }

  // ---- Migrate Applications ----
  console.log(`\nReading applications from Airtable (${atAppsTable})...`);
  const appRecords = await fetchAllAirtableRecords(atToken, atBase, atAppsTable);
  console.log(`Found ${appRecords.length} records.`);

  // Delete existing records in Feishu application table (optional, for clean slate)
  // Skip for now — we only add new records.

  console.log("Writing to Feishu 访客申请表...");
  let appOk = 0;
  let appFail = 0;
  for (const rec of appRecords) {
    const fields: Record<string, unknown> = {};
    for (const [airtableKey, feishuKey] of Object.entries(APP_FEISHU_FIELDS)) {
      const val = rec.fields[airtableKey];
      if (val !== undefined && val !== null) {
        if (DATE_FIELDS_APPLICATIONS.has(airtableKey)) {
          const ms = toFeishuDate(val);
          if (ms !== undefined) fields[feishuKey] = ms;
        } else {
          fields[feishuKey] = val;
        }
      }
    }
    // Always set Record ID
    fields["Record ID"] = rec.id;

    const result = await writeFeishuRecord(appsTableId, fields, `App ${rec.id}`);
    if (result.ok) appOk++;
    else appFail++;
  }
  console.log(`\nApplications: ${appOk} OK, ${appFail} failed`);

  // ---- Migrate Feedback ----
  console.log(`\nReading feedback from Airtable (${atFbTable})...`);
  const fbRecords = await fetchAllAirtableRecords(atToken, atBase, atFbTable);
  console.log(`Found ${fbRecords.length} records.`);

  console.log("Writing to Feishu 访客评价表...");
  let fbOk = 0;
  let fbFail = 0;
  for (const rec of fbRecords) {
    const fields: Record<string, unknown> = {};
    for (const [airtableKey, feishuKey] of Object.entries(FB_FEISHU_FIELDS)) {
      const val = rec.fields[airtableKey];
      if (val !== undefined && val !== null) {
        if (DATE_FIELDS_FEEDBACK.has(airtableKey)) {
          const ms = toFeishuDate(val);
          if (ms !== undefined) fields[feishuKey] = ms;
        } else {
          fields[feishuKey] = val;
        }
      }
    }
    // Always set Record ID
    fields["Record ID"] = rec.id;

    const result = await writeFeishuRecord(fbTableId, fields, `FB ${rec.id}`);
    if (result.ok) fbOk++;
    else fbFail++;
  }
  console.log(`\nFeedback: ${fbOk} OK, ${fbFail} failed`);

  console.log("\nMigration complete.");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
