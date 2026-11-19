export type Team = 'engineering' | 'design' | 'operations';

export interface Role {
  id: string;
  team: Team;
}

/** Stand-ins until there are roles to list: the design shows four, and their titles and locations are marked placeholders. */
export const openRoles: readonly Role[] = [
  { id: 'engineering-1', team: 'engineering' },
  { id: 'engineering-2', team: 'engineering' },
  { id: 'design-1', team: 'design' },
  { id: 'operations-1', team: 'operations' },
];
