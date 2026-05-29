import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Manual .env.local parser (no dependencies)
function loadEnvLocal() {
  const envPath = resolve(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_FEEDBACK_TABLE_NAME = process.env.AIRTABLE_FEEDBACK_TABLE_NAME;

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_FEEDBACK_TABLE_NAME) {
  console.error("Missing Airtable config. Check .env.local");
  process.exit(1);
}

const PRESET_TESTIMONIALS = [
  { name: "Dr. Sarah Chen", role: "CTO, Robotics Innovation Lab", message: "An extraordinary facility that showcases the full spectrum of robotics innovation. Our team left with actionable insights for our own R&D roadmap." },
  { name: "James Mitchell", role: "VP Engineering, AutoMotion Corp", message: "The robot operation experience was eye-opening. Seeing these systems up close gave our engineering team a new perspective on what's possible in industrial automation." },
  { name: "Emily Wang", role: "Research Director, AI Future Institute", message: "Shenzhen Robot Valley is more than a showroom — it's a living lab. The density of talent and technology here is unmatched in the region." },
  { name: "Michael Torres", role: "CEO, Precision Robotics Inc", message: "We brought our entire leadership team and everyone walked away impressed. The 3D-printed souvenir was a nice touch too." },
  { name: "Lisa Nakamura", role: "Head of Innovation, TechBridge Ventures", message: "As an investor, I need to see real capabilities, not slides. Robot Valley delivered — tangible demos, real robots, clear value." },
  { name: "David Park", role: "Managing Partner, Future Factory Fund", message: "The integration of AI, hardware, and manufacturing under one roof makes this a must-visit for anyone serious about the future of robotics." },
  { name: "Anna Johansson", role: "Director, Nordic Automation Alliance", message: "We traveled from Europe specifically to visit Robot Valley and it exceeded our expectations. The ecosystem density is remarkable." },
  { name: "Robert Kim", role: "Chief Scientist, Smart Manufacturing Lab", message: "A world-class facility that bridges the gap between research and commercialization. We’re already planning our next visit." },
];

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_FEEDBACK_TABLE_NAME)}`;

async function main() {
  console.log("Fetching existing records to check for duplicates...");
  const listRes = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });
  const listBody = await listRes.json() as { records?: Array<{ fields: Record<string, unknown> }> };

  const existingNames = new Set(
    (listBody.records ?? []).map((r) => String(r.fields["Name"] ?? ""))
  );

  const toInsert = PRESET_TESTIMONIALS.filter((t) => !existingNames.has(t.name));

  if (toInsert.length === 0) {
    console.log("All preset testimonials already exist. Nothing to seed.");
    return;
  }

  console.log(`Seeding ${toInsert.length} preset testimonials...`);

  let inserted = 0;
  for (const t of toInsert) {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: t.name,
              Role: t.role,
              Message: t.message,
              Status: "Approved",
              Featured: true,
              SubmittedAt: new Date().toISOString(),
            },
          },
        ],
        typecast: true,
      }),
    });

    if (res.ok) {
      inserted++;
      console.log(`  ✓ ${t.name}`);
    } else {
      const err = await res.text();
      console.error(`  ✗ ${t.name}: ${res.status} ${err.slice(0, 200)}`);
    }
  }

  console.log(`Done. Inserted ${inserted}/${toInsert.length} testimonials.`);
}

main().catch(console.error);
