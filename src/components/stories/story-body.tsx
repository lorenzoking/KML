import { cn } from "@/lib/utils";

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseInline(text: string) {
  // Very small bold support: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-[var(--foreground)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
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

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
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
}: {
  body: string;
  className?: string;
}) {
  const blocks = parseStoryBody(body);

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h3
              key={idx}
              className="pt-2 font-[family-name:var(--font-display)] text-lg font-semibold uppercase tracking-[0.04em] text-[var(--foreground)]"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p
              key={idx}
              className="max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-[15px]"
            >
              {parseInline(block.text)}
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
                  {parseInline(item)}
                </li>
              ))}
            </ListTag>
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
                        {parseInline(cell)}
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
