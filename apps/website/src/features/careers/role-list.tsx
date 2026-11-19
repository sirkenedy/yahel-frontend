import { Chevron } from '@yahel/ui';
import { careersMessages as m } from './messages';
import type { Role } from './roles';

const rolesAnchor = '#roles';

/** Each row will lead to its role. Until roles have pages of their own, it leads back to the list. */
export function RoleList({ roles }: { roles: readonly Role[] }) {
  return (
    <ul className="careers-roles">
      {roles.map((role) => (
        <li key={role.id}>
          <a href={rolesAnchor} className="careers-role">
            <span className="careers-role__text">
              <span className="careers-role__title">{m.roleTitle}</span> <span className="careers-role__detail">{m.roleDetail(m.teams[role.team])}</span>
            </span>{' '}
            <span className="careers-role__action">
              {m.viewRole}
              <Chevron />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
