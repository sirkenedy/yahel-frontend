import { Button, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import type { ReactNode } from 'react';
import { FlowIcon } from '../flow/flow-icon';

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
  /** One line under the title. */
  lede?: ReactNode;
  /** Shows a close button with this name in the corner. */
  closeLabel?: string;
}

/** A modal dialog over the console: a title, what it means, and the choices. Escape closes it; focus stays inside. */
export function ConsoleDialog({ isOpen, onOpenChange, title, children, actions, role = 'alertdialog', lede, closeLabel }: ConsoleDialogProps) {
  return (
    <ModalOverlay className="ws-console-overlay" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={role === 'dialog'}>
      <Modal className="ws-console-modal">
        <Dialog className="ws-console-dialog" role={role}>
          <div className="ws-console-panel__head ws-console-dialog__head">
            <span className="ws-console-panel__titles">
              <Heading slot="title" className="ws-console-dialog__title">
                {title}
              </Heading>
              {lede ? <span className="ws-console-muted">{lede}</span> : null}
            </span>
            {closeLabel ? (
              <Button className="ws-console-iconbutton" aria-label={closeLabel} onPress={() => onOpenChange(false)}>
                <FlowIcon name="close" />
              </Button>
            ) : null}
          </div>
          <div className="ws-console-dialog__body">{children}</div>
          <div className="ws-console-dialog__actions">{actions}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
