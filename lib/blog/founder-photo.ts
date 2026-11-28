// The founder's portrait (public/tb_cover.png), used as the cover of his
// personal AI Times articles. Chosen per article in the admin ("Use my
// photo"); the news job never replaces it (app/api/blog/auto-refresh).

export const FOUNDER_PHOTO = "/tb_cover.png";

/** True for the portrait, stored as a site path or as a full tiblogics.com URL. */
export function isFounderPhoto(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^(?:https?:\/\/(?:www\.)?tiblogics\.com)?\/tb_cover\.png(?:[?#].*)?$/i.test(url.trim());
}
