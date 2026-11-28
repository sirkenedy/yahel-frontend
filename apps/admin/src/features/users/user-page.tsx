import { useQuery } from '@tanstack/react-query';
import { isApiError } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { ConsoleCard, ConsoleFacts, ConsolePage, ConsolePlaceholder, FlowButton, FlowLink, FlowNotice } from '@yahel/ui';
import type { ConsoleCrumb } from '@yahel/ui';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { personWords as w, userMessages as m } from './messages';
import { dayOf, nameOf, personOf, whenOf } from './people';
import type { Person } from './people';
import { memberQuery, membersQuery } from './queries';
import { PersonFace, PersonStatus } from './users-page';

export interface UserPageProps {
  session: Session;
  tenantId: string;
  memberId: string;
  slot: string;
  /** The trail to Users; this person's name is added to it. */
  crumbs: ConsoleCrumb[];
  crumbsLabel: string;
  /** The actions an administrator can take on this person, given everyone in the organisation. */
  actions?: (person: Person, everyone: readonly Person[]) => ReactNode;
}

/** The facts the API has about one person, without inventing the ones it does not. */
export const factsOf = (person: Person) => {
  const { member } = person;
  const facts: { label: string; value: ReactNode }[] = [];
  if (person.email) facts.push({ label: m.facts.address, value: person.email });
  facts.push({ label: m.facts.role, value: w.role[member.role] }, { label: m.facts.type, value: w.type[member.type] });
  const add = (label: string, value: string | null | undefined) => {
    if (value) facts.push({ label, value });
  };
  add(m.facts.added, dayOf(member.createdAt));
  add(m.facts.joined, dayOf(member.joinedAt));
  facts.push({ label: m.facts.lastSignIn, value: whenOf(member.lastActiveAt) ?? w.notYet });
  if (member.status === 'suspended') add(m.facts.suspended, dayOf(member.suspendedAt));
  if (member.status === 'invited') add(m.facts.inviteExpires, dayOf(member.inviteExpiresAt));
  add(m.facts.department, member.department);
  add(m.facts.jobTitle, member.jobTitle);
  add(m.facts.unit, member.ouPath);
  return facts;
};

/** One person: who they are, their state, the facts about their account, and what an administrator can do. */
export function UserPage({ session, tenantId, memberId, slot, crumbs, crumbsLabel, actions }: UserPageProps) {
  const me = useStore(session.store, (state) => state.profile);
  const member = useQuery(memberQuery(session, tenantId, memberId));
  const everyone = useQuery(membersQuery(session, tenantId));
  const usersHref = `/u/${slot}/users`;

  if (member.isPending) return <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />;
  if (member.isError) {
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

  const person = personOf(member.data, me);
  const people = (everyone.data ?? []).map((other) => personOf(other, me));
  const name = nameOf(person);

  return (
    <ConsolePage
      crumbs={[...crumbs, { label: name }]}
      crumbsLabel={crumbsLabel}
      leading={<PersonFace person={person} size="large" />}
      title={name}
      lede={
        <span className="user-lede">
          {person.email ? <span>{person.email}</span> : null}
          <PersonStatus person={person} />
          <span>{w.role[person.member.role]}</span>
        </span>
      }
    >
      {actions && everyone.data ? actions(person, people) : null}
      <div className="ws-console-cards">
        <ConsoleCard title={m.account} icon="person">
          <ConsoleFacts facts={factsOf(person)} />
        </ConsoleCard>
        <ConsoleCard title={m.security} icon="shield">
          <p className="ws-console-muted">{m.securityLater}</p>
        </ConsoleCard>
      </div>
    </ConsolePage>
  );
}
