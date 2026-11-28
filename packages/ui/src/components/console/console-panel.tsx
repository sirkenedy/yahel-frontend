import { Button, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import type { ReactNode } from 'react';
import { FlowIcon } from '../flow/flow-icon';

export interface ConsolePanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** What the panel changes: "Edit Kofi's details". */
  title: string;
  /** One line under the title. */
  lede?: ReactNode;
  /** The close button's name: "Close". */
  closeLabel: string;
  children: ReactNode;
  /** Cancel first, then the action. */
  actions?: ReactNode;
}

/**
 * A panel that slides in from the end of the page to change one part of something without leaving it.
 * Escape, the close button or pressing outside closes it; on a phone it rises as a sheet.
 */
export function ConsolePanel({ isOpen, onOpenChange, title, lede, closeLabel, children, actions }: ConsolePanelProps) {
  return (
    <ModalOverlay className="ws-console-overlay ws-console-overlay--panel" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="ws-console-panel">
        <Dialog className="ws-console-panel__dialog">
          <div className="ws-console-panel__head">
            <span className="ws-console-panel__titles">
              <Heading slot="title" className="ws-console-dialog__title">
                {title}
              </Heading>
              {lede ? <span className="ws-console-muted">{lede}</span> : null}
            </span>
            <Button className="ws-console-iconbutton" aria-label={closeLabel} onPress={() => onOpenChange(false)}>
              <FlowIcon name="close" />
            </Button>
          </div>
          <div className="ws-console-panel__body">{children}</div>
          {actions ? <div className="ws-console-dialog__actions ws-console-panel__actions">{actions}</div> : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
