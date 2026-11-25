import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { countriesQuery } from './countries';
import { countriesFixture } from './countries.fixture';
import { CountrySelect } from './country-select';
import { flowMessages as m } from './messages';

const countries = vi.hoisted(() => vi.fn());
vi.mock('../session', () => ({ session: { api: { reference: { countries } } } }));

const renderSelect = (queryClient: QueryClient, forPhone: boolean, onChange = vi.fn(), value = 'NG') =>
  render(
    <QueryClientProvider client={queryClient}>
      <CountrySelect label="Country code" locale="en-NG" value={value} onChange={onChange} forPhone={forPhone} />
    </QueryClientProvider>,
  );

const loaded = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(countriesQuery.queryKey, countriesFixture);
  return queryClient;
};

describe('CountrySelect', () => {
  it('offers every country A to Z, each flagged with its dialling code, and keeps a choice already made', () => {
    const onChange = vi.fn();
    renderSelect(loaded(), true, onChange);

    const select = screen.getByLabelText('Country code');
    expect(select).toHaveValue('NG');
    expect(select).toHaveAttribute('autocomplete', 'tel-country-code');
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['🇬🇭 +233 Ghana', '🇯🇲 +1 Jamaica', '🇰🇪 +254 Kenya', '🇳🇬 +234 Nigeria', '🇬🇧 +44 United Kingdom']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('starts on where the browser says the person is, when nothing has been chosen', () => {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    const zone = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ ...resolved, timeZone: 'Africa/Nairobi' });
    const onChange = vi.fn();
    renderSelect(loaded(), true, onChange, '');

    expect(onChange).toHaveBeenCalledWith('KE');
    zone.mockRestore();
  });

  it('names a country without a dialling code when it is not a phone’s', () => {
    renderSelect(loaded(), false);

    expect(screen.getByLabelText('Country code')).toHaveAttribute('autocomplete', 'country');
    expect(screen.getByRole('option', { name: '🇬🇭 Ghana' })).toBeInTheDocument();
  });

  it('says which country was chosen', async () => {
    const onChange = vi.fn();
    renderSelect(loaded(), true, onChange);

    await userEvent.setup().selectOptions(screen.getByLabelText('Country code'), 'KE');
    expect(onChange).toHaveBeenCalledWith('KE');
  });

  it('says when the list could not load, and loads it again on Try again', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    countries.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(countriesFixture);
    renderSelect(queryClient, true);

    expect(await screen.findByText(m.listFailed)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: m.tryAgain }));
    expect(await screen.findByRole('option', { name: '🇳🇬 +234 Nigeria' })).toBeInTheDocument();
  });
});
