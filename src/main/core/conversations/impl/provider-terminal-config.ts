import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { AgentProviderId } from '@shared/agent-provider-registry';

const OPENCODE_TUI_CONFIG_CONTENT = `${JSON.stringify(
  {
    $schema: 'https://opencode.ai/tui.json',
    theme: 'system',
  },
  null,
  2
)}\n`;

const LOCAL_OPENCODE_TUI_CONFIG_PATH = path.join(
  os.tmpdir(),
  'emdash',
  'opencode',
  'tui.system.json'
);

const REMOTE_OPENCODE_TUI_CONFIG_PATH = '/tmp/emdash/opencode/tui.system.json';

export interface ProviderTerminalConfigSpec {
  path: string;
  env: Record<string, string>;
  content: string;
}

export function getLocalProviderTerminalConfig(
  providerId: AgentProviderId
): ProviderTerminalConfigSpec | null {
  if (providerId !== 'opencode') return null;

  return {
    path: LOCAL_OPENCODE_TUI_CONFIG_PATH,
    env: {
      OPENCODE_TUI_CONFIG: LOCAL_OPENCODE_TUI_CONFIG_PATH,
    },
    content: OPENCODE_TUI_CONFIG_CONTENT,
  };
}

export function getRemoteProviderTerminalConfig(
  providerId: AgentProviderId
): ProviderTerminalConfigSpec | null {
  if (providerId !== 'opencode') return null;

  return {
    path: REMOTE_OPENCODE_TUI_CONFIG_PATH,
    env: {
      OPENCODE_TUI_CONFIG: REMOTE_OPENCODE_TUI_CONFIG_PATH,
    },
    content: OPENCODE_TUI_CONFIG_CONTENT,
  };
}

export async function ensureProviderTerminalConfig(
  spec: ProviderTerminalConfigSpec | null,
  writeFile: (filePath: string, content: string) => Promise<void>
): Promise<Record<string, string>> {
  if (!spec) return {};

  await writeFile(spec.path, spec.content);
  return spec.env;
}

export async function prepareLocalProviderTerminalEnv(
  providerId: AgentProviderId
): Promise<Record<string, string>> {
  return ensureProviderTerminalConfig(
    getLocalProviderTerminalConfig(providerId),
    async (filePath, content) => {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    }
  );
}
