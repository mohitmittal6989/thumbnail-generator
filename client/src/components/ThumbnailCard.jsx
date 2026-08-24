import { useState } from "react";
import { resolveThumbnailUrl } from "../utils/thumbnailUrls";

const ThumbnailCard = ({
  item,
  onDelete,
  onLike,
  showDelete = false,
  showLike = false,
  showAuthor = false
}) => {
  const [downloading, setDownloading] = useState(false);
  const thumbnailUrl = resolveThumbnailUrl(item.imageUrl);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(thumbnailUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${item.title.replace(/\s+/g, "-").toLowerCase() || "thumbnail"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden rounded-3xl">
      <img
        src={thumbnailUrl}
        alt={item.title}
        loading="lazy"
        className="h-52 w-full object-cover"
      />
      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-white">{item.title}</h3>
          {showAuthor ? (
            <p className="mt-1 text-sm text-slate-400">by {item.userId?.name || "Creator"}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">{item.style}</span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">{item.aspectRatio}</span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 capitalize">{item.mode}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-purple px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01]"
          >
            {downloading ? "Preparing..." : "Download"}
          </button>

          {showDelete ? (
            <button
              onClick={() => onDelete(item._id)}
              className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20"
            >
              Delete
            </button>
          ) : null}

          {showLike ? (
            <button
              onClick={() => onLike(item._id)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Like {item.likes || 0}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailCard;