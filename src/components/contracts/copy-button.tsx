"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  text,
  label = "Copy",
  className,
  variant = "outline",
  size = "sm",
}: {
  text: string;
  label?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
