import { getCategoryStyle, type CompanyCategoryKey } from "@/data/companies";

export function getMarkerContent({
  categoryKey,
  label,
  selected,
  hovered = false,
}: {
  categoryKey?: CompanyCategoryKey | string | null;
  label?: string | null;
  selected: boolean;
  hovered?: boolean;
}) {
  const style = getCategoryStyle(categoryKey);
  const safeLabel = label?.trim() || "Company marker";

  return [
    `<button class="marker-pin"`,
    `data-active="${selected}"`,
    `data-hovered="${hovered}"`,
    `aria-label="${escapeHtml(safeLabel)}"`,
    `style="--marker-color: ${style.color};"`,
    "></button>",
  ].join(" ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
