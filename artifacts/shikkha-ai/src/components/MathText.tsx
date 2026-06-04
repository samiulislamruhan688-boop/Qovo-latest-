import katex from "katex";

type Seg = { type: "text" | "display" | "inline"; content: string };

function parseMath(text: string): Seg[] {
  const segs: Seg[] = [];
  let i = 0;
  let textStart = 0;

  const flush = (end: number) => {
    if (end > textStart) segs.push({ type: "text", content: text.slice(textStart, end) });
  };

  while (i < text.length) {
    if (text[i] === "$" && text[i + 1] === "$") {
      const end = text.indexOf("$$", i + 2);
      if (end !== -1) {
        flush(i);
        segs.push({ type: "display", content: text.slice(i + 2, end) });
        i = end + 2; textStart = i; continue;
      }
    }
    if (text[i] === "$" && text[i + 1] !== "$") {
      const end = text.indexOf("$", i + 1);
      if (end !== -1) {
        flush(i);
        segs.push({ type: "inline", content: text.slice(i + 1, end) });
        i = end + 1; textStart = i; continue;
      }
    }
    if (text[i] === "\\" && text[i + 1] === "[") {
      const end = text.indexOf("\\]", i + 2);
      if (end !== -1) {
        flush(i);
        segs.push({ type: "display", content: text.slice(i + 2, end) });
        i = end + 2; textStart = i; continue;
      }
    }
    if (text[i] === "\\" && text[i + 1] === "(") {
      const end = text.indexOf("\\)", i + 2);
      if (end !== -1) {
        flush(i);
        segs.push({ type: "inline", content: text.slice(i + 2, end) });
        i = end + 2; textStart = i; continue;
      }
    }
    i++;
  }
  flush(text.length);
  return segs;
}

function renderKatex(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode: display,
      output: "html",
      trust: false,
    });
  } catch {
    return latex;
  }
}

export function MathText({
  children,
  className,
  block = false,
}: {
  children: string;
  className?: string;
  block?: boolean;
}) {
  if (!children) return null;
  const segments = parseMath(children);
  const Tag = block ? "div" : "span";

  return (
    <Tag className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return <span key={idx} style={{ whiteSpace: "pre-wrap" }}>{seg.content}</span>;
        }
        const isDisplay = seg.type === "display";
        const html = renderKatex(seg.content, isDisplay);
        return (
          <span
            key={idx}
            className={isDisplay ? "block text-center my-2 overflow-x-auto" : "inline-block align-middle"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Tag>
  );
}
