import type { WorkspaceMember, WorkspaceUnit } from '@yahel/api-client';
import type { UnitTreeUnit } from '@yahel/ui';

export type Unit = WorkspaceUnit;

const within = (path: string, unitPath: string) => path === unitPath || path.startsWith(unitPath.endsWith('/') ? unitPath : `${unitPath}/`);

/** The organisation itself: the unit everyone without one of their own belongs to. */
export const rootOf = (units: readonly Unit[]) => units.find((unit) => !unit.parentId && !unit.isGuest) ?? units.find((unit) => !unit.parentId) ?? null;

/** The unit a person is in: the one their path names, or the organisation itself. */
export const unitOf = (member: WorkspaceMember, units: readonly Unit[]) => units.find((unit) => unit.path === member.ouPath) ?? rootOf(units);

/** Whether a person is in any of the units, counting the units inside them. */
export const isInUnits = (member: WorkspaceMember, ids: readonly string[], units: readonly Unit[]) => {
  const own = unitOf(member, units);
  if (!own) return false;
  return units.filter((unit) => ids.includes(unit._id)).some((unit) => within(own.path, unit.path));
};

/** The units as a tree to pick from, each with how many of `members` are in it or the units inside it. */
export const treeOf = (units: readonly Unit[], members: readonly WorkspaceMember[]): UnitTreeUnit[] =>
  units.map((unit) => ({
    id: unit._id,
    name: unit.name,
    parentId: unit.parentId,
    count: members.filter((member) => isInUnits(member, [unit._id], units)).length,
  }));
