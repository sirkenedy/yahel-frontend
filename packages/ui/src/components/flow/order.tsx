import { useId } from 'react';
import type { ReactNode } from 'react';
import { FlowIcon } from './flow-icon';

export interface PlanCardProps {
  /** The plan's name: "Yahel Business". */
  name: string;
  /** The price as it should be read, already formatted: "₦5,000". */
  price: string;
  /** What the price is for: "per person, a month". */
  unit: string;
  /** The price before a discount, struck through, with words that say so to assistive technology. */
  was?: { price: string; label: string };
  /** A short mark beside the name, such as "Free for 14 days". */
  badge?: string;
  features: readonly string[];
  /** Controls that belong to the plan, such as a promo code. */
  children?: ReactNode;
}

/** A plan on offer: what it is called, what it costs and what it includes. Not a control; the choices sit beside it. */
export function PlanCard({ name, price, unit, was, badge, features, children }: PlanCardProps) {
  const id = useId();
  return (
    <div className="ws-flow-plan" role="group" aria-labelledby={id}>
      <div className="ws-flow-plan__head">
        <span className="ws-flow-plan__name" id={id}>
          {name}
          {badge ? <span className="ws-flow-badge">{badge}</span> : null}
        </span>
        <span className="ws-flow-plan__cost">
          <span className="ws-flow-plan__price">
            {was ? (
              <s>
                <span className="ws-flow-hidden">{was.label} </span>
                {was.price}
              </s>
            ) : null}
            <strong>{price}</strong>
          </span>
          <span className="ws-flow-plan__unit">{unit}</span>
        </span>
      </div>
      <ul className="ws-flow-plan__features">
        {features.map((feature) => (
          <li key={feature}>
            <FlowIcon name="check" />
            {feature}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

interface OrderSummaryProps {
  title: string;
  /** A way to change the order, at the far side of the heading. */
  action?: ReactNode;
  children: ReactNode;
}

function OrderSummaryRoot({ title, action, children }: OrderSummaryProps) {
  const id = useId();
  return (
    <div className="ws-flow-order" role="group" aria-labelledby={id}>
      <div className="ws-flow-order__head">
        <h2 id={id}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

interface OrderSummaryItemProps {
  /** What is being bought: the plan, or a domain. */
  title: string;
  /** What it costs, already formatted, when the line has a price of its own. */
  amount?: string;
  /** A line that explains it: "Monthly plan · 3 people". */
  children?: ReactNode;
}

function OrderSummaryItem({ title, amount, children }: OrderSummaryItemProps) {
  return (
    <div className="ws-flow-order__item">
      <span className="ws-flow-order__what">
        <b>{title}</b>
        {children ? <span>{children}</span> : null}
      </span>
      {amount ? <span className="ws-flow-order__amount">{amount}</span> : null}
    </div>
  );
}

function OrderSummarySchedule({ label, children }: { /** Names the list: "What you pay and when". */ label: string; children: ReactNode }) {
  return (
    <ol className="ws-flow-order__schedule" aria-label={label}>
      {children}
    </ol>
  );
}

interface OrderSummaryChargeProps {
  /** "Today", or "From 5 Dec 2026". */
  when: string;
  amount: string;
  /** What is charged: "Free trial starts". */
  children: ReactNode;
}

function OrderSummaryCharge({ when, amount, children }: OrderSummaryChargeProps) {
  return (
    <li>
      <span className="ws-flow-order__when">{when}</span>
      <span className="ws-flow-order__what">{children}</span>
      <span className="ws-flow-order__amount">{amount}</span>
    </li>
  );
}

function OrderSummaryNote({ children }: { children: ReactNode }) {
  return <p className="ws-flow-order__note">{children}</p>;
}

interface OrderSummaryTotalProps {
  /** "Due today". */
  label: string;
  /** What is not in the amount: "+ VAT". */
  suffix?: string;
  /** The amount, already formatted. */
  children: ReactNode;
}

/** The amount to pay now. It is announced when it changes, because a choice elsewhere on the screen changes it. */
function OrderSummaryTotal({ label, suffix, children }: OrderSummaryTotalProps) {
  return (
    <p className="ws-flow-order__total" aria-live="polite" aria-atomic="true">
      <span>{label}</span>
      <span>
        <strong>{children}</strong>
        {suffix ? <small> {suffix}</small> : null}
      </span>
    </p>
  );
}

/** What is being bought, what it will cost and when, and what is due now. Every amount arrives formatted; nothing here does sums. */
export const OrderSummary = Object.assign(OrderSummaryRoot, { Item: OrderSummaryItem, Schedule: OrderSummarySchedule, Charge: OrderSummaryCharge, Note: OrderSummaryNote, Total: OrderSummaryTotal });

export type { OrderSummaryProps, OrderSummaryItemProps, OrderSummaryChargeProps, OrderSummaryTotalProps };

export interface PaymentCardChipProps {
  /** The card's network, when it is known: "Visa". */
  brand?: string;
  /** The last four digits. Never more of the number than that. */
  lastFour: string;
  /** Said in place of the dots: "Visa card ending in 4081". */
  label: string;
}

/** Names the card being paid with by its network and last four digits, above a step that is about it. */
export function PaymentCardChip({ brand, lastFour, label }: PaymentCardChipProps) {
  return (
    <span className="ws-flow-cardchip">
      <span aria-hidden="true">
        {brand ? <b>{brand}</b> : null} •• {lastFour}
      </span>
      <span className="ws-flow-hidden">{label}</span>
    </span>
  );
}
