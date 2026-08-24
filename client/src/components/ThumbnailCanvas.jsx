import React, { useEffect, useRef, useState } from "react";
import { fontOptions, badgePresets } from "../utils/constants";

const ThumbnailCanvas = ({
  imageUrl,
  title = "",
  initialHeadline = "",
  initialBadge = "🔥 10X",
  aspectRatio = "16:9"
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Overlay state
  const [headline, setHeadline] = useState(initialHeadline || "VIRAL SECRETS");
  const [showHeadline, setShowHeadline] = useState(true);
  const [fontFamily, setFontFamily] = useState("Impact, sans-serif");
  const [textColor, setTextColor] = useState("#fde047"); // High-CTR yellow
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [textPosition, setTextPosition] = useState("top-left");
  const [textRotation, setTextRotation] = useState(-3);

  // Badge state
  const [badge, setBadge] = useState(initialBadge || "🔥 10X");
  const [showBadge, setShowBadge] = useState(true);
  const [badgePosition, setBadgePosition] = useState("top-right");

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    if (initialHeadline) setHeadline(initialHeadline);
    if (initialBadge) setBadge(initialBadge);
  }, [imageUrl, initialHeadline, initialBadge]);

  // Position class mappings for CSS overlay
  const getHeadlinePositionClasses = () => {
    switch (textPosition) {
      case "top-right":
        return "top-6 right-6 text-right items-end";
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center items-center";
      case "bottom-left":
        return "bottom-6 left-6 text-left items-start";
      case "bottom-right":
        return "bottom-6 right-6 text-right items-end";
      case "top-left":
      default:
        return "top-6 left-6 text-left items-start";
    }
  };

  const getBadgePositionClasses = () => {
    switch (badgePosition) {
      case "top-left":
        return "top-6 left-6";
      case "bottom-left":
        return "bottom-6 left-6";
      case "bottom-right":
        return "bottom-6 right-6";
      case "top-right":
      default:
        return "top-6 right-6";
    }
  };

  // High-Resolution 1280x720 Canvas Composite Download
  const handleDownloadComposite = async () => {
    if (!imageUrl) return;
    setDownloading(true);

    try {
      const canvas = document.createElement("canvas");
      const width = aspectRatio === "1:1" ? 1080 : aspectRatio === "9:16" ? 900 : 1280;
      const height = aspectRatio === "1:1" ? 1080 : aspectRatio === "9:16" ? 1600 : 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          // If crossOrigin fails, retry with direct load
          const fallbackImg = new Image();
          fallbackImg.src = imageUrl;
          fallbackImg.onload = resolve;
          fallbackImg.onerror = reject;
        };
      });

      // 1. Draw Background Image
      ctx.drawImage(img, 0, 0, width, height);

      // Subtle top/bottom contrast gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.4)");
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Badge
      if (showBadge && badge && badge !== "None") {
        ctx.save();
        const badgeFontSize = Math.max(28, Math.round(width * 0.026));
        ctx.font = `900 ${badgeFontSize}px ${fontFamily}`;
        const badgeText = badge.toUpperCase();
        const textMetrics = ctx.measureText(badgeText);
        const padX = 22;
        const padY = 12;
        const bWidth = textMetrics.width + padX * 2;
        const bHeight = badgeFontSize + padY * 2;

        let bX = 40;
        let bY = 40;
        if (badgePosition === "top-right") bX = width - bWidth - 40;
        if (badgePosition === "bottom-left") bY = height - bHeight - 40;
        if (badgePosition === "bottom-right") bX = width - bWidth - 40;

        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bWidth, bHeight, 14);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(badgeText, bX + bWidth / 2, bY + bHeight / 2 + 2);
        ctx.restore();
      }

      // 3. Draw Headline Text
      if (showHeadline && headline.trim()) {
        ctx.save();
        const baseFontSize = Math.round(width * 0.062);
        ctx.font = `900 ${baseFontSize}px ${fontFamily}`;
        ctx.textBaseline = "middle";

        const lines = headline.split("\n").filter(Boolean);
        let anchorX = 60;
        let anchorY = 140;

        if (textPosition === "top-right") {
          anchorX = width - 60;
          ctx.textAlign = "right";
        } else if (textPosition === "center") {
          anchorX = width / 2;
          anchorY = height / 2;
          ctx.textAlign = "center";
        } else if (textPosition === "bottom-left") {
          anchorX = 60;
          anchorY = height - lines.length * (baseFontSize * 1.15) - 40;
          ctx.textAlign = "left";
        } else if (textPosition === "bottom-right") {
          anchorX = width - 60;
          anchorY = height - lines.length * (baseFontSize * 1.15) - 40;
          ctx.textAlign = "right";
        } else {
          ctx.textAlign = "left";
        }

        ctx.translate(anchorX, anchorY);
        ctx.rotate((textRotation * Math.PI) / 180);

        lines.forEach((line, index) => {
          const lineY = index * (baseFontSize * 1.12);

          // Outline & Shadow
          ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
          ctx.lineWidth = 12;
          ctx.lineJoin = "round";
          ctx.strokeStyle = strokeColor;
          ctx.strokeText(line, 0, lineY);

          // Text Fill
          ctx.shadowColor = "transparent";
          ctx.fillStyle = textColor;
          ctx.fillText(line, 0, lineY);
        });

        ctx.restore();
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.download = `${(headline || title || "youtube-thumbnail").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // Fallback direct download
      const link = document.createElement("a");
      link.download = `${(title || "thumbnail").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.jpg`;
      link.href = imageUrl;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Thumbnail Preview Container */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950 shadow-2xl group select-none">
        {/* Loading Spinner */}
        {!imageLoaded && !imageError && (
          <div className="flex aspect-video w-full flex-col items-center justify-center bg-slate-900/90 p-8 text-center space-y-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-pink border-t-transparent"></div>
            <p className="text-sm font-medium text-slate-300">Loading High-Res Image...</p>
          </div>
        )}

        {/* Error Fallback */}
        {imageError && (
          <div className="flex aspect-video w-full flex-col items-center justify-center bg-slate-900 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-rose-400">Failed to render image preview</p>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-pink underline"
            >
              Open direct image link
            </a>
          </div>
        )}

        {/* Base Image */}
        <img
          src={imageUrl}
          alt={title}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full aspect-video object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
          }`}
        />

        {/* Overlay Layers (Active once image loads) */}
        {imageLoaded && (
          <div className="absolute inset-0 pointer-events-none p-6">
            {/* 1. Badge Overlay */}
            {showBadge && badge && badge !== "None" && (
              <div className={`absolute ${getBadgePositionClasses()} z-20`}>
                <span className="inline-block rounded-xl bg-red-600 px-3.5 py-1.5 text-xs sm:text-sm font-black text-white shadow-xl border-2 border-white uppercase tracking-wider">
                  {badge}
                </span>
              </div>
            )}

            {/* 2. Viral Headline Typography Overlay */}
            {showHeadline && headline.trim() && (
              <div
                className={`absolute ${getHeadlinePositionClasses()} z-10 max-w-[85%]`}
                style={{
                  transform: `rotate(${textRotation}deg)`,
                  fontFamily: fontFamily
                }}
              >
                {headline.split("\n").map((line, i) => (
                  <p
                    key={i}
                    className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight select-none"
                    style={{
                      color: textColor,
                      WebkitTextStroke: `3px ${strokeColor}`,
                      textShadow: "4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 0 8px 24px rgba(0,0,0,0.9)"
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Download Button */}
      <button
        type="button"
        onClick={handleDownloadComposite}
        disabled={downloading || !imageLoaded}
        className="w-full rounded-2xl bg-gradient-to-r from-brand-pink via-purple-600 to-brand-purple px-6 py-4 text-base font-black text-white shadow-xl shadow-brand-pink/25 hover:scale-[1.01] hover:shadow-brand-pink/40 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2.5"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {downloading ? "Preparing Master HD Thumbnail..." : "Download Ready-to-Publish Thumbnail (HD)"}
      </button>

      {/* Live Customizer Controls */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-pink flex items-center gap-2">
            <span>🎨</span> Headline & Badge Customizer
          </span>
          <span className="text-[11px] text-slate-400">Live preview on thumbnail</span>
        </div>

        {/* 1. Headline Text */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200">Headline Text (Auto-Generated)</label>
            <button
              type="button"
              onClick={() => setShowHeadline(!showHeadline)}
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition ${
                showHeadline ? "bg-brand-pink/20 text-brand-pink border border-brand-pink/40" : "bg-white/5 text-slate-400"
              }`}
            >
              {showHeadline ? "Visible" : "Hidden"}
            </button>
          </div>

          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. DON'T DO THIS!"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-bold text-white placeholder-slate-500 outline-none focus:border-brand-pink/50"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <span className="text-slate-400 block mb-1">Font</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-white/10 px-2 py-1.5 text-white outline-none"
              >
                {fontOptions.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="text-slate-300 font-mono text-[11px]">{textColor}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Position</span>
              <select
                value={textPosition}
                onChange={(e) => setTextPosition(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-white/10 px-2 py-1.5 text-white outline-none"
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="center">Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Tilt ({textRotation}°)</span>
              <input
                type="range"
                min="-15"
                max="15"
                value={textRotation}
                onChange={(e) => setTextRotation(Number(e.target.value))}
                className="w-full accent-brand-pink mt-1"
              />
            </div>
          </div>
        </div>

        {/* 2. Badge Presets */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200">Graphic Sticker / Badge</label>
            <button
              type="button"
              onClick={() => setShowBadge(!showBadge)}
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition ${
                showBadge ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40" : "bg-white/5 text-slate-400"
              }`}
            >
              {showBadge ? "Visible" : "Hidden"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {badgePresets.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBadge(b)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  badge === b
                    ? "bg-red-500 text-white shadow-md shadow-red-500/30 scale-105"
                    : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailCanvas;
