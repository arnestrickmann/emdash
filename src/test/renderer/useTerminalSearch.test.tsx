import React, { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useTerminalSearch } from '../../renderer/hooks/useTerminalSearch';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('../../renderer/terminal/SessionRegistry', () => ({
  terminalSessionRegistry: {
    getSession: mockGetSession,
  },
}));

function TestHarness({
  enabled = true,
  terminalId = 'terminal-1',
}: {
  enabled?: boolean;
  terminalId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    isSearchOpen,
    searchQuery,
    searchStatus,
    searchInputRef,
    closeSearch,
    handleSearchQueryChange,
  } = useTerminalSearch({
    terminalId,
    containerRef,
    enabled,
  });

  return (
    <div>
      <button type="button" data-testid="outside-focus">
        Outside
      </button>
      <div ref={containerRef} data-testid="terminal-container">
        <button type="button" data-testid="terminal-focus">
          Terminal
        </button>
        {isSearchOpen ? (
          <input
            ref={searchInputRef}
            data-testid="search-input"
            value={searchQuery}
            onChange={(event) => handleSearchQueryChange(event.target.value)}
          />
        ) : null}
        <button type="button" data-testid="close-search" onClick={closeSearch}>
          Close
        </button>
        <div data-testid="search-status">
          {searchStatus.currentIndex}/{searchStatus.total}
        </div>
      </div>
    </div>
  );
}

describe('useTerminalSearch', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it('opens search when Ctrl+F is pressed while focus is inside the terminal container', () => {
    mockGetSession.mockReturnValue({
      search: vi.fn(() => ({ found: false, currentIndex: 0, total: 0 })),
      clearSearch: vi.fn(),
    });

    render(<TestHarness />);

    screen.getByTestId('terminal-focus').focus();
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('ignores Ctrl+F when focus is outside the terminal container', () => {
    mockGetSession.mockReturnValue({
      search: vi.fn(() => ({ found: false, currentIndex: 0, total: 0 })),
      clearSearch: vi.fn(),
    });

    render(<TestHarness />);

    screen.getByTestId('outside-focus').focus();
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
  });

  it('runs a search against the active terminal session when the query changes', () => {
    const search = vi.fn(() => ({ found: true, currentIndex: 1, total: 3 }));
    mockGetSession.mockReturnValue({
      search,
      clearSearch: vi.fn(),
    });

    render(<TestHarness />);

    screen.getByTestId('terminal-focus').focus();
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'error' } });

    expect(search).toHaveBeenCalledWith('error', { direction: 'next', reset: true });
    expect(screen.getByTestId('search-status')).toHaveTextContent('1/3');
  });
});
