import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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

const field = () => screen.getByRole('combobox', { name: /^Country code/ });

describe('CountrySelect', () => {
  it('offers every country A to Z, each flagged with its dialling code, and keeps a choice already made', async () => {
    const onChange = vi.fn();
    renderSelect(loaded(), true, onChange);

    expect(field()).toHaveAccessibleName('Country code 🇳🇬 +234');
    await userEvent.setup().click(field());
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['🇬🇭Ghana +233', '🇯🇲Jamaica +1', '🇰🇪Kenya +254', '🇳🇬Nigeria +234', '🇬🇧United Kingdom +44']);
    expect(screen.getByRole('option', { name: 'Nigeria +234' })).toHaveAttribute('aria-selected', 'true');
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

  it('names a country, with its ISO code in the list, when it is not a phone’s', async () => {
    renderSelect(loaded(), false);

    expect(field()).toHaveAccessibleName('Country code 🇳🇬 Nigeria');
    await userEvent.setup().click(field());
    expect(screen.getByRole('option', { name: 'Ghana GH' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: m.searchCountry })).toHaveAttribute('placeholder', m.search);
  });

  it('finds a country by its dialling code and says which was chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSelect(loaded(), true, onChange);

    await user.click(field());
    await user.type(screen.getByRole('textbox', { name: m.searchCountryCode }), '254');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('KE');
  });

  it('says when the list could not load, and loads it again on Try again', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    countries.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(countriesFixture);
    renderSelect(queryClient, true);

    expect(await screen.findByText(m.listFailed)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: m.tryAgain }));
    expect(await screen.findByRole('combobox', { name: 'Country code 🇳🇬 +234' })).toBeInTheDocument();
  });
});
