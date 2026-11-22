import { FlowStep } from '@yahel/ui';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmailedCodeForm } from './emailed-code-form';
import type { EmailedCodeFormProps } from './emailed-code-form';
import type { FlowRequest } from './use-flow-request';

const words = { codeLabel: '6-character code', codeIncomplete: 'Enter all 6 characters.', verify: 'Verify', verifying: 'Verifying…', sendNewCode: 'Send a new code', sendNewCodeIn: (clock: string) => `Send a new code in ${clock}`, sending: 'Sending…' };
const idle: FlowRequest = { isPending: false, feedback: null, clear: () => undefined };

const show = (props: Partial<EmailedCodeFormProps> = {}) => {
  const onSubmit = vi.fn();
  const onResend = vi.fn();
  render(
    <FlowStep direction="forward">
      <EmailedCodeForm words={words} request={idle} resend={idle} onSubmit={onSubmit} onResend={onResend} {...props} />
    </FlowStep>,
  );
  return { onSubmit, onResend, user: userEvent.setup() };
};

describe('EmailedCodeForm', () => {
  it('takes six letters and numbers, however they arrive, and submits them as typed', async () => {
    const { onSubmit, user } = show();
    await user.click(screen.getByLabelText(words.codeLabel));
    await user.paste('a1-b2 c3');
    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('a1b2c3');
  });

  it('refuses a short code beside the boxes without submitting', async () => {
    const { onSubmit, user } = show();
    await user.type(screen.getByLabelText(words.codeLabel), 'A1');
    await user.click(screen.getByRole('button', { name: words.verify }));

    expect(screen.getByLabelText(words.codeLabel)).toHaveAccessibleDescription(words.codeIncomplete);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows what the server said about the code beside the boxes, and nothing meant for another field', () => {
    show({ request: { ...idle, feedback: { place: 'field', field: 'code', text: 'That code didn’t work.' } } });
    expect(screen.getByLabelText(words.codeLabel)).toHaveAccessibleDescription('That code didn’t work.');
  });

  it('says it is verifying while the request runs', () => {
    show({ request: { ...idle, isPending: true } });
    expect(screen.getByRole('button', { name: words.verifying })).toBeInTheDocument();
  });

  it('holds "Send a new code" for half a minute, then sends one per press, and shows further links after it', () => {
    vi.useFakeTimers();
    const { onResend } = show({ children: <a href="/elsewhere">Another way</a> });
    const resend = () => screen.getByRole('button', { name: /^Send a new code/ });

    expect(resend()).toHaveAccessibleName('Send a new code in 0:30');
    fireEvent.click(resend());
    expect(onResend).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Another way' })).toBeInTheDocument();
    vi.useRealTimers();
  });
});
