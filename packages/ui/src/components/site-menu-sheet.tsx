import { Button as AriaButton, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import type { ReactNode } from 'react';

export interface SiteMenuSheetProps {
  label: string;
  closeLabel: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: ReactNode;
}

/** The sheet behind `SiteMenu`. Loaded on demand, so a page that never opens the menu does not carry it. */
export function SiteMenuSheet({ label, closeLabel, isOpen, onOpenChange, children }: SiteMenuSheetProps) {
  return (
    <ModalOverlay
      className="ws-site-menu__scrim"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      // Pressing the scrim closes the sheet. React Aria's own dismissal would add a second, hidden close control.
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <Modal className="ws-site-menu">
        <Dialog className="ws-site-menu__dialog">
          <div className="ws-site-menu__header">
            <Heading slot="title" className="ws-site-menu__title">
              {label}
            </Heading>
            <AriaButton className="ws-button ws-button--plain ws-site-menu__close" onPress={() => onOpenChange(false)}>
              {closeLabel}
            </AriaButton>
          </div>
          <div className="ws-site-menu__links">{children}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
