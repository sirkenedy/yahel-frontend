import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useStepField } from './use-step-field';

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
});
