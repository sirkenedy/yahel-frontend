import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Avatar, Banner, Button, TextField } from '../index';

describe('Button', () => {
  it('is a real button that responds to keyboard and pointer', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Share</Button>);
    const button = screen.getByRole('button', { name: 'Share' });

    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(onPress).toHaveBeenCalledTimes(2);
    expect(button).toHaveClass('ws-button');
  });

  it('names what is happening while pending and ignores presses', async () => {
    const onPress = vi.fn();
    render(
      <Button variant="primary" isPending pendingLabel="Signing in" onPress={onPress}>
        Sign in
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Signing in' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('ties the visible label and the error to the input', () => {
    render(<TextField label="Work email" error="Enter an email address, like name@example.com" />);
    const input = screen.getByLabelText('Work email');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter an email address, like name@example.com');
  });

  it('shows help text when there is no error', () => {
    render(<TextField label="Password" help="At least 12 characters" />);

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 12 characters');
  });
});

describe('Banner and Avatar', () => {
  it('announces danger banners as alerts and others as status', () => {
    render(
      <>
        <Banner tone="danger">Couldn't send</Banner>
        <Banner>Offline</Banner>
      </>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't send");
    expect(screen.getByRole('status')).toHaveTextContent('Offline');
  });

  it('falls back to initials and marks organisations by shape', () => {
    render(<Avatar name="Northwind Studio" kind="organisation" />);
    const avatar = screen.getByRole('img', { name: 'Northwind Studio' });

    expect(avatar).toHaveTextContent('NS');
    expect(avatar).toHaveClass('ws-avatar--organisation');
  });
});
