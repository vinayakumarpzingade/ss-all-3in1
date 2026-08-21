/**
 * Turns any supported lesson video link into an embeddable URL so the video is
 * always played inside StartSafe — students are never redirected to YouTube,
 * Vimeo or Drive.
 */
export function toEmbedUrl(raw: string | null | undefined): { src: string; kind: "iframe" | "file" } | null {
  if (!raw) return null;
  const url = raw.trim();
  if (!url) return null;

  if (/\.(mp4|webm|ogg|m4v)(\?|$)/i.test(url)) return { src: url, kind: "file" };

  const yt =
    url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/i);
  if (yt?.[1]) {
    return {
      src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&playsinline=1`,
      kind: "iframe",
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo?.[1]) return { src: `https://player.vimeo.com/video/${vimeo[1]}`, kind: "iframe" };

  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/i);
  if (drive?.[1]) return { src: `https://drive.google.com/file/d/${drive[1]}/preview`, kind: "iframe" };

  // Already an embed/player URL
  if (/^https?:\/\//i.test(url)) return { src: url, kind: "iframe" };
  return null;
}

/** Extracts the first URL found in a markdown/plain-text block. */
export function firstUrl(text: string | null | undefined) {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s)\]]+/);
  return match ? match[0] : null;
}
