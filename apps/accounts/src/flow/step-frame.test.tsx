import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FlowStepFrame } from './step-frame';

const frame = { title: 'What should we call you?', pageTitle: 'What should we call you · Yahel', direction: 'forward', back: null } as const;

describe('FlowStepFrame', () => {
  it('shows the question as the heading and names the page after it', () => {
    render(<FlowStepFrame {...frame} lede="This is how you’ll appear." />);

    expect(screen.getByRole('heading', { level: 1, name: frame.title })).toBeInTheDocument();
    expect(screen.getByText('This is how you’ll appear.')).toBeInTheDocument();
    expect(document.title).toBe(frame.pageTitle);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers the way back and what leads the step when given', () => {
    render(<FlowStepFrame {...frame} back={{ href: '/personal/name', label: 'Back' }} lead={<p>01 / 06</p>} />);

    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/personal/name');
    expect(screen.getByText('01 / 06')).toBeInTheDocument();
  });

  it('announces a failed request above the step’s content', () => {
    render(
      <FlowStepFrame {...frame} failure="Can’t reach Yahel.">
        <p>fields</p>
      </FlowStepFrame>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Can’t reach Yahel.');
    expect(alert.compareDocumentPosition(screen.getByText('fields')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
