import fs from "fs";
import path from "path";
import { PRIVATE_DOWNLOAD_ROOT, resolveDownloadPath, type DeliveryType } from "./delivery";

// Delivery settings from the admin product form.
//
// The form used to have no delivery fields at all, and the product APIs
// ignored them, so a sellable digital product could only be created by a
// hand-written seed route and a deploy. These are validated here so the admin
// cannot publish something a buyer would pay for and then not receive.

const TYPES: DeliveryType[] = ["none", "download", "external"];

/** Files an admin can attach: everything under private/downloads except the README. */
export function listDownloadFiles(): Array<{ key: string; bytes: number }> {
  try {
    return fs
      .readdirSync(PRIVATE_DOWNLOAD_ROOT, { withFileTypes: true })
      .filter((d) => d.isFile() && !/^readme/i.test(d.name) && !d.name.startsWith("."))
      .map((d) => ({ key: d.name, bytes: fs.statSync(path.join(PRIVATE_DOWNLOAD_ROOT, d.name)).size }))
      .sort((a, b) => a.key.localeCompare(b.key));
  } catch {
    return [];
  }
}

export type DeliveryParse =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Validate the delivery fields present in `body`. `current` is the stored
 * product on an update, so a partial PATCH (say, just toggling published) is
 * checked against the whole resulting product, not only the fields sent.
 */
export function parseDeliveryFields(
  body: Record<string, unknown>,
  current?: { deliveryType: string; fileKey: string | null; externalUrl: string | null; published: boolean; digital: boolean },
): DeliveryParse {
  const data: Record<string, unknown> = {};

  if (body.deliveryType !== undefined) {
    if (!TYPES.includes(body.deliveryType as DeliveryType)) return { ok: false, error: "Unknown delivery type" };
    data.deliveryType = body.deliveryType;
  }
  if (body.fileKey !== undefined) {
    const key = body.fileKey ? String(body.fileKey).trim() : "";
    data.fileKey = key || null;
  }
  if (body.externalUrl !== undefined) {
    const url = body.externalUrl ? String(body.externalUrl).trim() : "";
    if (url) {
      let u: URL;
      try {
        u = new URL(url);
      } catch {
        return { ok: false, error: "The access link is not a valid URL" };
      }
      if (u.protocol !== "https:") return { ok: false, error: "The access link must start with https://" };
    }
    data.externalUrl = url || null;
  }
  if (body.fileName !== undefined) data.fileName = body.fileName ? String(body.fileName).slice(0, 120) : null;
  if (body.fileFormat !== undefined) data.fileFormat = body.fileFormat ? String(body.fileFormat).slice(0, 20) : null;
  if (body.downloadDays !== undefined) {
    const n = Math.round(Number(body.downloadDays));
    if (!(n >= 1 && n <= 3650)) return { ok: false, error: "Access period must be 1 to 3650 days" };
    data.downloadDays = n;
  }
  if (body.maxDownloads !== undefined) {
    const n = Math.round(Number(body.maxDownloads));
    if (!(n >= 1 && n <= 100)) return { ok: false, error: "Download limit must be 1 to 100" };
    data.maxDownloads = n;
  }

  // The product as it will be after this write.
  const type = (data.deliveryType ?? current?.deliveryType ?? "none") as DeliveryType;
  const fileKey = (data.fileKey !== undefined ? data.fileKey : current?.fileKey) as string | null;
  const externalUrl = (data.externalUrl !== undefined ? data.externalUrl : current?.externalUrl) as string | null;
  const published = body.published !== undefined ? !!body.published : !!current?.published;
  const digital = body.digital !== undefined ? body.digital !== false : current?.digital ?? true;

  if (type === "download" && fileKey) {
    const abs = resolveDownloadPath(fileKey);
    if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      return { ok: false, error: `File "${fileKey}" is not in private/downloads` };
    }
    data.fileSizeBytes = fs.statSync(abs).size;
    // A blank "file name buyers see" falls back to the file's own name.
    if (data.fileName === null || (data.fileName === undefined && !current)) data.fileName = path.basename(fileKey);
  }

  // A published digital product must deliver something: otherwise the buyer
  // pays and receives an email with no link in it.
  if (published && digital) {
    if (type === "download" && !fileKey) return { ok: false, error: "Choose the file buyers download before publishing" };
    if (type === "external" && !externalUrl) return { ok: false, error: "Add the access link before publishing" };
  }
  return { ok: true, data };
}
