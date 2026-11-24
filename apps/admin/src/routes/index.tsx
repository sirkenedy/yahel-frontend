import { createFileRoute, redirect } from '@tanstack/react-router';

// Admin's addresses carry the account's slot. Without one, it is the account this tab uses, or the first.
export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    throw redirect({ to: '/u/$slot', params: { slot: String(context.session.store.getState().slot ?? 0) }, replace: true });
  },
});
