import { useEffect, useRef, type ReactNode } from 'react';

type Props = { title: string; children: ReactNode; onClose: () => void; canClose?: boolean };

export function Dialog({ title, children, onClose, canClose = true }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (canClose) onClose(); }}>
    <div className="dialog-heading">
      <h2>{title}</h2>
      {canClose && <button onClick={onClose}>Close</button>}
    </div>
    {children}
  </dialog>;
}
