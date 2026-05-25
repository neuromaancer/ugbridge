import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LearnPanel } from '../src/components/LearnPanel';
import { traceConversion } from '../src/lib/converter';

const LEARN_PROGRESS_KEY = 'ugbridge.learnedLetters.v1';

describe('LearnPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('ignores unknown tokens restored from local learning progress', () => {
    window.localStorage.setItem(
      LEARN_PROGRESS_KEY,
      JSON.stringify(['a', 'ghost-token', 'sh']),
    );

    render(
      <LearnPanel
        trace={traceConversion('', 'uly-to-uey')}
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('2/32 marked learned')).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();
    expect(screen.getByText('1/5')).toBeInTheDocument();
  });
});
