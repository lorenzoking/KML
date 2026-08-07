import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const ASSETS = {
  mark: "/brand/kml-transparent.png",
  icon: "/brand/kml-icon.png",
} as const;

export function BrandLogo({
  className,
  priority = false,
  size = "md",
  variant = "mark",
}: {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
  /** `mark` = transparent crest for UI; `icon` = app/favicon graphic */
  variant?: keyof typeof ASSETS;
}) {
  const dims =
    size === "sm"
      ? { width: 44, height: 44, className: "h-9 w-9" }
      : size === "lg"
        ? { width: 160, height: 160, className: "h-24 w-24 sm:h-28 sm:w-28" }
        : size === "hero"
          ? { width: 720, height: 720, className: "h-auto w-full max-w-xl" }
          : { width: 64, height: 64, className: "h-11 w-11" };

  return (
    <Image
      src={ASSETS[variant]}
      alt={APP_NAME}
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={cn("object-contain", dims.className, className)}
    />
  );
}
