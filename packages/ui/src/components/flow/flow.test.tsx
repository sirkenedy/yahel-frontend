import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AccountAvatar,
  AccountChip,
  AccountList,
  BrandMark,
  BrandMoment,
  Choice,
  ChoiceGroup,
  CodeInput,
  DemoMarker,
  FlowButton,
  FlowCallout,
  FlowCheckbox,
  FlowDivider,
  FlowFacts,
  FlowLink,
  FlowLinkCard,
  FlowNotice,
  FlowPasswordField,
  FlowProgress,
  FlowSelect,
  FlowShell,
  FlowStep,
  FlowSuggestions,
  FlowTextField,
  FlowWaiting,
  LinkRouter,
  PasswordStrength,
  Receipt,
  SuccessMark,
  UsernameHint,
} from '../../index';
import type { CodeInputProps } from '../../index';

const pointerDevice = (fine: boolean) => vi.stubGlobal('matchMedia', (query: string) => ({ matches: fine, media: query }));

afterEach(() => vi.unstubAllGlobals());

describe('FlowShell', () => {
  it('lays out the brand, the question, the summary and the footer as landmarks', () => {
    render(
      <FlowShell skipLabel="Skip to the question">
        <FlowShell.Header brand={<BrandMark label="Yahel" />}>
          <FlowButton variant="round" aria-label="Switch to dark mode">
            d
          </FlowButton>
        </FlowShell.Header>
        <FlowShell.Main>
          <FlowShell.Question>question</FlowShell.Question>
          <FlowShell.Summary label="Your account so far">summary</FlowShell.Summary>
        </FlowShell.Main>
        <FlowShell.Footer dataLocation="Your data stays in Africa.">
          <FlowShell.Language label="Language">English (Nigeria)</FlowShell.Language>
          <FlowShell.FooterLink href="https://yahel.example/privacy">Privacy</FlowShell.FooterLink>
        </FlowShell.Footer>
      </FlowShell>,
    );

    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('img', { name: 'Yahel' }));
    expect(screen.getByRole('main')).toHaveTextContent('question');
    expect(screen.getByRole('complementary', { name: 'Your account so far' })).toHaveTextContent('summary');
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('Your data stays in Africa.');
    expect(footer).toHaveTextContent('Language: English (Nigeria)');
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://yahel.example/privacy');
  });

  it('links the brand through the router, so pressing it does not reload the page', async () => {
    const navigate = vi.fn();
    render(
      <LinkRouter navigate={navigate}>
        <FlowShell.BrandLink href="/signin" label="Yahel sign in">
          <BrandMark label="Yahel" />
        </FlowShell.BrandLink>
      </LinkRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Yahel sign in' }));

    expect(navigate).toHaveBeenCalledWith('/signin', undefined);
  });

  it('offers a skip link that targets the main region', () => {
    render(
      <FlowShell skipLabel="Skip to the question">
        <FlowShell.Main>
          <FlowShell.Question>question</FlowShell.Question>
        </FlowShell.Main>
      </FlowShell>,
    );

    expect(screen.getByRole('link', { name: 'Skip to the question' })).toHaveAttribute('href', `#${screen.getByRole('main').id}`);
  });
});

describe('FlowStep', () => {
  const step = (direction?: 'forward' | 'back') => (
    <FlowStep direction={direction}>
      <FlowStep.Back href="/signin/email">Back</FlowStep.Back>
      <FlowStep.Intro>
        <FlowStep.Heading>Enter your password.</FlowStep.Heading>
        <FlowStep.Lede>It stays on this device.</FlowStep.Lede>
      </FlowStep.Intro>
      <FlowStep.Body>
        <FlowTextField label="Password" />
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowButton variant="primary">Sign in</FlowButton>
      </FlowStep.Actions>
      <FlowStep.Links>
        <FlowLink href="/signin/recover">Forgot password?</FlowLink>
      </FlowStep.Links>
    </FlowStep>
  );

  it('is a region named by its heading, with a back link', () => {
    render(step());

    expect(screen.getByRole('region', { name: 'Enter your password.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Enter your password.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/signin/email');
  });

  it('moves focus to the first field where a keyboard is likely', () => {
    pointerDevice(true);
    render(step());

    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('moves focus to the heading on touch screens, so the keyboard does not cover the question', () => {
    pointerDevice(false);
    render(step());

    expect(screen.getByRole('heading', { name: 'Enter your password.' })).toHaveFocus();
  });

  it('passes over the hidden username hint when choosing the first field', () => {
    pointerDevice(true);
    render(
      <FlowStep>
        <FlowStep.Heading>Enter your password.</FlowStep.Heading>
        <UsernameHint value="amara@northwind.example" />
        <FlowTextField label="Password" />
      </FlowStep>,
    );

    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('moves focus to the heading when the step has no field', () => {
    pointerDevice(true);
    render(
      <FlowStep>
        <FlowStep.Heading>We’re on it.</FlowStep.Heading>
      </FlowStep>,
    );

    expect(screen.getByRole('heading', { name: 'We’re on it.' })).toHaveFocus();
  });

  it('records the direction of travel for the transition', () => {
    render(step('back'));

    expect(screen.getByRole('region')).toHaveAttribute('data-direction', 'back');
  });

  it('refuses to render a part outside a step', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<FlowStep.Heading>Lost</FlowStep.Heading>)).toThrow(/inside <FlowStep>/);
    quiet.mockRestore();
  });
});

describe('FlowButton and FlowLink', () => {
  it('presses by pointer and keyboard', async () => {
    const onPress = vi.fn();
    render(
      <FlowButton variant="primary" onPress={onPress}>
        Continue
      </FlowButton>,
    );
    const button = screen.getByRole('button', { name: 'Continue' });

    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('says what is happening while pending and ignores further presses', async () => {
    const onPress = vi.fn();
    render(
      <FlowButton variant="primary" isPending pendingLabel="Signing in…" onPress={onPress}>
        Sign in
      </FlowButton>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Signing in…' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders navigation as a real link and hands in-app addresses to the router', async () => {
    const navigate = vi.fn();
    render(
      <LinkRouter navigate={navigate}>
        <FlowLink href="/signin/help">Forgot your email?</FlowLink>
      </LinkRouter>,
    );
    const link = screen.getByRole('link', { name: 'Forgot your email?' });
    expect(link).toHaveAttribute('href', '/signin/help');

    await userEvent.click(link);

    expect(navigate).toHaveBeenCalledWith('/signin/help', undefined);
  });
});

describe('FlowTextField', () => {
  it('ties the visible label, the help and the error to the input', () => {
    const { rerender } = render(<FlowTextField label="Email" help="Use the one you signed up with." />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Use the one you signed up with.');

    rerender(<FlowTextField label="Email" help="Use the one you signed up with." error="Enter your email." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Enter your email.'));
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Use the one you signed up with.'));
  });

  it('passes form attributes through to the input', () => {
    render(<FlowTextField label="Email" name="email" type="email" autoComplete="username" inputMode="email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'username');
  });
});

describe('UsernameHint', () => {
  it('is a real username text input that nobody can see, reach or hear', () => {
    const { container } = render(<UsernameHint value="amara@northwind.example" />);
    const hint = container.querySelector('input')!;

    expect(hint).toHaveAttribute('type', 'text');
    expect(hint).toHaveAttribute('autocomplete', 'username');
    expect(hint).toHaveValue('amara@northwind.example');
    expect(hint).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('field and button refs', () => {
  function Harness() {
    const field = useRef<HTMLInputElement>(null);
    const code = useRef<HTMLInputElement>(null);
    const action = useRef<HTMLButtonElement>(null);
    const [codeValue, setCodeValue] = useState('');
    return (
      <>
        <FlowTextField label="Email" inputRef={field} />
        <CodeInput label="6-digit code" value={codeValue} onChange={setCodeValue} inputRef={code} />
        <FlowButton ref={action}>Remove</FlowButton>
        <FlowButton onPress={() => field.current?.focus()}>Focus email</FlowButton>
        <FlowButton onPress={() => code.current?.focus()}>Focus code</FlowButton>
        <FlowButton onPress={() => action.current?.focus()}>Focus remove</FlowButton>
      </>
    );
  }

  it('hand out their elements so an owner can move focus without searching the page', async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Focus email' }));
    expect(screen.getByLabelText('Email')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Focus code' }));
    expect(screen.getByLabelText('6-digit code')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Focus remove' }));
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveFocus();
  });
});

describe('FlowPasswordField', () => {
  const setup = () => {
    render(<FlowPasswordField label="Password" showText="Show" hideText="Hide" showLabel="Show password" hideLabel="Hide password" autoComplete="current-password" />);
    return userEvent.setup();
  };

  it('hides the value by default and names its control for what it will do', () => {
    setup();

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveTextContent('Show');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows and hides the value without changing it, and never submits', async () => {
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <FlowPasswordField label="Password" showText="Show" hideText="Hide" showLabel="Show password" hideLabel="Hide password" />
      </form>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Password'), 'correct horse');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Password')).toHaveValue('correct horse');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('follows its owner when controlled', async () => {
    const onRevealedChange = vi.fn();
    render(<FlowPasswordField label="Password" showText="Show" hideText="Hide" showLabel="Show password" hideLabel="Hide password" isRevealed={false} onRevealedChange={onRevealedChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(onRevealedChange).toHaveBeenCalledWith(true);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });
});

describe('CodeInput', () => {
  function Harness(props: Partial<CodeInputProps>) {
    const [value, setValue] = useState('');
    return <CodeInput label="6-digit code" value={value} onChange={setValue} {...props} />;
  }
  const boxes = (container: HTMLElement) => [...container.querySelectorAll('[data-current]')].map((box) => box.textContent);

  it('is one labelled field that the browser can fill from a message', () => {
    render(<Harness />);

    const input = screen.getByLabelText('6-digit code');
    expect(screen.getAllByRole('textbox')).toEqual([input]);
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('fills every box from a paste, ignoring spaces and anything past the last box', async () => {
    const { container } = render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('6-digit code'));
    await user.paste('482 910 77');

    expect(screen.getByLabelText('6-digit code')).toHaveValue('482910');
    expect(boxes(container)).toEqual(['4', '8', '2', '9', '1', '0']);
  });

  it('steps back one box on Backspace', async () => {
    const { container } = render(<Harness />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('6-digit code'), '482');
    expect(container.querySelector('[data-current="true"]')).toBe(container.querySelectorAll('[data-current]')[3]);

    await user.keyboard('{Backspace}');

    expect(boxes(container)).toEqual(['4', '8', '', '', '', '']);
    expect(container.querySelector('[data-current="true"]')).toBe(container.querySelectorAll('[data-current]')[2]);
  });

  it('drops letters from a digit code and keeps them, with their case, in an alphanumeric one', async () => {
    const { unmount } = render(<Harness />);
    await userEvent.type(screen.getByLabelText('6-digit code'), 'a1b2');
    expect(screen.getByLabelText('6-digit code')).toHaveValue('12');
    unmount();

    render(<Harness characters="alphanumeric" />);
    await userEvent.type(screen.getByLabelText('6-digit code'), 'A7-kZq2x');
    expect(screen.getByLabelText('6-digit code')).toHaveValue('A7kZq2');
    expect(screen.getByLabelText('6-digit code')).toHaveAttribute('inputmode', 'text');
  });

  it('attaches the error to the field', () => {
    render(<Harness error="Enter all 6 digits." />);

    expect(screen.getByLabelText('6-digit code')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('6-digit code')).toHaveAccessibleDescription('Enter all 6 digits.');
  });
});

describe('AccountChip and AccountList', () => {
  it('shows the account a step is about', () => {
    render(<AccountChip email="amara@northwind.example" />);

    expect(screen.getByText('amara@northwind.example')).toBeInTheDocument();
  });

  it('lists accounts as rows that can be chosen, with a last row for another account', async () => {
    const pick = vi.fn();
    const another = vi.fn();
    render(
      <AccountList label="Accounts on this device">
        <AccountList.Account name="Amara Okafor" email="amara.okafor@yahel.example" detail="Personal" actionPrefix="Continue as" onPress={pick} />
        <AccountList.Account name="Amara Okafor" email="amara@northwind.example" kind="organisation" detail="Northwind Studio" actionPrefix="Continue as" onPress={pick} />
        <AccountList.Action onPress={another}>Use another account</AccountList.Action>
      </AccountList>,
    );

    const list = screen.getByRole('list', { name: 'Accounts on this device' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(list).toHaveTextContent('AO');
    expect(list).toHaveTextContent('Northwind Studio');

    await userEvent.click(screen.getByRole('button', { name: /^Continue as.*amara@northwind\.example/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Use another account' }));

    expect(pick).toHaveBeenCalledTimes(1);
    expect(another).toHaveBeenCalledTimes(1);
  });

  it('marks an organisation by its domain initial', () => {
    render(
      <AccountList label="Accounts">
        <AccountList.Account name="Amara Okafor" email="amara@northwind.example" kind="organisation" actionPrefix="Continue as" onPress={() => undefined} />
      </AccountList>,
    );

    expect(screen.getByRole('button', { name: /^Continue as/ })).toHaveTextContent(/N\s*Amara Okafor/);
  });

  it('keeps a row from being chosen while disabled, and places extra controls after it', async () => {
    const pick = vi.fn();
    render(
      <AccountList label="Accounts">
        <AccountList.Account name="Amara Okafor" email="amara@northwind.example" actionPrefix="Continue as" onPress={pick} isDisabled>
          <FlowButton variant="destructive">Remove</FlowButton>
        </AccountList.Account>
      </AccountList>,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Continue as/ }));

    expect(pick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeEnabled();
  });
});

describe('FlowStep parts for a step that asks for several things', () => {
  it('names a group of fields with a second-level heading', () => {
    render(<FlowStep.Subheading>Card details</FlowStep.Subheading>);

    expect(screen.getByRole('heading', { level: 2, name: 'Card details' })).toBeInTheDocument();
  });

  it('keeps two short fields side by side with the halves layout', () => {
    render(
      <FlowStep.Row layout="halves">
        <span>Expiry</span>
        <span>Security code</span>
      </FlowStep.Row>,
    );

    expect(screen.getByText('Expiry').parentElement).toHaveClass('ws-flow-step__row--halves');
  });

  it('puts the lead first, then what is kept in view, then the rest, so one column reads in that order', () => {
    render(
      <FlowStep.Split lead={<p>How many people?</p>} aside={<p>Order summary</p>}>
        <p>Card details</p>
      </FlowStep.Split>,
    );

    const split = screen.getByText('Order summary').parentElement!.parentElement!;
    expect(split.textContent).toBe('How many people?Order summaryCard details');
    expect(Array.from(split.children).map((part) => part.className)).toEqual(['ws-flow-step__body ws-flow-step__lead', 'ws-flow-step__aside', 'ws-flow-step__body ws-flow-step__rest']);
  });
});

describe('Receipt row with a detail', () => {
  it('shows a quieter second line under the answer, inside the same description', () => {
    render(
      <Receipt label="Your workspace">
        <Receipt.Row label="Business" detail="10–99 people · Nigeria">
          Northwind Studio
        </Receipt.Row>
      </Receipt>,
    );

    expect(screen.getByText('10–99 people · Nigeria').closest('dd')).toHaveTextContent('Northwind Studio10–99 people · Nigeria');
  });
});

describe('Choice with a tag and an amount', () => {
  it('reads the tag and the amount as part of the option, between its words and its mark', () => {
    render(
      <ChoiceGroup label="Available domains" value="" onChange={() => undefined}>
        <Choice value="example.com" tag="Best match" meta="₦18,500 a year">
          example.com
        </Choice>
        <Choice value="example.net" meta="₦9,000 a year">
          example.net
        </Choice>
      </ChoiceGroup>,
    );

    expect(screen.getByRole('radio', { name: 'example.com Best match ₦18,500 a year' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'example.net ₦9,000 a year' })).toBeInTheDocument();
    expect(screen.getAllByText(/a year$/)).toHaveLength(2);
  });
});

describe('ChoiceGroup', () => {
  function Harness() {
    const [value, setValue] = useState<'phone' | 'email'>('phone');
    return (
      <ChoiceGroup label="Where to send the code" value={value} onChange={setValue}>
        <Choice value="phone">Text +234 ••• ••• ••42</Choice>
        <Choice value="email" detail="Arrives in a minute">
          Email a•••@example.com
        </Choice>
      </ChoiceGroup>
    );
  }

  it('is a named radio group with one option chosen', () => {
    render(<Harness />);

    expect(screen.getByRole('radiogroup', { name: 'Where to send the code' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Text/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Email/ })).not.toBeChecked();
  });

  it('refuses an option outside a group', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Choice value="phone">Text</Choice>)).toThrow(/inside <ChoiceGroup>/);
    quiet.mockRestore();
  });

  it('changes by pointer and by arrow key', async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('radio', { name: /Email/ }));
    expect(screen.getByRole('radio', { name: /Email/ })).toBeChecked();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: /Text/ })).toBeChecked();
  });
});

describe('feedback', () => {
  it('announces a failure at once and other notices politely', () => {
    render(
      <>
        <FlowNotice tone="danger">That email and password don’t match.</FlowNotice>
        <FlowNotice>New code sent.</FlowNotice>
      </>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('That email and password don’t match.');
    expect(screen.getByRole('status')).toHaveTextContent('New code sent.');
  });

  it('describes a wait as a status', () => {
    render(<FlowWaiting title="Waiting for this device">Follow the prompt from your browser or phone.</FlowWaiting>);

    expect(screen.getByRole('status')).toHaveTextContent('Waiting for this deviceFollow the prompt from your browser or phone.');
  });

  it('keeps the success mark and the divider rules out of the accessibility tree', () => {
    const { container } = render(
      <>
        <SuccessMark />
        <FlowDivider>or</FlowDivider>
      </>,
    );

    expect(container.querySelector('.ws-flow-success')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('labels stand-in data with a note', () => {
    render(<DemoMarker>Demo data</DemoMarker>);

    expect(screen.getByRole('note')).toHaveTextContent('Demo data');
  });

  it('shows password strength in words, and nothing before anything is typed', () => {
    const { container, rerender } = render(<PasswordStrength score={0}>Too weak · 0 characters</PasswordStrength>);
    expect(container).not.toHaveTextContent('Too weak');

    rerender(<PasswordStrength score={3}>Good · 14 characters</PasswordStrength>);
    expect(screen.getByText('Good · 14 characters')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-on="true"]')).toHaveLength(3);
  });
});

describe('FlowProgress and Receipt', () => {
  it('says how far along the flow is', () => {
    const { container } = render(
      <FlowProgress current={3} total={7}>
        About 90 sec
      </FlowProgress>,
    );

    expect(screen.getByText('03 / 07 · About 90 sec')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-done="true"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-done]')).toHaveLength(7);
  });

  it('lists what has been answered and what is still to come', () => {
    render(
      <Receipt title="Creating your account">
        <Receipt.Row label="Name">Amara Okafor</Receipt.Row>
        <Receipt.Row label="Address" state="current">
          Choosing now
        </Receipt.Row>
        <Receipt.Row label="Security" state="upcoming">
          Next
        </Receipt.Row>
      </Receipt>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Creating your account' })).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Name', 'Address', 'Security']);
    expect(screen.getByText('Choosing now').closest('[data-state]')).toHaveAttribute('data-state', 'current');
  });
});

describe('Receipt on the review screen', () => {
  it('names itself for assistive technology when it has no heading, and puts a way to change each answer at the end of its line', async () => {
    const onEdit = vi.fn();
    render(
      <Receipt label="Your account">
        <Receipt.Row
          label="Name"
          action={
            <FlowButton variant="link" onPress={onEdit}>
              Edit
            </FlowButton>
          }
        >
          Amara Okafor
        </Receipt.Row>
      </Receipt>,
    );

    const receipt = screen.getByRole('group', { name: 'Your account' });
    expect(within(receipt).queryByRole('heading')).not.toBeInTheDocument();
    expect(within(receipt).getAllByRole('definition')[0]).toHaveTextContent('Amara Okafor');
    await userEvent.click(within(receipt).getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});

describe('FlowSelect', () => {
  function Month({ error }: { error?: string }) {
    const [value, setValue] = useState('');
    return (
      <FlowSelect label="Month" value={value} onChange={setValue} error={error} name="month" autoComplete="bday-month" isSensitive>
        <option value="">Month</option>
        <option value="3">March</option>
        <option value="4">April</option>
      </FlowSelect>
    );
  }

  it('is a labelled select that reports the chosen value', async () => {
    render(<Month />);
    const select = screen.getByRole('combobox', { name: 'Month' });

    await userEvent.selectOptions(select, 'March');

    expect(select).toHaveValue('3');
    expect(select).toHaveAttribute('autocomplete', 'bday-month');
    expect(select).not.toHaveAttribute('aria-invalid');
    expect(select.parentElement).toHaveAttribute('data-sensitive', 'true');
  });

  it('marks itself invalid and ties the problem to the select', () => {
    render(<Month error="Choose a month." />);

    const select = screen.getByRole('combobox', { name: 'Month' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Choose a month.');
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a month.');
  });

  it('hands out the select element so focus can be moved to it', () => {
    function Focused() {
      const ref = useRef<HTMLSelectElement>(null);
      return (
        <>
          <FlowSelect label="Month" value="" onChange={() => undefined} inputRef={ref}>
            <option value="">Month</option>
          </FlowSelect>
          <button onClick={() => ref.current?.focus()}>focus</button>
        </>
      );
    }
    render(<Focused />);

    screen.getByRole('button', { name: 'focus' }).click();

    expect(screen.getByRole('combobox', { name: 'Month' })).toHaveFocus();
  });
});

describe('sign-up field additions', () => {
  it('shows fixed text after the value and good news beneath it', () => {
    render(<FlowTextField label="Your Yahel address" value="amara.okafor" onChange={() => undefined} suffix="@yahel.example" success="Available. It’s yours if you want it." />);

    expect(screen.getByText('@yahel.example')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Available. It’s yours if you want it.');
  });

  it('lets a problem replace the good news', () => {
    render(<FlowTextField label="Your Yahel address" value="amara" onChange={() => undefined} success="Available." error="That address is taken." />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByText('That address is taken.')).toBeInTheDocument();
  });

  it('keeps the announcing region ready for a field that may have good news, and has none otherwise', () => {
    const { rerender } = render(<FlowTextField label="Your Yahel address" value="" onChange={() => undefined} success={null} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerender(<FlowTextField label="Email" value="" onChange={() => undefined} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('marks a personal value so the shell can hide it', () => {
    const { container } = render(
      <FlowShell skipLabel="Skip" isPrivate>
        <FlowTextField label="Day" value="14" onChange={() => undefined} isSensitive />
        <FlowTextField label="First name" value="Amara" onChange={() => undefined} />
      </FlowShell>,
    );

    expect(container.querySelector('.ws-flow')).toHaveAttribute('data-private', 'true');
    expect(container.querySelectorAll('[data-sensitive]')).toHaveLength(1);
  });

  it('lays related fields out on one line', () => {
    const { container } = render(
      <FlowStep>
        <FlowStep.Heading>q</FlowStep.Heading>
        <FlowStep.Row layout="date" label="Date of birth">
          <FlowTextField label="Day" value="" onChange={() => undefined} />
          <FlowTextField label="Year" value="" onChange={() => undefined} />
        </FlowStep.Row>
      </FlowStep>,
    );

    expect(container.querySelector('.ws-flow-step__row--date')?.children).toHaveLength(2);
    expect(within(screen.getByRole('group', { name: 'Date of birth' })).getAllByRole('textbox')).toHaveLength(2);
  });
});

describe('FlowSuggestions, FlowCheckbox and FlowLinkCard', () => {
  it('groups one-tap answers under a label', async () => {
    const onPick = vi.fn();
    render(
      <FlowSuggestions label="Also free">
        <FlowButton variant="chip" onPress={() => onPick('okafor.amara')}>
          okafor.amara
        </FlowButton>
      </FlowSuggestions>,
    );

    await userEvent.click(within(screen.getByRole('group', { name: 'Also free' })).getByRole('button', { name: 'okafor.amara' }));

    expect(onPick).toHaveBeenCalledWith('okafor.amara');
  });

  it('is a checkbox whose whole line turns it on and off', async () => {
    function Tips() {
      const [on, setOn] = useState(false);
      return (
        <FlowCheckbox isSelected={on} onChange={setOn}>
          Email me tips and product news
        </FlowCheckbox>
      );
    }
    render(<Tips />);
    const box = screen.getByRole('checkbox', { name: 'Email me tips and product news' });
    expect(box).not.toBeChecked();

    await userEvent.click(screen.getByText('Email me tips and product news'));
    expect(box).toBeChecked();

    await userEvent.keyboard(' ');
    expect(box).not.toBeChecked();
  });

  it('is a link that says what it is for, and goes through the router', async () => {
    const navigate = vi.fn();
    render(
      <LinkRouter navigate={navigate}>
        <FlowLinkCard href="/personal/contact" icon="i" title="Add someone you trust">
          A backup way back in.
        </FlowLinkCard>
      </LinkRouter>,
    );

    const link = screen.getByRole('link', { name: /Add someone you trust.*A backup way back in\./ });
    await userEvent.click(link);

    expect(navigate).toHaveBeenCalledWith('/personal/contact', undefined);
  });
});

describe('FlowCallout, FlowFacts and BrandMoment', () => {
  it('reassures with one fact and its explanation', () => {
    render(
      <FlowCallout icon="i" title="Your password still works">
        The passkey stays on this device.
      </FlowCallout>,
    );

    expect(screen.getByText('Your password still works')).toBeInTheDocument();
    expect(screen.getByText('The passkey stays on this device.')).toBeInTheDocument();
  });

  it('reads a tag as part of the title', () => {
    const { container } = render(
      <FlowCallout icon="i" title="Passkey on this device" tag="Required for admins">
        Fingerprint, face or screen lock.
      </FlowCallout>,
    );

    expect(container.textContent).toContain('Passkey on this device Required for admins');
  });

  it('lists facts with a drawn icon in place of the tick, still read only as the words', () => {
    render(
      <FlowFacts>
        <FlowFacts.Item icon="building" lead="amara@northwind.example belongs to Northwind Studio.">
          As an admin, you decide which apps your team can use.
        </FlowFacts.Item>
      </FlowFacts>,
    );

    expect(screen.getByRole('listitem')).toHaveTextContent('amara@northwind.example belongs to Northwind Studio. As an admin, you decide which apps your team can use.');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('lists facts, each led by the words that carry it', () => {
    render(
      <FlowFacts>
        <FlowFacts.Item lead="They can see">your name.</FlowFacts.Item>
        <FlowFacts.Item lead="They can’t see">your mail.</FlowFacts.Item>
      </FlowFacts>,
    );

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['They can see your name.', 'They can’t see your mail.']);
  });

  it('draws the finishing mark as decoration only', () => {
    const { container } = render(<BrandMoment />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('FlowStep.NoteLink and AccountAvatar', () => {
  it('opens what it links to in a new tab, safely, and says so to assistive technology', () => {
    render(
      <FlowStep>
        <FlowStep.Heading>q</FlowStep.Heading>
        <FlowStep.Note>
          By creating an account you agree to the{' '}
          <FlowStep.NoteLink href="https://yahel.example/terms" newTabLabel="opens in a new tab">
            Terms
          </FlowStep.NoteLink>
          .
        </FlowStep.Note>
      </FlowStep>,
    );

    const link = screen.getByRole('link', { name: /^Terms ?\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute('href', 'https://yahel.example/terms');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows whose account is in use as initials, with words in their place for assistive technology', () => {
    render(<AccountAvatar name="Amara Okafor" label="Signed in as amara.okafor@yahel.example" />);

    expect(screen.getByText('AO')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Signed in as amara.okafor@yahel.example')).toBeInTheDocument();
  });
});
