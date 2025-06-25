import ReactMarkdown from 'react-markdown';
import {
  MarkdownH1,
  MarkdownH2,
  MarkdownH3,
  MarkdownP,
  MarkdownUL,
  MarkdownOL,
  MarkdownLI,
  MarkdownA,
  MarkdownStrong,
} from './MarkdownComponents';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          h1: MarkdownH1,
          h2: MarkdownH2,
          h3: MarkdownH3,
          p: MarkdownP,
          ul: MarkdownUL,
          ol: MarkdownOL,
          li: MarkdownLI,
          a: MarkdownA,
          strong: MarkdownStrong,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}