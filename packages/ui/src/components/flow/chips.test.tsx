import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowChip, FlowChips } from './chips';
import type { FlowChipsProps } from './chips';

function Sizes({ onChange, ...props }: Partial<FlowChipsProps<string>> & { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('2');
  const change = (next: string) => {
    setValue(next);
    onChange?.(next);
  };
  return (
    <FlowChips label="How many people?" value={value} onChange={change} {...props}>
      <FlowChip value="1">1</FlowChip>
      <FlowChip value="2">2</FlowChip>
      <FlowChip value="11" badge="No trial">
        11+
      </FlowChip>
    </FlowChips>
  );
}

describe('FlowChips', () => {
  it('is one named group of radios with the chosen one checked', () => {
    render(<Sizes />);

    const group = screen.getByRole('radiogroup', { name: 'How many people?' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: '2' })).toBeChecked();
    expect(screen.getByText('How many people?')).toBeVisible();
  });

  it('chooses with a press, and tells the owner', async () => {
    const onChange = vi.fn();
    render(<Sizes onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: '1' }));

    expect(onChange).toHaveBeenCalledWith('1');
    expect(screen.getByRole('radio', { name: '1' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '2' })).not.toBeChecked();
  });

  it('is one stop for the keyboard, and the arrow keys move the choice', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Sizes onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('radio', { name: '2' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('11');
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('reads a badge as part of its pill', () => {
    render(<Sizes />);

    expect(screen.getByRole('radio', { name: '11+ No trial' })).toBeInTheDocument();
  });

  it('keeps the label for assistive technology when it is hidden, and says which layout to draw', () => {
    render(<Sizes isLabelHidden layout="segmented" />);

    const group = screen.getByRole('radiogroup', { name: 'How many people?' });
    expect(group).toHaveAttribute('data-layout', 'segmented');
    expect(screen.getByText('How many people?')).toHaveClass('ws-flow-hidden');
  });

  it('can draw a run of numbers closer together', () => {
    render(<Sizes layout="compact" />);

    expect(screen.getByRole('radiogroup', { name: 'How many people?' })).toHaveAttribute('data-layout', 'compact');
  });

  it('refuses a chip outside a group', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<FlowChip value="1">1</FlowChip>)).toThrow(/inside <FlowChips>/);
    quiet.mockRestore();
  });
});
