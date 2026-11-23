import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhoneCountrySelect } from './phone-country-select';

const groups = { suggested: 'Suggested', africa: 'Africa', world: 'Rest of the world' };

describe('PhoneCountrySelect', () => {
  it('offers the suggested country first, then Africa without it, then the rest of the world, each with its dialling code', () => {
    render(<PhoneCountrySelect label="Country code" groups={groups} locale="en-NG" suggested="NG" value="NG" onChange={vi.fn()} />);

    const select = screen.getByLabelText('Country code');
    expect(select).toHaveValue('NG');
    expect(select).toHaveAttribute('autocomplete', 'tel-country-code');
    const [suggested, africa, world] = within(select).getAllByRole('group');
    expect(within(suggested!).getAllByRole('option').map((option) => option.textContent)).toEqual(['+234 Nigeria']);
    expect(within(africa!).queryByRole('option', { name: '+234 Nigeria' })).not.toBeInTheDocument();
    expect(within(africa!).getByRole('option', { name: '+233 Ghana' })).toBeInTheDocument();
    expect(within(world!).getByRole('option', { name: '+44 United Kingdom' })).toBeInTheDocument();
  });

  it('says which country was chosen', async () => {
    const onChange = vi.fn();
    render(<PhoneCountrySelect label="Country code" groups={groups} locale="en-NG" suggested="NG" value="NG" onChange={onChange} />);

    await userEvent.setup().selectOptions(screen.getByLabelText('Country code'), 'KE');
    expect(onChange).toHaveBeenCalledWith('KE');
  });
});
