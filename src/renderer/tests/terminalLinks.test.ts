import { describe, expect, it } from 'vitest';
import { normalizeTerminalLink, TerminalLinkController } from '@renderer/lib/pty/terminal-links';

describe('normalizeTerminalLink', () => {
  it('keeps valid https links', () => {
    expect(normalizeTerminalLink('https://example.com/docs')).toBe('https://example.com/docs');
  });

  it('normalizes bare localhost links to http', () => {
    expect(normalizeTerminalLink('localhost:3000/path?q=1')).toBe('http://localhost:3000/path?q=1');
  });

  it('normalizes bare 0.0.0.0 links to http', () => {
    expect(normalizeTerminalLink('0.0.0.0:4173')).toBe('http://0.0.0.0:4173/');
  });

  it('rejects non-http protocols', () => {
    expect(normalizeTerminalLink('javascript:alert(1)')).toBeNull();
  });

  it('rejects non-url terminal text', () => {
    expect(normalizeTerminalLink('build succeeded')).toBeNull();
  });
});

describe('TerminalLinkController', () => {
  it('tracks hover state across hover and leave callbacks', () => {
    const controller = new TerminalLinkController({ openExternal: async () => {} });

    expect(controller.isLinkHovered()).toBe(false);

    controller.linkHandler.hover?.({} as MouseEvent, 'https://example.com', {} as never);
    expect(controller.isLinkHovered()).toBe(true);

    controller.linkHandler.leave?.({} as MouseEvent, 'https://example.com', {} as never);
    expect(controller.isLinkHovered()).toBe(false);
  });

  it('resets hover state explicitly', () => {
    const controller = new TerminalLinkController({ openExternal: async () => {} });

    controller.linkHandler.hover?.({} as MouseEvent, 'https://example.com', {} as never);
    controller.reset();

    expect(controller.isLinkHovered()).toBe(false);
  });
});
