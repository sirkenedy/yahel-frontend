import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { pickProduct, resetProductSelection, showProduct, useProductSelection } from './product-selection';

function Showing() {
  const selection = useProductSelection();
  return <p>{`${selection.id} ${selection.picks}`}</p>;
}

describe('product selection', () => {
  afterEach(() => act(resetProductSelection));

  it('starts on Mail, with nothing picked', () => {
    render(<Showing />);

    expect(screen.getByText('mail 0')).toBeInTheDocument();
  });

  it('shows a product chosen in the section itself without asking for focus', () => {
    render(<Showing />);

    act(() => showProduct('sheets'));

    expect(screen.getByText('sheets 0')).toBeInTheDocument();
  });

  it('counts each pick made from elsewhere, even of the product already showing, so focus moves every time', () => {
    render(<Showing />);

    act(() => pickProduct('meet'));
    expect(screen.getByText('meet 1')).toBeInTheDocument();

    act(() => pickProduct('meet'));
    expect(screen.getByText('meet 2')).toBeInTheDocument();
  });

  it('tells every reader, and remembers the product for one that arrives later', () => {
    render(
      <>
        <Showing />
        <Showing />
      </>,
    );

    act(() => pickProduct('drive'));
    expect(screen.getAllByText('drive 1')).toHaveLength(2);

    render(<Showing />);
    expect(screen.getAllByText('drive 1')).toHaveLength(3);
  });
});
