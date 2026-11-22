import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Feedback } from './feedback';
import { submitFields, useStepField, useStepFields } from './use-step-field';

function Harness({ onValid, hasFormat, refusal }: { onValid: (value: string) => void; hasFormat?: boolean; refusal?: Feedback | null }) {
  const { value, change, blur, error, isValid, submit, inputRef } = useStepField({ initial: 'a', problemOf: (value) => (value.length < 3 ? 'Use 3 characters or more.' : null), onValid, hasFormat, refusal });
  return (
    <form onSubmit={submit} noValidate>
      <input aria-label="Name" ref={inputRef} value={value} onChange={(event) => change(event.target.value)} onBlur={blur} />
      <output>{error}</output>
      <p>{isValid ? 'ticked' : 'unticked'}</p>
      <button type="submit">Continue</button>
    </form>
  );
}

function Pair({ onValid, onRefused }: { onValid: (first: string, last: string) => void; onRefused?: (count: number) => void }) {
  const first = useStepField({ problemOf: (value) => (value ? null : 'Enter a first name.') });
  const last = useStepField({ problemOf: (value) => (value.length > 3 ? 'Too long.' : null) });
  const { inputRef: firstRef, value: firstValue, error: firstError } = first;
  const { inputRef: lastRef, value: lastValue, error: lastError } = last;
  return (
    <form onSubmit={(event) => onRefused?.(submitFields(event, [first, last], () => onValid(firstValue, lastValue)))} noValidate>
      <input aria-label="First" ref={firstRef} value={firstValue} onChange={(event) => first.change(event.target.value)} />
      <output aria-label="First problem">{firstError}</output>
      <input aria-label="Last" ref={lastRef} value={lastValue} onChange={(event) => last.change(event.target.value)} />
      <output aria-label="Last problem">{lastError}</output>
      <button type="submit">Continue</button>
    </form>
  );
}

function Summarised({ onValid }: { onValid: () => void }) {
  const first = useStepField({ label: 'First name', problemOf: (value) => (value ? null : 'Enter a first name.') });
  const email = useStepField({ label: 'Current email', problemOf: (value) => (value.includes('@') ? null : 'Enter an email.') });
  const { inputRef: firstRef, value: firstValue } = first;
  const { inputRef: emailRef, value: emailValue } = email;
  const form = useStepFields([first, email]);
  return (
    <form onSubmit={(event) => form.submit(event, onValid)} noValidate>
      <input aria-label="First" ref={firstRef} value={firstValue} onChange={(event) => first.change(event.target.value)} />
      <input aria-label="Email" ref={emailRef} value={emailValue} onChange={(event) => email.change(event.target.value)} />
      <output>{form.toFix.join(', ')}</output>
      <button type="submit">Continue</button>
    </form>
  );
}

describe('useStepField', () => {
  it('holds back a value with a problem, says what it is and moves focus to the field', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('status')).toHaveTextContent('Use 3 characters or more.');
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('clears the problem on the next edit and passes a good value on', async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Once checked, the field is checked again on every key: the problem stays while the value is wrong…
    await user.type(screen.getByLabelText('Name'), 'b');
    expect(screen.getByRole('status')).toHaveTextContent('Use 3 characters or more.');
    // …and goes the moment it is right.
    await user.type(screen.getByLabelText('Name'), 'c');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.type(screen.getByLabelText('Name'), '{Enter}');
    expect(onValid).toHaveBeenCalledWith('abc');
  });

  it('never shows a problem while the field is typed in for the first time', async () => {
    render(<Harness onValid={vi.fn()} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Name'), 'b');

    expect(screen.getByLabelText('Name')).toHaveValue('ab');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('checks a field that was typed in when it is left, and not one that was only passed through', async () => {
    render(<Harness onValid={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('Name'));
    await user.tab();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.type(screen.getByLabelText('Name'), 'b');
    await user.tab();
    expect(screen.getByRole('status')).toHaveTextContent('Use 3 characters or more.');
  });

  it('ticks a value only when it has a format, has been checked and is right', async () => {
    const { unmount } = render(<Harness onValid={vi.fn()} hasFormat />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Name'), 'bc');
    expect(screen.getByText('unticked')).toBeInTheDocument();
    await user.tab();
    expect(screen.getByText('ticked')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Name'));
    expect(screen.getByText('unticked')).toBeInTheDocument();
    unmount();

    render(<Harness onValid={vi.fn()} />);
    await user.type(screen.getByLabelText('Name'), 'bc');
    await user.tab();
    expect(screen.getByText('unticked')).toBeInTheDocument();
  });

  it('shows what the server said about the value, moves focus to the field, and puts it away on the next edit', async () => {
    const wrong: Feedback = { place: 'field', field: 'name', text: 'That name can’t be used.' };
    const { rerender } = render(<Harness onValid={vi.fn()} />);
    const user = userEvent.setup();
    expect(screen.getByLabelText('Name')).not.toHaveFocus();

    rerender(<Harness onValid={vi.fn()} refusal={wrong} />);
    expect(screen.getByRole('status')).toHaveTextContent('That name can’t be used.');
    expect(screen.getByLabelText('Name')).toHaveFocus();

    await user.type(screen.getByLabelText('Name'), 'b');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    // The same words from a second failure are a new refusal, and are shown again.
    rerender(<Harness onValid={vi.fn()} refusal={{ ...wrong }} />);
    expect(screen.getByRole('status')).toHaveTextContent('That name can’t be used.');
  });

  it('shows only a refusal that belongs beside a field', () => {
    render(<Harness onValid={vi.fn()} refusal={{ place: 'banner', tone: 'danger', text: 'Something went wrong on our side' }} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Name')).not.toHaveFocus();
  });

  it('uses a value held elsewhere when given one, and reports edits there', async () => {
    const onChange = vi.fn();
    function Held() {
      const { value, change, error, submit, inputRef } = useStepField({ value: 'amara', onChange, problemOf: (text) => (text === 'amara' ? 'That address is taken.' : null) });
      return (
        <form onSubmit={submit} noValidate>
          <input aria-label="Address" ref={inputRef} value={value} onChange={(event) => change(event.target.value)} />
          <output>{error}</output>
          <button type="submit">Continue</button>
        </form>
      );
    }
    render(<Held />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('status')).toHaveTextContent('That address is taken.');

    await user.type(screen.getByLabelText('Address'), '1');
    expect(onChange).toHaveBeenCalledWith('amara1');
    expect(screen.getByLabelText('Address')).toHaveValue('amara');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

describe('submitFields', () => {
  it('shows every problem beside its field and moves focus to the first field that has one', async () => {
    const onValid = vi.fn();
    const onRefused = vi.fn();
    render(<Pair onValid={onValid} onRefused={onRefused} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Last'), 'Okafor');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByLabelText('First problem')).toHaveTextContent('Enter a first name.');
    expect(screen.getByLabelText('Last problem')).toHaveTextContent('Too long.');
    expect(screen.getByLabelText('First')).toHaveFocus();
    expect(onValid).not.toHaveBeenCalled();
    expect(onRefused).toHaveBeenLastCalledWith(2);
  });

  it('clears only the edited field’s problem, then passes good values on', async () => {
    const onValid = vi.fn();
    const onRefused = vi.fn();
    render(<Pair onValid={onValid} onRefused={onRefused} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Last'), 'Okafor');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.type(screen.getByLabelText('First'), 'Amara');
    expect(screen.getByLabelText('First problem')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Last problem')).toHaveTextContent('Too long.');

    await user.clear(screen.getByLabelText('Last'));
    await user.type(screen.getByLabelText('Last'), 'Oke{Enter}');
    expect(onValid).toHaveBeenCalledWith('Amara', 'Oke');
    expect(onRefused).toHaveBeenLastCalledWith(0);
  });
});

describe('useStepFields', () => {
  it('names nothing to fix until a submit has found problems, then names each field that still has one', async () => {
    const onValid = vi.fn();
    render(<Summarised onValid={onValid} />);
    const user = userEvent.setup();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('status')).toHaveTextContent('First name, Current email');
    expect(screen.getByLabelText('First')).toHaveFocus();
    expect(onValid).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('First'), 'Amara');
    expect(screen.getByRole('status')).toHaveTextContent(/^Current email$/);

    await user.type(screen.getByLabelText('Email'), 'amara@northwind.example');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
