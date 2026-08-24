import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { aspectRatios, palettes, styles, sampleTopics, creatorTemplates, aiEngines } from "../utils/constants";
import { resolveThumbnailUrl } from "../utils/thumbnailUrls";
import ThumbnailCanvas from "../components/ThumbnailCanvas";

const defaultGenerateState = {
  title: "",
  aspectRatio: "16:9",
  style: "Bold",
  templatePreset: "High-Energy Challenge",
  selectedModel: "gemini",
  colors: palettes[0],
  prompt: "",
  sourceImage: ""
};

const defaultRecreateState = {
  title: "",
  aspectRatio: "16:9",
  style: "Cinematic",
  templatePreset: "Minimal & Clean",
  selectedModel: "gemini",
  colors: palettes[1],
  sourceImage: "",
  changeRequest: ""
};

const Generate = ({ setToast }) => {
  const { updateCredits } = useAuth();
  const [activeTab, setActiveTab] = useState("generate");
  const [generateForm, setGenerateForm] = useState(defaultGenerateState);
  const [recreateForm, setRecreateForm] = useState(defaultRecreateState);
  const [preview, setPreview] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!preview?.imageUrl) {
      setPreviewSrc("");
      return;
    }
    setPreviewSrc(resolveThumbnailUrl(preview.imageUrl));
  }, [preview]);

  const handleSubjectUpload = (tab, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Please upload an image file (PNG, JPG, WEBP)" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setToast({ type: "error", message: "Image size should be under 8MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (tab === "generate") {
        setGenerateForm((prev) => ({ ...prev, sourceImage: dataUrl }));
      } else {
        setRecreateForm((prev) => ({ ...prev, sourceImage: dataUrl }));
      }
      setToast({ type: "success", message: "Subject image uploaded! AI will smartly swap the subject." });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSubject = (tab) => {
    if (tab === "generate") {
      setGenerateForm((prev) => ({ ...prev, sourceImage: "" }));
    } else {
      setRecreateForm((prev) => ({ ...prev, sourceImage: "" }));
    }
  };

  const handleColorSelect = (tab, palette) => {
    if (tab === "generate") {
      setGenerateForm({ ...generateForm, colors: palette });
      return;
    }
    setRecreateForm({ ...recreateForm, colors: palette });
  };

  const applySampleTopic = (sample) => {
    setGenerateForm({
      ...generateForm,
      title: sample.title,
      style: sample.style,
      aspectRatio: sample.ratio
    });
  };

  const handleGenerate = async (event) => {
    if (event) event.preventDefault();
    if (!generateForm.title.trim()) {
      setToast({ type: "error", message: "Please enter your video topic" });
      return;
    }
    setLoading(true);

    try {
      const data = await api.generateThumbnail({
        ...generateForm,
        mode: "generate"
      });
      setPreview(data.thumbnail);
      updateCredits(data.credits);
      setToast({ type: "success", message: "Thumbnail generated successfully!" });
    } catch (error) {
      setToast({ type: "error", message: error.message || "Generation failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleRecreate = async (event) => {
    if (event) event.preventDefault();
    if (!recreateForm.title.trim()) {
      setToast({ type: "error", message: "Please enter the topic to recreate" });
      return;
    }
    setLoading(true);

    try {
      const data = await api.generateThumbnail({
        ...recreateForm,
        prompt: recreateForm.changeRequest,
        mode: "recreate"
      });
      setPreview(data.thumbnail);
      updateCredits(data.credits);
      setToast({ type: "success", message: "Thumbnail recreated successfully!" });
    } catch (error) {
      setToast({ type: "error", message: error.message || "Recreation failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!preview?.prompt) return;
    navigator.clipboard.writeText(preview.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setToast({ type: "success", message: "Prompt copied to clipboard!" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-pink font-bold">Thumbnail Studio</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-black text-white">AI YouTube Thumbnail Generator</h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("generate")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              activeTab === "generate"
                ? "bg-gradient-to-r from-brand-pink to-brand-purple text-white shadow-lg shadow-brand-pink/25"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Create New
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recreate")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              activeTab === "recreate"
                ? "bg-gradient-to-r from-brand-pink to-brand-purple text-white shadow-lg shadow-brand-pink/25"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Recreate & Remix
          </button>
        </div>
      </div>

      {/* Spacious 2-Column Grid */}
      <div className="grid gap-10 lg:grid-cols-[1fr,1.05fr] items-start">
        {/* Left Column: Form Controls */}
        <div className="glass-card rounded-[32px] p-7 sm:p-8 space-y-7 border border-white/10">
          {activeTab === "generate" ? (
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Step 1: Video Title */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-white">1. Video Title / Topic</label>
                  <span className="text-xs text-slate-400">Quick inspiration below</span>
                </div>
                <input
                  value={generateForm.title}
                  onChange={(e) => setGenerateForm({ ...generateForm, title: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 outline-none transition focus:border-brand-pink focus:bg-white/10 font-medium text-base"
                  placeholder="e.g. 10 Habits That Made Me a Millionaire"
                  required
                />

                {/* Inspiration Topic Pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {sampleTopics.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applySampleTopic(sample)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-brand-pink/50 hover:bg-brand-pink/10 hover:text-white transition"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Thumbnail Template Preset */}
              <div>
                <label className="mb-2.5 block text-sm font-bold text-white">2. Thumbnail Style Template</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {creatorTemplates.map((tpl) => {
                    const isSelected = generateForm.templatePreset === tpl.id;
                    return (
                      <button
                        type="button"
                        key={tpl.id}
                        onClick={() => setGenerateForm({ ...generateForm, templatePreset: tpl.id })}
                        className={`rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? "border-brand-pink bg-brand-pink/15 ring-2 ring-brand-pink/50 text-white shadow-lg shadow-brand-pink/20"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        <p className="text-xs font-bold truncate">{tpl.label}</p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{tpl.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Visual Style & Aspect Ratio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-white">3. Art Style</label>
                  <select
                    value={generateForm.style}
                    onChange={(e) => setGenerateForm({ ...generateForm, style: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-pink text-sm font-medium"
                  >
                    {styles.map((style) => (
                      <option key={style} value={style} className="bg-slate-900 text-white">
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-white">4. Aspect Ratio</label>
                  <select
                    value={generateForm.aspectRatio}
                    onChange={(e) => setGenerateForm({ ...generateForm, aspectRatio: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-pink text-sm font-medium"
                  >
                    {aspectRatios.map((ratio) => (
                      <option key={ratio} value={ratio} className="bg-slate-900 text-white">
                        {ratio} {ratio === "16:9" ? "(YouTube)" : ratio === "9:16" ? "(Shorts/Reels)" : "(Square)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 4: Color Mood */}
              <div>
                <label className="mb-2 block text-sm font-bold text-white">5. Color Palette / Accents</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {palettes.map((palette) => {
                    const key = palette.join("-");
                    const isSelected = generateForm.colors.join("-") === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleColorSelect("generate", palette)}
                        className={`rounded-xl border p-2 transition flex justify-center items-center ${
                          isSelected
                            ? "border-brand-pink bg-brand-pink/20 ring-2 ring-brand-pink/50 shadow-md shadow-brand-pink/30"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex gap-1">
                          {palette.map((color) => (
                            <span
                              key={color}
                              className="h-4 w-4 rounded-full shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 5: Exact Visual Scene Description */}
              <div>
                <label className="mb-2 block text-sm font-bold text-white">5. Visual Scene Description (Exact subjects, props & action)</label>
                <textarea
                  rows={2}
                  value={generateForm.prompt}
                  onChange={(e) => setGenerateForm({ ...generateForm, prompt: e.target.value })}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-brand-pink focus:bg-white/10 text-sm font-medium"
                  placeholder="e.g. A developer in grey hoodie staring in shock at 3 glowing monitors with red error codes, messy desk with coffee cups"
                />
              </div>

              {/* Step 6: Custom Subject / Face Photo (Smart Subject Replacement) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>👤</span> Upload Subject / Face (Smart Subject Swap)
                  </label>
                  <span className="text-[10px] font-bold text-brand-pink bg-brand-pink/10 px-2.5 py-0.5 rounded-full border border-brand-pink/30">
                    Optional
                  </span>
                </div>

                {generateForm.sourceImage ? (
                  <div className="flex items-center gap-3.5 rounded-2xl border border-brand-pink/40 bg-brand-pink/10 p-3 shadow-md shadow-brand-pink/10">
                    <img
                      src={generateForm.sourceImage}
                      alt="Uploaded subject"
                      className="h-14 w-14 rounded-xl object-cover border border-white/20 shadow-md flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Custom Subject Active</span>
                        <span className="text-[10px] bg-brand-pink/30 text-brand-pink px-2 py-0.2 rounded-full font-bold">READY</span>
                      </div>
                      <p className="text-[11px] text-brand-pink font-medium mt-0.5">
                        AI will smartly replace the main focal character with this person/subject
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject("generate")}
                      className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition flex-shrink-0"
                      title="Remove uploaded subject"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/5 p-4 text-center cursor-pointer hover:border-brand-pink/50 hover:bg-white/10 transition group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSubjectUpload("generate", e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-brand-pink group-hover:border-brand-pink/40 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white group-hover:text-brand-pink transition">
                          Click to upload your face or subject image
                        </p>
                        <p className="text-[11px] text-slate-400">
                          PNG, JPG, or WEBP • AI replaces the main thumbnail character with your likeness
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* Step 7: AI Generation Engine */}
              <div>
                <label className="mb-2 block text-sm font-bold text-white">7. AI Generation Engine</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiEngines.map((engine) => {
                    const isSelected = (generateForm.selectedModel || "gemini") === engine.id;
                    return (
                      <button
                        type="button"
                        key={engine.id}
                        onClick={() => setGenerateForm({ ...generateForm, selectedModel: engine.id })}
                        className={`rounded-2xl border p-3.5 text-left transition ${
                          isSelected
                            ? "border-brand-cyan bg-brand-cyan/15 ring-2 ring-brand-cyan/50 text-white shadow-lg shadow-brand-cyan/20"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">{engine.label}</p>
                          
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{engine.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-brand-pink via-purple-600 to-brand-purple px-6 py-4 font-black text-white shadow-xl shadow-brand-pink/25 hover:scale-[1.01] hover:shadow-brand-pink/40 active:scale-[0.99] transition disabled:opacity-60 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2.5">
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Studio Thumbnail...
                  </span>
                ) : (
                  "⚡ Generate Studio Thumbnail"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecreate} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-white">Video Topic / Title</label>
                <input
                  value={recreateForm.title}
                  onChange={(e) => setRecreateForm({ ...recreateForm, title: e.target.value })}
                  placeholder="e.g. How I Built a 7-Figure Business"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-brand-pink text-base"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white">Reference Image / Custom Subject</label>
                  <span className="text-[11px] text-slate-400">Upload or URL</span>
                </div>

                {recreateForm.sourceImage && recreateForm.sourceImage.startsWith("data:") ? (
                  <div className="flex items-center gap-3.5 rounded-2xl border border-brand-pink/40 bg-brand-pink/10 p-3 mb-2">
                    <img
                      src={recreateForm.sourceImage}
                      alt="Uploaded reference"
                      className="h-14 w-14 rounded-xl object-cover border border-white/20 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white">Custom Subject Photo Attached</p>
                      <p className="text-[11px] text-brand-pink">AI will use this image for smart replacement</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject("recreate")}
                      className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/5 p-3 text-center cursor-pointer hover:border-brand-pink/50 hover:bg-white/10 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSubjectUpload("recreate", e.target.files?.[0])}
                        className="hidden"
                      />
                      <span className="text-xs font-semibold text-slate-300 hover:text-white">
                        📁 Click to upload local photo file
                      </span>
                    </label>
                    <input
                      value={recreateForm.sourceImage.startsWith("data:") ? "" : recreateForm.sourceImage}
                      onChange={(e) => setRecreateForm({ ...recreateForm, sourceImage: e.target.value })}
                      placeholder="Or paste reference image URL"
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-brand-pink text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white">What To Improve / Change</label>
                <input
                  value={recreateForm.changeRequest}
                  onChange={(e) => setRecreateForm({ ...recreateForm, changeRequest: e.target.value })}
                  placeholder="e.g. Make the subject expression more dramatic, boost contrast"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-brand-pink text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-white">Aspect Ratio</label>
                  <select
                    value={recreateForm.aspectRatio}
                    onChange={(e) => setRecreateForm({ ...recreateForm, aspectRatio: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-pink text-sm"
                  >
                    {aspectRatios.map((r) => (
                      <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-white">Style</label>
                  <select
                    value={recreateForm.style}
                    onChange={(e) => setRecreateForm({ ...recreateForm, style: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-pink text-sm"
                  >
                    {styles.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Generation Engine for Recreate */}
              <div>
                <label className="mb-2 block text-sm font-bold text-white">AI Generation Engine</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiEngines.map((engine) => {
                    const isSelected = (recreateForm.selectedModel || "gemini") === engine.id;
                    return (
                      <button
                        type="button"
                        key={engine.id}
                        onClick={() => setRecreateForm({ ...recreateForm, selectedModel: engine.id })}
                        className={`rounded-2xl border p-3 text-left transition ${
                          isSelected
                            ? "border-brand-cyan bg-brand-cyan/15 ring-2 ring-brand-cyan/50 text-white shadow-lg"
                            : "border-white/10 bg-white/5 hover:border-white/20 text-slate-300"
                        }`}
                      >
                        <p className="text-xs font-bold text-white">{engine.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{engine.tag}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-brand-pink to-brand-purple px-6 py-4 font-black text-white shadow-xl shadow-brand-pink/25 hover:scale-[1.01] transition disabled:opacity-60 text-base"
              >
                {loading ? "Recreating..." : "⚡ Recreate & Enhance Thumbnail"}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Live Studio Preview */}
        <div className="glass-card rounded-[32px] p-7 sm:p-8 space-y-6 border border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-cyan">Live Studio Preview</p>
            <div className="flex items-center gap-2">
              {preview?.selectedModel && (
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-300">
                  {preview.selectedModel === "flux" ? "⚡ Flux Pro Studio" : "✨ Google Gemini AI"}
                </span>
              )}
              {preview?.templatePreset && (
                <span className="rounded-full bg-brand-purple/20 border border-brand-purple/40 px-3 py-1 text-xs font-bold text-brand-pink">
                  {preview.templatePreset}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[340px]">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-pink border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-brand-purple/60"></div>
                </div>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className="font-bold text-white text-base">Researching Web & Designing Thumbnail...</p>
                <p className="text-xs text-brand-cyan animate-pulse">Extracting authentic hallmarks, setting & lighting</p>
                <p className="text-[11px] text-slate-400">Rendering high-impact studio visuals with AI</p>
              </div>
            </div>
          ) : preview ? (
            <ThumbnailCanvas
              imageUrl={previewSrc}
              title={preview.title}
              initialHeadline={preview.headlineText}
              initialBadge={preview.badgeText || "🔥 10X"}
              aspectRatio={preview.aspectRatio || "16:9"}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-14 text-center text-slate-400 space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 min-h-[340px]">
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-base font-bold text-white">Your thumbnail preview will appear here.</p>
                <p className="text-xs text-slate-400 leading-relaxed">Enter your video topic on the left, pick a template style, and click Generate.</p>
              </div>
            </div>
          )}

          {/* Prompt Footer */}
          {preview && (
            <div className="space-y-3 pt-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Visual Prompt</p>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="text-xs text-brand-cyan hover:underline"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-mono">
                  {preview.prompt}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate;