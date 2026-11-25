import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowSearchSelect } from './flow-search-select';

const items = [
  { id: 'GH', label: 'Ghana', leading: '🇬🇭', detail: '+233', display: '+233', textValue: 'Ghana GH +233' },
  { id: 'NE', label: 'Niger', leading: '🇳🇪', detail: '+227', display: '+227', textValue: 'Niger NE +227' },
  { id: 'NG', label: 'Nigeria', leading: '🇳🇬', detail: '+234', display: '+234', textValue: 'Nigeria NG +234' },
  { id: 'CI', label: 'Côte d’Ivoire', leading: '🇨🇮', detail: '+225', display: '+225', textValue: 'Côte d’Ivoire CI +225' },
];

function Codes({ initial = 'GH', onChange = vi.fn(), error }: { initial?: string; onChange?: (id: string) => void; error?: string }) {
  const [value, setValue] = useState(initial);
  const change = (id: string) => {
    setValue(id);
    onChange(id);
  };
  return <FlowSearchSelect label="Country code" items={items} value={value} onChange={change} placeholder="Choose a country" searchLabel="Search country code" searchPlaceholder="Search" emptyText="No matches. Try another spelling." error={error} />;
}

const trigger = () => screen.getByRole('combobox', { name: /^Country code/ });
const search = () => screen.getByRole('textbox', { name: 'Search country code' });

describe('FlowSearchSelect', () => {
  it('shows the choice closed as its flag and short form, named by the label', () => {
    render(<Codes />);

    expect(trigger()).toHaveAccessibleName('Country code 🇬🇭 +233');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows the placeholder while nothing is chosen', () => {
    render(<Codes initial="" />);

    expect(trigger()).toHaveTextContent('Choose a country');
  });

  it('opens on a search with the chosen row marked, and finds a country by dialling code, ISO code or part of its name', async () => {
    const user = userEvent.setup();
    render(<Codes />);

    await user.click(trigger());
    expect(search()).toHaveFocus();
    expect(screen.getByRole('option', { name: 'Ghana +233' })).toHaveAttribute('aria-selected', 'true');

    await user.type(search(), '234');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['🇳🇬Nigeria +234']);
    await user.clear(search());
    await user.type(search(), '+234');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.clear(search());
    await user.type(search(), 'nig');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['🇳🇪Niger +227', '🇳🇬Nigeria +234']);
    await user.clear(search());
    await user.type(search(), 'cote');
    expect(screen.getByRole('option', { name: 'Côte d’Ivoire +225' })).toBeInTheDocument();
  });

  it('says when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Codes />);

    await user.click(trigger());
    await user.type(search(), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('No matches. Try another spelling.');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('is chosen from the keyboard and gives focus back to the field', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Codes onChange={onChange} />);

    trigger().focus();
    await user.keyboard('{ArrowDown}');
    expect(search()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Ghana +233' }).id);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(search()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Nigeria +234' }).id);
    await user.keyboard('{End}');
    expect(search()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Côte d’Ivoire +225' }).id);
    await user.keyboard('{Home}{Enter}');

    expect(onChange).toHaveBeenCalledWith('GH');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it('starts a search with a letter typed on the closed field', async () => {
    const user = userEvent.setup();
    render(<Codes />);

    trigger().focus();
    await user.keyboard('n');
    expect(search()).toHaveValue('n');
  });

  it('closes on Escape, giving focus back, and on a click outside', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Codes onChange={onChange} />);

    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();

    await user.click(trigger());
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is chosen with a click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Codes onChange={onChange} />);

    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Nigeria +234' }));
    expect(onChange).toHaveBeenCalledWith('NG');
    expect(trigger()).toHaveAccessibleName('Country code 🇳🇬 +234');
  });

  it('says what is wrong under the field and marks it invalid', () => {
    render(<Codes error="Choose a country." />);

    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription('Choose a country.');
  });
});
