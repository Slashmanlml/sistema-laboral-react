import { Fragment, type ReactNode } from 'react';

// =============================================================================
// Render de Markdown mínimo (negritas, código en línea y viñetas) SIN
// `dangerouslySetInnerHTML`.
//
// SEGURIDAD: la versión anterior inyectaba la respuesta del modelo como HTML
// crudo. Como el prompt incluye las notas de lotes, registros y tareas escritas
// por el usuario, alguien que controlara una nota podía inducir al modelo a
// devolver HTML y ejecutarlo (XSS). Al construir elementos de React el texto se
// escapa siempre.
// =============================================================================

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

/** Divide una línea en fragmentos de texto, negrita y código. */
const renderInline = (line: string, keyPrefix: string): ReactNode[] =>
  line
    .split(INLINE_PATTERN)
    .filter(part => part !== '')
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={key}
            className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[10px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <Fragment key={key}>{part}</Fragment>;
    });

interface MarkdownTextProps {
  text: string;
}

export const MarkdownText = ({ text }: MarkdownTextProps) => {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc list-inside ml-2 space-y-1 my-1">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const key = `line-${index}`;

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(
        <li key={key} className="text-slate-700 font-medium">
          {renderInline(trimmed.slice(2), key)}
        </li>
      );
      return;
    }

    flushList(`list-${index}`);

    if (trimmed === '') {
      blocks.push(<div key={key} className="h-2" />);
      return;
    }

    blocks.push(
      <p key={key} className="leading-relaxed">
        {renderInline(line, key)}
      </p>
    );
  });

  flushList('list-end');

  return <>{blocks}</>;
};
