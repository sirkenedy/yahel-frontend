import { useQuery } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';
import { Choice, ChoiceGroup, ConsolePanel, FlowButton, FlowCheckbox, FlowNotice, FlowTextField, UnitTree } from '@yahel/ui';
import { useState } from 'react';
import { actionMessages as m, roleWords as r, userMessages as u, usersMessages } from './messages';
import type { Person } from './people';
import { groupsQuery } from './queries';
import type { useMemberChange } from './user-actions';
import { treeOf, unitOf } from './units';
import type { Unit } from './units';

type Run = ReturnType<typeof useMemberChange>;

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  person: Person;
}

const closeUnlessBusy = (run: Run | null, onClose: () => void) => (open: boolean) => (open || run?.isPending ? undefined : onClose());

const Actions = ({ onClose, run, label, isDisabled, onSave }: { onClose: () => void; run: Run | null; label: string; isDisabled?: boolean; onSave?: () => void }) => (
  <>
    <FlowButton variant="quiet" onPress={onClose} isDisabled={run?.isPending}>
      {m.cancel}
    </FlowButton>
    <FlowButton variant="primary" isDisabled={isDisabled} isPending={run?.isPending} pendingLabel={m.working} onPress={onSave}>
      {label}
    </FlowButton>
  </>
);

/** Name, address and profile details. Only the job title and department can be changed through the API today. */
export function EditPanel({ isOpen, onClose, name, person, run }: PanelProps & { run: Run }) {
  const e = m.edit;
  const [jobTitle, setJobTitle] = useState(person.member.jobTitle ?? '');
  const [department, setDepartment] = useState(person.member.department ?? '');
  const [first, ...rest] = (person.name ?? '').split(' ');
  const changed = jobTitle.trim() !== (person.member.jobTitle ?? '') || department.trim() !== (person.member.department ?? '');
  return (
    <ConsolePanel
      isOpen={isOpen}
      onOpenChange={closeUnlessBusy(run, onClose)}
      title={e.title(name)}
      lede={e.lede}
      closeLabel={m.close}
      actions={<Actions onClose={onClose} run={run} label={m.save} isDisabled={!changed} onSave={() => run.mutate({ kind: 'profile', jobTitle: jobTitle.trim(), department: department.trim() })} />}
    >
      <FlowNotice tone="info">{e.later}</FlowNotice>
      <FlowTextField label={e.first} value={first ?? ''} isDisabled />
      <FlowTextField label={e.last} value={rest.join(' ')} isDisabled />
      <FlowTextField label={e.address} value={person.email ?? ''} isDisabled />
      <FlowTextField label={e.phone} value="" isDisabled />
      <FlowTextField label={e.jobTitle} value={jobTitle} onChange={setJobTitle} autoComplete="off" />
      <FlowTextField label={e.department} value={department} onChange={setDepartment} autoComplete="off" />
      <FlowTextField label={e.personalEmail} value="" isDisabled />
    </ConsolePanel>
  );
}

/** Moving someone to another unit, from the tree, with what changes said before it happens. */
export function UnitPanel({ isOpen, onClose, name, person, units, everyone, run }: PanelProps & { units: readonly Unit[]; everyone: readonly Person[]; run: Run }) {
  const now = unitOf(person.member, units);
  const [picked, setPicked] = useState(now?._id ?? '');
  const target = units.find((unit) => unit._id === picked && unit._id !== now?._id);
  return (
    <ConsolePanel
      isOpen={isOpen}
      onOpenChange={closeUnlessBusy(run, onClose)}
      title={m.unit.title(name)}
      lede={m.unit.lede}
      closeLabel={m.close}
      actions={<Actions onClose={onClose} run={run} label={target ? m.unit.move(target.name) : m.unit.stay} isDisabled={!target} onSave={() => target && run.mutate({ kind: 'unit', unit: target })} />}
    >
      <UnitTree
        label={usersMessages.units.tree}
        units={treeOf(units, everyone.map((one) => one.member))}
        mode="one"
        selected={[picked]}
        onChange={([id]) => setPicked(id ?? picked)}
        toggleLabel={usersMessages.units.toggle}
        note={(unit) => (unit.id === now?._id ? <span className="ws-console-tree__count">{m.unit.now}</span> : null)}
      />
      {target ? <p className="ws-console-muted">{m.unit.effect(target.name, name)}</p> : null}
    </ConsolePanel>
  );
}

/** The admin role: no role or super admin today; the narrower roles are shown as coming later. */
export function RolePanel({ isOpen, onClose, name, person, organisation, lock, run }: PanelProps & { organisation: string; lock: string | null; run: Run }) {
  const current = person.member.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>(current);
  return (
    <ConsolePanel
      isOpen={isOpen}
      onOpenChange={closeUnlessBusy(run, onClose)}
      title={m.role.title(name)}
      lede={m.role.lede}
      closeLabel={m.close}
      actions={<Actions onClose={onClose} run={run} label={m.role.saveRole} isDisabled={!!lock || role === current} onSave={() => run.mutate({ kind: 'role', role, roleName: r[role].name })} />}
    >
      {lock ? <FlowNotice tone="info">{lock}</FlowNotice> : null}
      <ChoiceGroup label={m.role.label} value={role} onChange={setRole} isDisabled={!!lock || person.member.role === 'OWNER' || person.member.role === 'GUEST'}>
        <Choice value="MEMBER" detail={r.MEMBER.about}>
          {r.MEMBER.name}
        </Choice>
        <Choice value="ADMIN" detail={r.ADMIN.about(organisation)}>
          {r.ADMIN.name}
        </Choice>
      </ChoiceGroup>
      <ul className="user-later-roles">
        {[r.helpDesk, r.userAdmin, r.groupsAdmin].map((one) => (
          <li key={one.name} className="ws-console-person__text">
            <span>{one.name}</span>
            <span className="ws-console-person__sub">{one.about}</span>
          </li>
        ))}
      </ul>
      <p className="ws-console-note">{r.narrowLater}</p>
    </ConsolePanel>
  );
}

/** Addresses and aliases: the primary address when Admin knows it; adding aliases is not in the API yet. */
export function AliasesPanel({ isOpen, onClose, name, person }: PanelProps) {
  const a = m.aliases;
  return (
    <ConsolePanel isOpen={isOpen} onOpenChange={(open) => (open ? undefined : onClose())} title={a.title(name)} lede={a.lede} closeLabel={m.close} actions={<FlowButton variant="quiet" onPress={onClose}>{m.done}</FlowButton>}>
      <FlowNotice tone="info">{a.later}</FlowNotice>
      <FlowTextField label={a.add} value="" isDisabled action={<FlowButton isDisabled>{a.addButton}</FlowButton>} />
      <p className="ws-console-person__text">
        <span>{person.email ?? u.addressUnknown}</span>
        {person.email ? <span className="ws-console-person__sub">{u.primary}</span> : null}
      </p>
    </ConsolePanel>
  );
}

/** The organisation's groups; who is in each is not in the API yet, so the boxes cannot be ticked. */
export function GroupsPanel({ isOpen, onClose, name, session, tenantId }: Omit<PanelProps, 'person'> & { session: Session; tenantId: string }) {
  const g = m.groups;
  const groups = useQuery({ ...groupsQuery(session, tenantId), enabled: isOpen });
  return (
    <ConsolePanel isOpen={isOpen} onOpenChange={(open) => (open ? undefined : onClose())} title={g.title(name)} lede={g.lede} closeLabel={m.close} actions={<Actions onClose={onClose} run={null} label={m.save} isDisabled />}>
      <FlowNotice tone="info">{g.later}</FlowNotice>
      {groups.isPending ? (
        <div role="status" aria-label={u.groups} className="ws-skeleton console__placeholder" />
      ) : groups.isError ? (
        <FlowNotice tone="danger">{g.failed}</FlowNotice>
      ) : groups.data.length === 0 ? (
        <p className="ws-console-muted">{g.none}</p>
      ) : (
        groups.data.map((group) => (
          <FlowCheckbox key={group._id} isSelected={false} isDisabled onChange={() => undefined}>
            <span className="ws-console-person__text">
              <span>{group.name}</span>
              <span className="ws-console-person__sub">{group.email}</span>
            </span>
          </FlowCheckbox>
        ))
      )}
    </ConsolePanel>
  );
}
