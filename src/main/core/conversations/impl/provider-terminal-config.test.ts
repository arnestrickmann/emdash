import { describe, expect, it, vi } from 'vitest';
import {
  ensureProviderTerminalConfig,
  getLocalProviderTerminalConfig,
  getRemoteProviderTerminalConfig,
} from './provider-terminal-config';

describe('provider terminal config', () => {
  it('builds an OpenCode system-theme config for local sessions', () => {
    const spec = getLocalProviderTerminalConfig('opencode');

    expect(spec).toMatchObject({
      env: expect.objectContaining({
        OPENCODE_TUI_CONFIG: expect.stringContaining('tui.system.json'),
      }),
      path: expect.stringContaining('tui.system.json'),
    });
    expect(spec?.content).toContain('"theme": "system"');
    expect(spec?.content).toContain('https://opencode.ai/tui.json');
  });

  it('builds an OpenCode system-theme config for remote sessions', () => {
    const spec = getRemoteProviderTerminalConfig('opencode');

    expect(spec).toEqual({
      path: '/tmp/emdash/opencode/tui.system.json',
      env: {
        OPENCODE_TUI_CONFIG: '/tmp/emdash/opencode/tui.system.json',
      },
      content: expect.any(String),
    });
    expect(spec?.content).toContain('"theme": "system"');
  });

  it('writes the provider config and returns its env', async () => {
    const spec = getRemoteProviderTerminalConfig('opencode');
    const writeFile = vi.fn().mockResolvedValue(undefined);

    const env = await ensureProviderTerminalConfig(spec, writeFile);

    expect(writeFile).toHaveBeenCalledWith('/tmp/emdash/opencode/tui.system.json', spec?.content);
    expect(env).toEqual({
      OPENCODE_TUI_CONFIG: '/tmp/emdash/opencode/tui.system.json',
    });
  });

  it('does nothing for providers without terminal config integration', async () => {
    const writeFile = vi.fn();

    await expect(
      ensureProviderTerminalConfig(getLocalProviderTerminalConfig('codex'), writeFile)
    ).resolves.toEqual({});
    expect(writeFile).not.toHaveBeenCalled();
  });
});
