import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { slotOf } from '../../features/account/slot';

export const Route = createFileRoute('/u/$slot')({
  // The slot in the address names the account. This tab uses it if it is signed in in this browser; if not, sign-in.
  beforeLoad: async ({ context, params }) => {
    const slot = slotOf(params.slot);
    if (slot === null) throw redirect({ to: '/u/$slot', params: { slot: '0' }, replace: true });
    const { status, slot: using } = context.session.store.getState();
    if (status === 'signed-in' && using === slot) return;
    if (!(await context.session.switchTo(slot))) throw redirect({ to: '/sign-in' });
    context.queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'accounts' });
  },
  component: Outlet,
});
