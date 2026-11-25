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

const groups = { suggested: 'Suggested', all: 'All countries' };

const renderSelect = (queryClient: QueryClient, forPhone: boolean, onChange = vi.fn()) =>
  render(
    <QueryClientProvider client={queryClient}>
      <CountrySelect label="Country code" groups={groups} locale="en-NG" suggested="NG" value="NG" onChange={onChange} forPhone={forPhone} />
    </QueryClientProvider>,
  );

const loaded = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(countriesQuery.queryKey, countriesFixture);
  return queryClient;
};

describe('CountrySelect', () => {
  it('offers the suggested country first, then every other country A to Z, each flagged with its dialling code', () => {
    renderSelect(loaded(), true);

    const select = screen.getByLabelText('Country code');
    expect(select).toHaveValue('NG');
    expect(select).toHaveAttribute('autocomplete', 'tel-country-code');
    const [suggested, all] = within(select).getAllByRole('group');
    expect(within(suggested!).getAllByRole('option').map((option) => option.textContent)).toEqual(['🇳🇬 +234 Nigeria']);
    expect(within(all!).getAllByRole('option').map((option) => option.textContent)).toEqual(['🇬🇭 +233 Ghana', '🇯🇲 +1 Jamaica', '🇰🇪 +254 Kenya', '🇬🇧 +44 United Kingdom']);
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
