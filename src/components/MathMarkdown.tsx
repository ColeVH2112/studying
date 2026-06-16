// Renders markdown + KaTeX. SPEC §8.1: react-markdown + remark-math + rehype-katex.
// KaTeX styling is left untouched — math should look like math (§9).

import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/** Put every `$$…$$` display fence on its own line.
 *
 * remark-math (micromark-extension-math) only renders `$$…$$` as a centered
 * display block when the fences sit on their own lines; with content on the
 * fence line a multi-line block desyncs the tokenizer and swallows the rest of
 * the document. Content authors write display math inline (per SPEC §14), so we
 * normalize here rather than touching the verbatim content. At render time the
 * only `$$` sequences are real display fences — template `$${x}` artifacts have
 * already collapsed to a single `$`. */
export function normalizeDisplayMath(src: string): string {
  return src.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner: string) => `\n\n$$\n${inner.trim()}\n$$\n\n`);
}

interface Props {
  children: string;
  className?: string;
}

export function MathMarkdown({ children, className }: Props) {
  return (
    <div className={`prose${className ? ` ${className}` : ''}`}>
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeDisplayMath(children)}
      </Markdown>
    </div>
  );
}
