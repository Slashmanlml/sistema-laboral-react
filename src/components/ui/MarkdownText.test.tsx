import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownText } from './MarkdownText';

describe('MarkdownText', () => {
  test('renderiza negritas y código en línea', () => {
    const { container } = render(
      <MarkdownText text="Subí el **pH** a `6.2` mañana." />
    );

    expect(container.querySelector('strong')?.textContent).toBe('pH');
    expect(container.querySelector('code')?.textContent).toBe('6.2');
  });

  test('agrupa las viñetas en una lista', () => {
    const { container } = render(
      <MarkdownText text={'Recomendaciones:\n- Regar temprano\n- Medir drenaje'} />
    );

    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('Regar temprano');
  });

  test('NO ejecuta ni inserta HTML que venga en la respuesta del modelo', () => {
    // El prompt incluye notas escritas por el usuario, así que la salida del
    // modelo es contenido no confiable. Antes se inyectaba con
    // dangerouslySetInnerHTML y esto se convertía en un vector de XSS.
    const malicious = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    const { container } = render(<MarkdownText text={malicious} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    // El texto se muestra escapado, como texto plano.
    expect(container.textContent).toContain('<img src=x');
  });

  test('escapa HTML incluso dentro de una negrita', () => {
    const { container } = render(
      <MarkdownText text="**<b onmouseover='steal()'>ojo</b>**" />
    );

    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText(/onmouseover/)).toBeInTheDocument();
  });

  test('preserva los saltos de línea como bloques', () => {
    const { container } = render(<MarkdownText text={'Primera\n\nSegunda'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });
});
