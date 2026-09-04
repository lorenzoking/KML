"use client";

import { Children, useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Group, HomeSection } from "@/components/dashboard/ios";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "kml-add-to-home-done";

function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  const displayMode = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = "standalone" in window.navigator && Boolean(window.navigator.standalone);
  return displayMode || iosStandalone;
}

export function NeedsYouSection({ children }: { children?: React.ReactNode }) {
  const [homeTask, setHomeTask] = useState<"unknown" | "show" | "hide">("unknown");
  const extra = Children.toArray(children).some(Boolean);

  useEffect(() => {
    if (isStandaloneApp()) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      setHomeTask("hide");
      return;
    }
    setHomeTask(window.localStorage.getItem(STORAGE_KEY) === "1" ? "hide" : "show");
  }, []);

  if (homeTask === "hide" && !extra) return null;
  if (homeTask === "unknown" && !extra) return null;

  return (
    <HomeSection label="Needs you">
      <Group className="border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_7%,var(--surface-raised))]">
        {homeTask === "show" ? (
          <AddToHomeScreenTask onDone={() => setHomeTask("hide")} />
        ) : null}
        {children}
      </Group>
    </HomeSection>
  );
}

function AddToHomeScreenTask({ onDone }: { onDone: () => void }) {
  function markDone() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    onDone();
  }

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-[var(--primary)] text-[var(--primary-foreground)]">
          <Smartphone className="size-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-tight">
            Add KML to your Home Screen
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--muted-foreground)]">
            So it opens like an app instead of a browser tab. Check this off when
            it is on your phone.
          </p>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={false}
          aria-label="Mark add to Home Screen as done"
          onClick={markDone}
          className={cn(
            "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-transparent transition-colors",
            "hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] active:scale-[0.96]"
          )}
        />
      </div>
      <ol className="mt-3 space-y-1.5 pl-12 text-[13px] leading-snug text-[var(--foreground)]/85">
        <li>
          <span className="font-medium text-[var(--foreground)]">iPhone:</span>{" "}
          Open this site in Safari, tap Share, then Add to Home Screen.
        </li>
        <li>
          <span className="font-medium text-[var(--foreground)]">Android:</span>{" "}
          Open this site in Chrome, tap the three dots, then Add to Home screen.
        </li>
      </ol>
    </div>
  );
}
