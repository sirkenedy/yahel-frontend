// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { pages, renderDocument } from './prerender';

const template = '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n  </head>\n  <body class="ws-root">\n    <div id="root"></div>\n  </body>\n</html>\n';
const head = (html: string) => html.slice(0, html.indexOf('</head>'));
const root = (html: string) => html.slice(html.indexOf('<div id="root"'));

describe('renderDocument', () => {
  it('writes the home page, About and Careers', () => {
    expect(pages).toEqual(['/', '/about', '/careers']);
  });

  it.each([
    ['/', 'Yahel', 'Everything your work needs. One account.', 'Mail, calendar, files, documents and meetings that work together.'],
    ['/about', 'About Yahel', 'Work tools that stay out of the way.', '[YOUR STORY: why Yahel was started, by whom, and when. Two or three sentences.]'],
    ['/careers', 'Careers at Yahel', 'Build the tools people open every day.', 'Nothing that fits? Write to [CAREERS EMAIL] and tell us what you do well.'],
  ])('draws the page at %s into the root, heading and copy included', async (path, _title, heading, copy) => {
    const html = await renderDocument(template, path);

    expect(root(html)).toMatch(new RegExp(`<h1[^>]*>${heading.replace(/[.?]/g, '\\$&')}</h1>`));
    expect(root(html)).toContain(copy);
    expect(root(html)).toContain('© Yahel');
  });

  it.each([
    ['/', 'Yahel'],
    ['/about', 'About Yahel'],
    ['/careers', 'Careers at Yahel'],
  ])('names the document at %s in its head, once', async (path, title) => {
    const html = await renderDocument(template, path);

    expect(head(html)).toContain(`<title>${title}</title>`);
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it('marks the root with the address the page was drawn for', async () => {
    expect(await renderDocument(template, '/about')).toContain('<div id="root" data-page="/about"><div id="top"');
  });

  it('marks the page being read in the navigation', async () => {
    const html = await renderDocument(template, '/careers');

    expect(html).toMatch(/<a [^>]*href="\/careers"[^>]*aria-current="page"[^>]*>Careers<\/a>/);
    expect(html).not.toMatch(/<a [^>]*href="\/about"[^>]*aria-current="page"/);
  });

  it('shows all four roles on Careers, under the first tab', async () => {
    const html = await renderDocument(template, '/careers');

    expect(html.match(/\[ROLE TITLE\]/g)).toHaveLength(4);
    expect(html).toMatch(/<div[^>]*aria-selected="true"[^>]*>All</);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
  });

  it('sends account actions to sign-in on the app', async () => {
    expect(await renderDocument(template, '/')).toContain('href="http://localhost:5173/sign-in"');
  });

  it('adds no script of its own to the page', async () => {
    expect(await renderDocument(template, '/about')).not.toContain('<script');
  });

  it('keeps the rest of the built document as it was', async () => {
    const html = await renderDocument(template, '/');

    expect(html.startsWith('<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n')).toBe(true);
    expect(html.endsWith('</div>\n  </body>\n</html>\n')).toBe(true);
  });

  it('refuses a document with no empty root to draw into', async () => {
    await expect(renderDocument('<html><head></head><body><div id="app"></div></body></html>', '/')).rejects.toThrow('no empty root element');
  });
});
