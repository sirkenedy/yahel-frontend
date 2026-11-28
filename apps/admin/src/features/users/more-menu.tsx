import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { Session } from '@yahel/auth';
import { ConsoleDialog, ConsoleMenu, FlowButton, FlowCheckbox, FlowNotice } from '@yahel/ui';
import { useState } from 'react';
import { moreMessages as m, personWords as w } from './messages';
import { dayOf } from './people';
import { removedQuery } from './queries';

export interface MoreMenuProps {
  session: Session;
  tenantId: string;
  slot: string;
}

/** The Users page's further tools: custom fields, what people can edit, bringing in personal accounts and recently deleted accounts. */
export function MoreMenu({ session, tenantId, slot }: MoreMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState<'editing' | 'deleted' | null>(null);
  const close = () => setOpen(null);

  return (
    <>
      <ConsoleMenu
        label={m.more}
        items={[
          { id: 'fields', label: m.fields, detail: m.fieldsDetail },
          { id: 'editing', label: m.editing, detail: m.editingDetail },
          { id: 'personal', label: m.personal, detail: m.personalDetail },
          { id: 'deleted', label: m.deleted, detail: m.deletedDetail },
        ]}
        onAction={(id) => {
          if (id === 'fields') void navigate({ to: '/u/$slot/users/fields', params: { slot } });
          else if (id === 'personal') void navigate({ to: '/u/$slot/later/$page', params: { slot, page: 'unmanaged' } });
          else setOpen(id === 'editing' ? 'editing' : 'deleted');
        }}
      />
      <ConsoleDialog
        isOpen={open === 'editing'}
        onOpenChange={(isOpen) => (isOpen ? undefined : close())}
        role="dialog"
        title={m.editingTitle}
        lede={m.editingLede}
        closeLabel={m.close}
        actions={
          <>
            <FlowButton variant="quiet" onPress={close}>
              {m.cancel}
            </FlowButton>
            <FlowButton variant="primary" isDisabled>
              {m.save}
            </FlowButton>
          </>
        }
      >
        <FlowNotice tone="info">{m.editingLater}</FlowNotice>
        {m.editable.map(([label, detail]) => (
          <FlowCheckbox key={label} isSelected={false} isDisabled onChange={() => undefined}>
            <span className="ws-console-person__text">
              <span>{label}</span>
              <span className="ws-console-person__sub">{detail}</span>
            </span>
          </FlowCheckbox>
        ))}
      </ConsoleDialog>
      {open === 'deleted' ? <RecentlyDeleted session={session} tenantId={tenantId} onClose={close} /> : null}
    </>
  );
}

function RecentlyDeleted({ session, tenantId, onClose }: { session: Session; tenantId: string; onClose: () => void }) {
  const removed = useQuery(removedQuery(session, tenantId));
  return (
    <ConsoleDialog
      isOpen
      onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}
      role="dialog"
      title={m.deletedTitle}
      lede={m.deletedLede}
      closeLabel={m.close}
      actions={
        <FlowButton variant="quiet" onPress={onClose}>
          {m.done}
        </FlowButton>
      }
    >
      <FlowNotice tone="info">{m.deletedLater}</FlowNotice>
      {removed.isPending ? (
        <div role="status" aria-label={m.deletedTitle} className="ws-skeleton console__placeholder" />
      ) : removed.isError ? (
        <FlowNotice tone="danger">{m.deletedFailed}</FlowNotice>
      ) : removed.data.length === 0 ? (
        <p className="ws-console-muted">{m.deletedNone}</p>
      ) : (
        <ul className="users-removed">
          {removed.data.map((member) => (
            <li key={member._id}>
              <span className="ws-console-person__text">
                <span>{w.unnamed}</span>
                <span className="ws-console-person__sub">
                  {w.role[member.role]}
                  {dayOf(member.updatedAt) ? ` · ${m.removedOn(dayOf(member.updatedAt) ?? '')}` : null}
                </span>
              </span>
              <FlowButton variant="quiet" isDisabled>
                {m.restore}
              </FlowButton>
            </li>
          ))}
        </ul>
      )}
    </ConsoleDialog>
  );
}
