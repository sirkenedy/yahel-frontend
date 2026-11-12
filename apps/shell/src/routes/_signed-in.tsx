import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_signed-in')({
  beforeLoad: ({ context }) => {
    if (context.session.store.getState().status !== 'signed-in') throw redirect({ to: '/sign-in' });
  },
  component: Outlet,
});
