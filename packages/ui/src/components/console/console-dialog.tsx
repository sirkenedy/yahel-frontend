import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import type { ReactNode } from 'react';

export interface ConsoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** A question for a confirmation: "Delete Tunde Bakare?". */
  title: string;
  /** What will happen: the consequence, stated plainly. */
  children: ReactNode;
  /** Cancel first, then the action. The destructive action is never the default. */
  actions: ReactNode;
  /** `alertdialog` for a confirmation that interrupts; it cannot be dismissed by pressing outside. */
  role?: 'dialog' | 'alertdialog';
}

/** A modal dialog over the console: a title, what it means, and the choices. Escape closes it; focus stays inside. */
export function ConsoleDialog({ isOpen, onOpenChange, title, children, actions, role = 'alertdialog' }: ConsoleDialogProps) {
  return (
    <ModalOverlay className="ws-console-overlay" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={role === 'dialog'}>
      <Modal className="ws-console-modal">
        <Dialog className="ws-console-dialog" role={role}>
          <Heading slot="title" className="ws-console-dialog__title">
            {title}
          </Heading>
          <div className="ws-console-dialog__body">{children}</div>
          <div className="ws-console-dialog__actions">{actions}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
