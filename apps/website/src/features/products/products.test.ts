import { describe, expect, it } from 'vitest';
import { products } from './products';

describe('products', () => {
  it('lists all nine, in the order the design gives them, each at its own address', () => {
    expect(products.map((product) => [product.name, product.host])).toEqual([
      ['Mail', 'mail.yahel.com'],
      ['Calendar', 'calendar.yahel.com'],
      ['Drive', 'drive.yahel.com'],
      ['Docs', 'docs.yahel.com'],
      ['Sheets', 'sheets.yahel.com'],
      ['Slides', 'slides.yahel.com'],
      ['Chat', 'chat.yahel.com'],
      ['Meet', 'meet.yahel.com'],
      ['Admin', 'admin.yahel.com'],
    ]);
  });

  it('says what each is for in one line', () => {
    expect(products.map((product) => product.line)).toEqual([
      'Email on your personal address or your organisation’s domain.',
      'Plan your day and find time with other people.',
      'Keep your files in one place, find them from anywhere and share them safely.',
      'Write documents together, at the same time.',
      'Spreadsheets for plans, budgets and data.',
      'Build presentations and present them from any device.',
      'Direct messages and group conversations for your team.',
      'Video meetings that start from a link.',
      'Manage people, domains and security for your organisation.',
    ]);
  });
});
