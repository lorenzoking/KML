import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  linkifyCoachMentions,
  type CoachStoryLink,
} from "@/lib/coach/story-links";
import { StoryLightboxImage } from "@/components/stories/story-lightbox-image";

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; src: string; alt: string };

const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/;

/** Pull the first markdown image from a story body for card/hero use. */
export function extractStoryCoverImage(body: string): { src: string; alt: string } | null {
  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const match = raw.trim().match(IMAGE_LINE_RE);
    if (match) return { alt: match[1] || "Story image", src: match[2] };
  }
  return null;
}

function parseInline(text: string, coaches: CoachStoryLink[] = []): ReactNode[] {
  const linked = linkifyCoachMentions(text, coaches);
  const tokenRe = /(\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of linked.matchAll(tokenRe)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push(<span key={key++}>{linked.slice(cursor, start)}</span>);
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-[var(--foreground)]">
          {parseInline(token.slice(2, -2), [])}
        </strong>
      );
    } else {
      const label = match[2] ?? token;
      const href = match[3] ?? "";
      const isInternal = href.startsWith("/");
      const className =
        "font-medium text-[var(--primary)] underline underline-offset-2 hover:text-[var(--foreground)]";
      nodes.push(
        isInternal ? (
          <Link key={key++} href={href} className={className}>
            {parseInline(label, [])}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noreferrer"
            className={className}
          >
            {parseInline(label, [])}
          </a>
        )
      );
    }

    cursor = start + token.length;
  }

  if (cursor < linked.length) {
    nodes.push(<span key={key++}>{linked.slice(cursor)}</span>);
  }

  return nodes;
}

function parseStoryBody(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let ordered = false;
  let tableRows: string[][] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: "list", ordered, items: listItems });
    listItems = [];
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const [headers, ...rows] = tableRows;
    blocks.push({ type: "table", headers, rows });
    tableRows = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push({ type: "heading", text: trimmed.slice(4).trim() });
      continue;
    }

    const imageMatch = trimmed.match(IMAGE_LINE_RE);
    if (imageMatch) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push({
        type: "image",
        alt: imageMatch[1] || "Story image",
        src: imageMatch[2],
      });
      continue;
    }

    if (trimmed.startsWith("|")) {
      flushParagraph();
      flushList();
      const cells = trimmed
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      // Skip markdown separator rows like |---|---|
      if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
      tableRows.push(cells);
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (orderedMatch || bulletMatch) {
      flushParagraph();
      flushTable();
      const nextOrdered = Boolean(orderedMatch);
      if (listItems.length && nextOrdered !== ordered) flushList();
      ordered = nextOrdered;
      listItems.push(orderedMatch ? orderedMatch[2] : bulletMatch![1]);
      continue;
    }

    flushList();
    flushTable();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushTable();
  return blocks;
}

export function StoryBody({
  body,
  className,
  omitFirstImage = false,
  coachLinks = [],
}: {
  body: string;
  className?: string;
  /** Hide the first image when a cover/hero already renders it. */
  omitFirstImage?: boolean;
  /** Live coach profile links used to auto-link names in copy. */
  coachLinks?: CoachStoryLink[];
}) {
  const blocks = parseStoryBody(body);
  let skippedFirstImage = false;

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, idx) => {
        if (omitFirstImage && block.type === "image" && !skippedFirstImage) {
          skippedFirstImage = true;
          return null;
        }
        if (block.type === "heading") {
          return (
            <h3
              key={idx}
              className="pt-2 font-[family-name:var(--font-display)] text-lg font-semibold uppercase tracking-[0.04em] text-[var(--foreground)]"
            >
              {parseInline(block.text, coachLinks)}
            </h3>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p
              key={idx}
              className="max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-[15px]"
            >
              {parseInline(block.text, coachLinks)}
            </p>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={idx}
              className={cn(
                "max-w-3xl space-y-1.5 text-sm text-[var(--muted-foreground)] sm:text-[15px]",
                block.ordered ? "list-decimal pl-5" : "list-disc pl-5"
              )}
            >
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {parseInline(item, coachLinks)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "image") {
          return (
            <figure
              key={idx}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--muted)_40%,transparent)]"
            >
              <StoryLightboxImage
                src={block.src}
                alt={block.alt}
                width={1536}
                height={1024}
                sizes="(max-width: 768px) 100vw, 720px"
                priority={idx === 0}
                previewClassName="h-auto w-full object-contain"
                caption={block.alt}
              />
              {block.alt ? (
                <figcaption className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  {block.alt}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        return (
          <div key={idx} className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--foreground)]">
                <tr>
                  {block.headers.map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-t border-[var(--border)] odd:bg-[color-mix(in_srgb,var(--muted)_35%,transparent)]"
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={`${rowIdx}-${cellIdx}`}
                        className={cn(
                          "px-3 py-2 text-[var(--muted-foreground)]",
                          cellIdx === 0 || cellIdx === 1
                            ? "font-medium text-[var(--foreground)]"
                            : undefined
                        )}
                      >
                        {parseInline(cell, coachLinks)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
