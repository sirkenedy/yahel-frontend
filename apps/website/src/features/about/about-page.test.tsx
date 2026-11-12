import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from './about-page';
import { aboutMessages as m } from './messages';

describe('AboutPage', () => {
  it('has one level-one heading and its sections in reading order', () => {
    render(<AboutPage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('heading').map((heading) => `${heading.tagName} ${heading.textContent}`)).toEqual([
      'H1 Work tools that stay out of the way.',
      'H2 What we hold ourselves to',
      'H3 Clear',
      'H3 Quiet',
      'H3 One identity',
      'H3 Yours',
      'H2 Our story',
      'H2 Where we are',
      'H2 Build it with us.',
    ]);
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText(m.lead)).toBeInTheDocument();
  });

  it('explains each of the four things it holds itself to', () => {
    render(<AboutPage />);

    for (const value of m.values) {
      const item = screen.getByRole('heading', { level: 3, name: value.title }).parentElement!;
      expect(within(item).getByText(value.text)).toBeInTheDocument();
    }
  });

  it('shows undecided facts as marked placeholders, exactly as written', () => {
    render(<AboutPage />);

    expect(screen.getByText('[YOUR STORY: why Yahel was started, by whom, and when. Two or three sentences.]')).toBeInTheDocument();
    expect(screen.getByText('[YOUR LOCATION and how the team works: office, remote or both.]')).toBeInTheDocument();
    expect(screen.getByText('Contact: [YOUR EMAIL]')).toBeInTheDocument();
  });

  it('ends with one action, a link to the open roles', () => {
    render(<AboutPage />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'See open roles' })).toHaveAttribute('href', '/careers');
  });

  it('names the document for this page', () => {
    render(<AboutPage />);

    expect(document.title).toBe('About Yahel');
  });
});
