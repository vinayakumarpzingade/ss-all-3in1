import { useEffect, useRef, useState } from "react";
import { toEmbedUrl } from "@/lib/video";
import { AlertTriangle } from "lucide-react";

/**
 * Plays lesson videos inside StartSafe. YouTube / Vimeo / Drive links are
 * converted into embeds, direct files use the native player. There is no
 * external link out, so students stay inside the platform.
 */
export function VideoPlayer({
  url,
  title,
  onWatched,
  watchSeconds = 20,
}: {
  url: string | null | undefined;
  title?: string;
  /** Fires once the learner has kept the video open long enough to count. */
  onWatched?: () => void;
  watchSeconds?: number;
}) {
  const embed = toEmbedUrl(url);
  const [counted, setCounted] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!embed || !onWatched || firedRef.current) return;
    const id = window.setTimeout(() => {
      firedRef.current = true;
      setCounted(true);
      onWatched();
    }, watchSeconds * 1000);
    return () => window.clearTimeout(id);
  }, [embed, onWatched, watchSeconds]);

  if (!embed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        <AlertTriangle className="size-4" />
        No video has been attached to this lesson yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {embed.kind === "file" ? (
          <video src={embed.src} controls className="size-full" title={title ?? "Lesson video"} />
        ) : (
          <iframe
            src={embed.src}
            title={title ?? "Lesson video"}
            className="size-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
      {onWatched ? (
        <p className="text-xs text-muted-foreground">
          {counted ? "Watch time recorded." : `Keep watching to record this lesson (${watchSeconds}s minimum).`}
        </p>
      ) : null}
    </div>
  );
}
