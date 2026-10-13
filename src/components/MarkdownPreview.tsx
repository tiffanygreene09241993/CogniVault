import React, { useState } from 'react';
import { Copy, Check, Bookmark, ExternalLink } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  onCitationClick?: () => void;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  onCitationClick,
  className = '',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {});
  };

  // Helper to parse inline markdown (bold, italic, code, links, citations)
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex matches:
    // 1. Citation badges: `[@id]`, `[cite-id]`, `[1]`, `[2]`, etc.
    // 2. Bold italic: `***text***` or `___text___`
    // 3. Bold: `**text**` or `__text__`
    // 4. Italic: `*text*` or `_text_`
    // 5. Inline code: `` `code` ``
    // 6. Links: `[label](url)`
    const pattern = /(\[@[a-zA-Z0-9_\-.:]+\]|\[cite-[a-zA-Z0-9_\-.:]+\]|\[\d+\]|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    
    const parts = text.split(pattern);
    return parts.map((part, index) => {
      if (!part) return null;

      // Citations: [@key], [cite-key], [1]
      if (
        (part.startsWith('[@') && part.endsWith(']')) ||
        (part.startsWith('[cite-') && part.endsWith(']')) ||
        (/^\[\d+\]$/.test(part))
      ) {
        const citationLabel = part.slice(1, -1);
        return (
          <button
            key={`cite-${index}`}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onCitationClick?.();
            }}
            title={`Citation: ${citationLabel} (Click to inspect citations)`}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400 transition-colors cursor-pointer align-baseline"
          >
            <Bookmark className="w-2.5 h-2.5 text-amber-400" />
            <span>{citationLabel}</span>
          </button>
        );
      }

      // Bold Italic
      if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
        return <strong key={index} className="font-bold italic text-slate-100">{part.slice(3, -3)}</strong>;
      }

      // Bold
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={index} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }

      // Italic
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return <em key={index} className="italic text-slate-200">{part.slice(1, -1)}</em>;
      }

      // Inline code
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-900 border border-slate-800 text-rose-300 selection:bg-rose-500/20"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Markdown links: [title](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkText, linkUrl] = linkMatch;
        return (
          <a
            key={index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-sky-400 hover:text-sky-300 underline underline-offset-2 decoration-sky-500/40 hover:decoration-sky-300 transition-colors"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        );
      }

      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  // Render parsed markdown blocks
  const renderBlocks = () => {
    if (!content || !content.trim()) {
      return (
        <div className="py-12 text-center text-slate-500 font-mono text-xs">
          No thesis content drafted yet. Switch to the Editor to begin your adversarial deposition draft.
        </div>
      );
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let blockIndex = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Code blocks (```lang ... ```)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // consume closing ```
        const codeContent = codeLines.join('\n');
        const codeId = blockIndex++;

        elements.push(
          <div key={`code-${codeId}`} className="my-5 rounded-lg border border-slate-800 bg-[#0B0F19] overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="uppercase tracking-wider text-[10px] text-slate-500">{lang || 'text'}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(codeContent, codeId)}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy code snippet"
              >
                {copiedIndex === codeId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed select-text">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Tables (| ... |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0]
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          
          // Row 1 is divider (|:---|---|), check if index 1 has dashes
          const hasDivider = tableLines[1].includes('-');
          const rowStartIndex = hasDivider ? 2 : 1;

          const rows = tableLines.slice(rowStartIndex).map((rowLine) =>
            rowLine
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim())
          );

          elements.push(
            <div key={`table-${blockIndex++}`} className="my-5 overflow-x-auto rounded-lg border border-slate-800 shadow-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300 font-semibold font-mono text-[11px]">
                    {headerCells.map((header, hIdx) => (
                      <th key={hIdx} className="px-4 py-2.5 whitespace-nowrap">
                        {renderInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0A0E17]/40">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 text-slate-300 text-xs">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${blockIndex++}`} className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 mt-7 mb-4 tracking-tight border-b border-slate-800/80 pb-3">
            {renderInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${blockIndex++}`} className="text-xl sm:text-2xl font-serif font-semibold text-slate-100 mt-6 mb-3 tracking-tight border-b border-slate-800/40 pb-2">
            {renderInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${blockIndex++}`} className="text-lg font-sans font-semibold text-slate-200 mt-5 mb-2 tracking-tight">
            {renderInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${blockIndex++}`} className="text-base font-sans font-medium text-slate-300 mt-4 mb-2">
            {renderInline(line.slice(5))}
          </h4>
        );
        i++;
        continue;
      }

      // Thematic break (--- or ***)
      if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
        elements.push(
          <hr key={`hr-${blockIndex++}`} className="my-6 border-t border-slate-800/80" />
        );
        i++;
        continue;
      }

      // Blockquotes (> ...)
      if (line.trim().startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        elements.push(
          <blockquote
            key={`quote-${blockIndex++}`}
            className="my-4 pl-4 py-1.5 border-l-2 border-amber-500/70 bg-amber-500/5 text-slate-300 italic text-sm rounded-r"
          >
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx} className={qIdx > 0 ? 'mt-1.5' : ''}>
                {renderInline(ql)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Lists (Unordered: - or *; Ordered: 1. 2.)
      if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
        const isOrdered = /^\s*\d+\.\s+/.test(line);
        const listItems: string[] = [];
        
        while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
          i++;
        }

        if (isOrdered) {
          elements.push(
            <ol key={`ol-${blockIndex++}`} className="my-3 pl-6 list-decimal space-y-1.5 text-slate-300 text-sm">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${blockIndex++}`} className="my-3 pl-6 list-disc space-y-1.5 text-slate-300 text-sm">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        continue;
      }

      // Regular paragraph
      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('|') &&
        !lines[i].trim().startsWith('>') &&
        !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
        !/^(\s*[-*_]\s*){3,}$/.test(lines[i])
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }

      if (paragraphLines.length > 0) {
        elements.push(
          <p key={`p-${blockIndex++}`} className="my-3.5 text-slate-300 text-sm leading-relaxed">
            {renderInline(paragraphLines.join(' '))}
          </p>
        );
      }
    }

    return elements;
  };

  return (
    <article className={`markdown-preview font-sans text-slate-200 select-text ${className}`}>
      {renderBlocks()}
    </article>
  );
};
