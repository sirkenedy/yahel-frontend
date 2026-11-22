import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { submitFields, useStepField } from './use-step-field';

function Harness({ onValid }: { onValid: (value: string) => void }) {
  const { value, change, error, submit, inputRef } = useStepField({ initial: 'a', problemOf: (value) => (value.length < 3 ? 'Use 3 characters or more.' : null), onValid });
  return (
    <form onSubmit={submit} noValidate>
      <input aria-label="Name" ref={inputRef} value={value} onChange={(event) => change(event.target.value)} />
      <output>{error}</output>
      <button type="submit">Continue</button>
    </form>
  );
}

function Pair({ onValid }: { onValid: (first: string, last: string) => void }) {
  const first = useStepField({ problemOf: (value) => (value ? null : 'Enter a first name.') });
  const last = useStepField({ problemOf: (value) => (value.length > 3 ? 'Too long.' : null) });
  const { inputRef: firstRef, value: firstValue, error: firstError } = first;
  const { inputRef: lastRef, value: lastValue, error: lastError } = last;
  return (
    <form onSubmit={(event) => submitFields(event, [first, last], () => onValid(firstValue, lastValue))} noValidate>
      <input aria-label="First" ref={firstRef} value={firstValue} onChange={(event) => first.change(event.target.value)} />
      <output aria-label="First problem">{firstError}</output>
      <input aria-label="Last" ref={lastRef} value={lastValue} onChange={(event) => last.change(event.target.value)} />
      <output aria-label="Last problem">{lastError}</output>
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

    await user.type(screen.getByLabelText('Name'), 'b');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.type(screen.getByLabelText('Name'), 'c{Enter}');
    expect(onValid).toHaveBeenCalledWith('abc');
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
    render(<Pair onValid={onValid} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Last'), 'Okafor');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByLabelText('First problem')).toHaveTextContent('Enter a first name.');
    expect(screen.getByLabelText('Last problem')).toHaveTextContent('Too long.');
    expect(screen.getByLabelText('First')).toHaveFocus();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('clears only the edited field’s problem, then passes good values on', async () => {
    const onValid = vi.fn();
    render(<Pair onValid={onValid} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Last'), 'Okafor');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await user.type(screen.getByLabelText('First'), 'Amara');
    expect(screen.getByLabelText('First problem')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Last problem')).toHaveTextContent('Too long.');

    await user.clear(screen.getByLabelText('Last'));
    await user.type(screen.getByLabelText('Last'), 'Oke{Enter}');
    expect(onValid).toHaveBeenCalledWith('Amara', 'Oke');
  });
});
