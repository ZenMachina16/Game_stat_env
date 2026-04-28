"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const BACKEND_URL = API_URL.replace(/\/api$/, "");

type Props = {
  playerId: string | null;
  playerName: string;
  currentImage: string | null;
};

export default function PhotoUpload({ playerId, playerName, currentImage }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(
    currentImage ? resolveImageUrl(currentImage) : null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function resolveImageUrl(src: string) {
    if (src.startsWith("http")) return src;
    return `${BACKEND_URL}${src}`;
  }

  const initials = playerName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!playerId) {
      setError("This player has no database record yet. Add them via the Manage Players page first.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const r = await fetch(`${API_URL}/players/${playerId}/upload-photo`, {
        method: "POST",
        body: formData
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Upload failed");

      setImgSrc(resolveImageUrl(data.profileImage));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="group relative flex-shrink-0">
      {/* Photo circle */}
      <div
        className="relative h-32 w-32 cursor-pointer overflow-hidden rounded-3xl bg-white/10 shadow-panel ring-4 ring-white/20 transition hover:ring-brand-gold sm:h-40 sm:w-40"
        onClick={() => inputRef.current?.click()}
        title="Click to upload photo"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={playerName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-5xl font-black text-white/80">
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[11px] font-semibold text-white">
                {imgSrc ? "Change" : "Upload"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Status badge */}
      {success && (
        <div className="absolute -bottom-2 -right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          Saved ✓
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-red-500 px-3 py-2 text-xs text-white shadow-panel">
          {error}
        </div>
      )}
    </div>
  );
}
