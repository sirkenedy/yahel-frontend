import { createFileRoute, redirect } from '@tanstack/react-router';
import { stepPath } from '../../features/sign-in/machine';
import { chooseByHandle, stepInsteadOf } from '../../features/sign-in/route-guard';

export const Route = createFileRoute('/signin/')({
  beforeLoad: ({ context, search }) => {
    // Asked for by the app for one of this browser's signed-out accounts: its password, with the address filled in.
    if (chooseByHandle(context, search.account)) throw redirect({ to: stepPath('password'), replace: true });
    throw redirect({ to: stepPath(stepInsteadOf('choose', context.signIn, context.facts) ?? 'choose'), replace: true });
  },
});
