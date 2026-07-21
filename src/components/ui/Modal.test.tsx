import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

const renderModal = (onClose = vi.fn()) => {
  const utils = render(
    <Modal open onClose={onClose} title="Editar Lote">
      <form>
        <input aria-label="Nombre" />
        <button type="submit">Guardar</button>
      </form>
    </Modal>
  );
  return { ...utils, onClose };
};

describe('Modal', () => {
  test('no renderiza nada cuando está cerrado', () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Oculto">
        <p>contenido</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('se anuncia como diálogo modal con su título', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Editar Lote');
  });

  test('se cierra con la tecla Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('se cierra al hacer clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('un clic dentro del panel no lo cierra', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('bloquea el scroll del fondo mientras está abierto', () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
