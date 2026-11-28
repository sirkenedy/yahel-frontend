import { useQuery } from '@tanstack/react-query';
import { isApiError } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { ConsoleCard, ConsoleFacts, ConsolePage, ConsolePlaceholder, FlowButton, FlowIcon, FlowLink, FlowNotice } from '@yahel/ui';
import type { ConsoleCrumb } from '@yahel/ui';
import { useId, useState } from 'react';
import { useStore } from 'zustand';
import { notify } from '../../toast';
import { actionMessages as a, personWords as w, roleWords as r, userMessages as m } from './messages';
import { dayOf, nameOf, personOf, whenOf } from './people';
import { memberQuery, membersQuery, unitsQuery } from './queries';
import { lockOf, useMemberChange } from './user-actions';
import { CancelInviteDialog, RemoveDialog, ResetPasswordDialog, RestoreDataDialog, SuspendDialog } from './user-dialogs';
import { AliasesPanel, EditPanel, GroupsPanel, RolePanel, UnitPanel } from './user-panels';
import { PersonFace, PersonStatus } from './users-page';
import { unitOf } from './units';

export interface UserPageProps {
  session: Session;
  tenantId: string;
  memberId: string;
  slot: string;
  organisation: string;
  /** The trail to Users; this person's name is added to it. */
  crumbs: ConsoleCrumb[];
  crumbsLabel: string;
}

type Open = 'reset' | 'suspend' | 'remove' | 'cancelInvite' | 'restoreData' | 'edit' | 'unit' | 'role' | 'aliases' | 'groups';

/** One person: who they are, their state, quick actions, and a card for each part of their account. */
export function UserPage({ session, tenantId, memberId, slot, organisation, crumbs, crumbsLabel }: UserPageProps) {
  const me = useStore(session.store, (state) => state.profile);
  const member = useQuery(memberQuery(session, tenantId, memberId));
  const everyone = useQuery(membersQuery(session, tenantId));
  const unitList = useQuery(unitsQuery(session, tenantId));
  const [open, setOpen] = useState<Open | null>(null);
  const reasonId = useId();
  const usersHref = `/u/${slot}/users`;
  const person = member.data ? personOf(member.data, me) : null;
  const short = person?.name?.split(' ')[0] ?? a.thisPerson;
  const run = useMemberChange({ session, tenantId, slot, memberId, name: short }, () => setOpen(null));

  if (member.isPending) return <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />;
  if (member.isError || !person) {
    const gone = isApiError(member.error) && (member.error.status === 404 || member.error.code === 'RESOURCE_NOT_FOUND');
    return (
      <ConsolePage crumbs={crumbs} crumbsLabel={crumbsLabel} title={w.unnamed}>
        {gone ? (
          <ConsolePlaceholder
            icon="person"
            title={m.gone}
            action={
              <FlowLink href={usersHref} variant="quiet">
                {m.toUsers}
              </FlowLink>
            }
          >
            {null}
          </ConsolePlaceholder>
        ) : (
          <FlowNotice tone="danger" actions={<FlowButton onPress={() => void member.refetch()}>{m.tryAgain}</FlowButton>}>
            {m.failed}
          </FlowNotice>
        )}
      </ConsolePage>
    );
  }

  const { member: data } = person;
  const people = (everyone.data ?? []).map((other) => personOf(other, me));
  const units = unitList.data ?? [];
  const unit = unitOf(data, units);
  const name = nameOf(person);
  const lock = everyone.data ? lockOf(person, people, short) : a.working;
  const close = () => setOpen(null);
  const pending = (kind: string) => run.isPending && run.variables?.kind === kind;
  const roleWords = data.role === 'ADMIN' ? { name: r.ADMIN.name, about: r.ADMIN.about(organisation) } : data.role === 'OWNER' ? { name: r.OWNER.name, about: r.OWNER.about(organisation) } : r[data.role];
  const copy = () => {
    if (!person.email || !navigator.clipboard) return;
    void navigator.clipboard.writeText(person.email).then(() => notify(m.copied));
  };

  return (
    <ConsolePage
      crumbs={[...crumbs, { label: name }]}
      crumbsLabel={crumbsLabel}
      leading={<PersonFace person={person} size="large" />}
      title={name}
      lede={
        <span className="user-lede">
          {person.email ? (
            <span className="user-lede__address">
              {person.email}
              <FlowButton variant="round" aria-label={m.copyAddress} onPress={copy}>
                <FlowIcon name="copy" />
              </FlowButton>
            </span>
          ) : null}
          <PersonStatus person={person} />
          <span>{w.role[data.role]}</span>
          {unit ? (
            <FlowButton variant="chip" aria-label={m.unitChip(unit.name)} onPress={() => setOpen('unit')} isDisabled={units.length < 2}>
              {unit.name}
            </FlowButton>
          ) : null}
          <span className="ws-console-muted">
            {data.lastActiveAt ? m.lastSignedIn(whenOf(data.lastActiveAt) ?? '') : m.notSignedIn}
            {dayOf(data.createdAt) ? ` · ${m.added(dayOf(data.createdAt) ?? '')}` : null}
          </span>
        </span>
      }
      actions={
        <FlowLink href={usersHref} variant="quiet">
          {m.back}
        </FlowLink>
      }
    >
      {data.status === 'invited' ? (
        <FlowNotice
          tone="info"
          title={m.invitedTitle(short)}
          actions={
            <FlowButton onPress={() => run.mutate({ kind: 'resend' })} isPending={pending('resend')} pendingLabel={a.working} isDisabled={run.isPending}>
              {a.resend}
            </FlowButton>
          }
        >
          {m.invitedBody(dayOf(data.inviteExpiresAt))}
        </FlowNotice>
      ) : null}
      {data.status === 'suspended' ? (
        <FlowNotice
          tone="warning"
          title={m.suspendedTitle(short)}
          actions={
            <FlowButton onPress={() => run.mutate({ kind: 'reactivate' })} isPending={pending('reactivate')} pendingLabel={a.working} isDisabled={!!lock || run.isPending}>
              {a.restoreAccess}
            </FlowButton>
          }
        >
          {m.suspendedBody}
        </FlowNotice>
      ) : null}

      <div className="user-actions" role="group" aria-label={m.quick}>
        <FlowButton onPress={() => setOpen('reset')} isDisabled={data.status === 'invited'}>
          <FlowIcon name="key" />
          {a.resetPassword}
        </FlowButton>
        {person.email ? (
          <FlowLink variant="quiet" href={`mailto:${person.email}`}>
            <FlowIcon name="mail" />
            {a.sendEmail}
          </FlowLink>
        ) : (
          <FlowButton isDisabled aria-describedby={reasonId}>
            <FlowIcon name="mail" />
            {a.sendEmail}
          </FlowButton>
        )}
        <FlowButton isDisabled aria-describedby={reasonId}>
          <FlowIcon name="sign-out" />
          {a.signOut}
        </FlowButton>
        {data.status === 'suspended' ? null : (
          <FlowButton onPress={() => setOpen('suspend')} isDisabled={!!lock || data.status !== 'active' || run.isPending} aria-describedby={reasonId}>
            <FlowIcon name="pause" />
            {a.suspend}
          </FlowButton>
        )}
      </div>
      <p id={reasonId} className="ws-console-note">
        {[everyone.data ? lock : null, a.quickLater].filter(Boolean).join(' ')}
      </p>

      <div className="ws-console-cards">
        <ConsoleCard title={m.addresses} icon="mail" action={<FlowButton variant="link" onPress={() => setOpen('aliases')}>{m.manage}</FlowButton>}>
          <p className="ws-console-muted">{person.email ? m.addressesSummary(0) : m.addressUnknown}</p>
          {person.email ? (
            <p className="ws-console-person__text">
              <span>{person.email}</span>
              <span className="ws-console-person__sub">{m.primary}</span>
            </p>
          ) : null}
        </ConsoleCard>
        <ConsoleCard title={m.groups} icon="people" action={<FlowButton variant="link" onPress={() => setOpen('groups')}>{m.manage}</FlowButton>}>
          <p className="ws-console-muted">{m.groupsSummary}</p>
        </ConsoleCard>
        <ConsoleCard title={m.role} icon="shield" action={<FlowButton variant="link" onPress={() => setOpen('role')}>{m.change}</FlowButton>}>
          <p className="ws-console-person__text">
            <span>{roleWords.name}</span>
            <span className="ws-console-person__sub">{roleWords.about}</span>
          </p>
        </ConsoleCard>
        <ConsoleCard title={m.storage} icon="database">
          <p className="ws-console-muted">{m.storageLater}</p>
        </ConsoleCard>
        <ConsoleCard title={m.profile} icon="person" action={<FlowButton variant="link" onPress={() => setOpen('edit')}>{m.edit}</FlowButton>}>
          <ConsoleFacts
            facts={[
              { label: m.jobTitle, value: data.jobTitle || <span className="ws-console-muted">{m.addJobTitle}</span> },
              { label: m.department, value: data.department || <span className="ws-console-muted">{m.addDepartment}</span> },
              { label: m.personalEmail, value: <span className="ws-console-muted">{m.notShared}</span> },
              { label: m.phone, value: <span className="ws-console-muted">{m.notShared}</span> },
              { label: m.facts.type, value: w.type[data.type] },
              ...(dayOf(data.joinedAt) ? [{ label: m.facts.joined, value: dayOf(data.joinedAt) }] : []),
              ...(data.status === 'suspended' && dayOf(data.suspendedAt) ? [{ label: m.facts.suspended, value: dayOf(data.suspendedAt) }] : []),
            ]}
          />
        </ConsoleCard>
        <ConsoleCard title={m.security} icon="lock">
          <p className="ws-console-muted">{m.securityLater}</p>
        </ConsoleCard>
        <ConsoleCard title={m.deletedData} icon="clock" action={<FlowButton variant="link" onPress={() => setOpen('restoreData')}>{m.restore}</FlowButton>}>
          <p className="ws-console-muted">{m.deletedDataBody(short)}</p>
        </ConsoleCard>
      </div>

      <ConsoleCard title={data.status === 'invited' ? m.cancelInviteTitle(short) : m.removeTitle(short, organisation)} icon="warning">
        <p className="ws-console-muted">{data.status === 'invited' ? m.cancelInviteBody : m.removeBody}</p>
        <div className="user-actions">
          <FlowButton variant="destructive" onPress={() => setOpen(data.status === 'invited' ? 'cancelInvite' : 'remove')} isDisabled={!!lock || run.isPending} aria-describedby={reasonId}>
            {data.status === 'invited' ? a.cancelInvite : m.removeUser}
          </FlowButton>
        </div>
      </ConsoleCard>

      <ResetPasswordDialog isOpen={open === 'reset'} onClose={close} name={short} />
      <RestoreDataDialog isOpen={open === 'restoreData'} onClose={close} name={short} />
      <SuspendDialog isOpen={open === 'suspend'} onClose={close} name={short} address={person.email} run={run} />
      <RemoveDialog isOpen={open === 'remove'} onClose={close} name={short} run={run} canSuspend={data.status === 'active'} />
      <CancelInviteDialog isOpen={open === 'cancelInvite'} onClose={close} name={short} run={run} />
      {open === 'edit' ? <EditPanel isOpen onClose={close} name={short} person={person} run={run} /> : null}
      {open === 'unit' ? <UnitPanel isOpen onClose={close} name={short} person={person} units={units} everyone={people} run={run} /> : null}
      {open === 'role' ? <RolePanel isOpen onClose={close} name={short} person={person} organisation={organisation} lock={lock} run={run} /> : null}
      <AliasesPanel isOpen={open === 'aliases'} onClose={close} name={short} person={person} />
      <GroupsPanel isOpen={open === 'groups'} onClose={close} name={short} session={session} tenantId={tenantId} />
    </ConsolePage>
  );
}
