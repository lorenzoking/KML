"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function StoryLightboxImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  previewClassName,
  className,
  caption,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  previewClassName?: string;
  className?: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative block w-full cursor-zoom-in text-left",
          fill ? "h-full" : undefined,
          className
        )}
        aria-label={`View full graphic: ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          priority={priority}
          sizes={sizes}
          className={previewClassName}
        />
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white opacity-90 group-hover:opacity-100">
          View full graphic
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80"
          >
            Close
          </button>
          <div
            className="relative h-full w-full max-h-[92vh] max-w-[1400px]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
          {caption ? (
            <p className="absolute bottom-4 left-1/2 max-w-3xl -translate-x-1/2 px-3 text-center text-xs text-white/80">
              {caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
