import { type ILinkProviderOptions } from '@xterm/addon-web-links';
import { type ITerminalOptions } from '@xterm/xterm';
import { log } from '@renderer/utils/logger';

const LOCAL_TERMINAL_URL_PATTERN =
  /^(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d{2,5})?(?:[/?#][^\s]*)?$/i;

export function normalizeTerminalLink(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.toString();
      }
      return null;
    } catch {
      return null;
    }
  }

  if (!LOCAL_TERMINAL_URL_PATTERN.test(trimmed)) {
    return null;
  }

  try {
    return new URL(`http://${trimmed}`).toString();
  } catch {
    return null;
  }
}

interface TerminalLinkControllerOptions {
  openExternal: (url: string) => Promise<unknown>;
}

export class TerminalLinkController {
  private hoveredLinkCount = 0;

  constructor(private readonly options: TerminalLinkControllerOptions) {}

  readonly webLinksOptions: ILinkProviderOptions = {
    hover: () => {
      this.hoveredLinkCount += 1;
    },
    leave: () => {
      this.hoveredLinkCount = Math.max(0, this.hoveredLinkCount - 1);
    },
  };

  readonly linkHandler: NonNullable<ITerminalOptions['linkHandler']> = {
    activate: (event, text) => {
      this.activate(event, text);
    },
    hover: this.webLinksOptions.hover,
    leave: (_event, _text, _range) => {
      this.webLinksOptions.leave?.(_event, _text);
    },
  };

  isLinkHovered(): boolean {
    return this.hoveredLinkCount > 0;
  }

  reset(): void {
    this.hoveredLinkCount = 0;
  }

  activate(event: MouseEvent, rawUrl: string): void {
    event.preventDefault();

    const normalizedUrl = normalizeTerminalLink(rawUrl);
    if (!normalizedUrl) {
      log.warn('Terminal link ignored because it is not an http(s) URL', { rawUrl });
      return;
    }

    this.options.openExternal(normalizedUrl).catch((error) => {
      log.warn('Failed to open terminal link', { rawUrl, normalizedUrl, error });
    });
  }
}
