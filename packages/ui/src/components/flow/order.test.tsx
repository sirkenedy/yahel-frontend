import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderSummary, PaymentCardChip, PlanCard } from './order';

describe('PlanCard', () => {
  const features = ['Mail on your own domain', '30 GB storage per person'];

  it('is a group named by the plan, with its price, what the price is for and what it includes', () => {
    render(<PlanCard name="Yahel Business" price="₦5,000" unit="per person, a month" features={features} />);

    const card = screen.getByRole('group', { name: 'Yahel Business' });
    expect(within(card).getByText('₦5,000')).toBeInTheDocument();
    expect(within(card).getByText('per person, a month')).toBeInTheDocument();
    expect(within(card).getAllByRole('listitem').map((item) => item.textContent)).toEqual(features);
  });

  it('strikes through the price before a discount and says in words that it was the price', () => {
    render(<PlanCard name="Yahel Business" price="₦4,000" was={{ price: '₦5,000', label: 'Was' }} unit="per person, a month" features={features} />);

    expect(screen.getByText('₦5,000').closest('s')).toHaveTextContent('Was ₦5,000');
    expect(screen.getByText('₦4,000').tagName).toBe('STRONG');
  });

  it('shows a badge beside the name and the controls it is given', () => {
    render(
      <PlanCard name="Yahel Business" badge="Free for 14 days" price="₦5,000" unit="per person, a month" features={features}>
        <button type="button">Add a promo code</button>
      </PlanCard>,
    );

    expect(screen.getByRole('group', { name: /Yahel Business/ })).toHaveTextContent('Free for 14 days');
    expect(screen.getByRole('button', { name: 'Add a promo code' })).toBeInTheDocument();
  });
});

describe('OrderSummary', () => {
  const summary = (due = '₦18,500') => (
    <OrderSummary title="Order summary" action={<a href="/business/plan">Change plan</a>}>
      <OrderSummary.Item title="Yahel Business">Monthly plan · 3 people</OrderSummary.Item>
      <OrderSummary.Schedule label="What you pay and when">
        <OrderSummary.Charge when="Today" amount="₦0">
          Free trial starts
        </OrderSummary.Charge>
        <OrderSummary.Charge when="From 5 Dec 2026" amount="₦15,000 / month">
          Monthly plan
        </OrderSummary.Charge>
      </OrderSummary.Schedule>
      <OrderSummary.Note>Prices exclude 7.5% VAT.</OrderSummary.Note>
      <OrderSummary.Item title="northwindstudio.com" amount="₦18,500 / year">
        Domain registration
      </OrderSummary.Item>
      <OrderSummary.Total label="Due today" suffix="+ VAT">
        {due}
      </OrderSummary.Total>
    </OrderSummary>
  );

  it('is a group named by its heading, with the way to change the order beside it', () => {
    render(summary());

    const group = screen.getByRole('group', { name: 'Order summary' });
    expect(within(group).getByRole('heading', { level: 2, name: 'Order summary' })).toBeInTheDocument();
    expect(within(group).getByRole('link', { name: 'Change plan' })).toHaveAttribute('href', '/business/plan');
  });

  it('lists what is charged and when, in order, as a named list', () => {
    render(summary());

    const charges = within(screen.getByRole('list', { name: 'What you pay and when' })).getAllByRole('listitem');
    expect(charges.map((charge) => charge.textContent)).toEqual(['TodayFree trial starts₦0', 'From 5 Dec 2026Monthly plan₦15,000 / month']);
  });

  it('shows each thing bought with its explanation and, when it has one, its own price', () => {
    render(summary());

    expect(screen.getByText('Monthly plan · 3 people')).toBeInTheDocument();
    expect(screen.getByText('northwindstudio.com').closest('.ws-flow-order__item')).toHaveTextContent('₦18,500 / year');
    expect(screen.getByText('Prices exclude 7.5% VAT.')).toBeInTheDocument();
  });

  it('announces the amount due, whole, whenever it changes', () => {
    const { rerender } = render(summary());
    const total = screen.getByText('Due today').closest('p')!;

    expect(total).toHaveAttribute('aria-live', 'polite');
    expect(total).toHaveAttribute('aria-atomic', 'true');
    expect(total).toHaveTextContent('Due today₦18,500 + VAT');

    rerender(summary('₦78,500'));
    expect(total).toHaveTextContent('Due today₦78,500 + VAT');
  });
});

describe('PaymentCardChip', () => {
  it('shows the network and the last four digits, and says them in words', () => {
    render(<PaymentCardChip brand="Visa" lastFour="4081" label="Visa card ending in 4081" />);

    expect(screen.getByText('Visa card ending in 4081')).toBeInTheDocument();
    expect(screen.getByText('Visa').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Visa').parentElement).toHaveTextContent('Visa •• 4081');
  });

  it('shows only the digits when the network is not known', () => {
    render(<PaymentCardChip lastFour="4081" label="Card ending in 4081" />);

    expect(document.querySelector('.ws-flow-cardchip [aria-hidden]')).toHaveTextContent(/^\s*•• 4081$/);
  });
});
