import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';

describe('App conversion workflow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('opens a shared convert URL with its query and direction restored', () => {
    window.history.pushState(
      {},
      '',
      '/?view=convert&d=uly-to-uey&q=salam',
    );

    render(<App />);

    expect(getConversionInput()).toHaveValue('salam');
    expect(screen.getByText('سالام')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Currently ULY to UEY/i,
      }),
    ).toBeInTheDocument();
  });

  it('detects strong ULY input and converts it to UEY', () => {
    window.history.pushState({}, '', '/?view=convert');
    render(<App />);

    fireEvent.change(getConversionInput(), {
      target: { value: 'yaxshi' },
    });

    expect(screen.getByText('Detected ULY input')).toBeInTheDocument();
    expect(screen.getByText('ياخشى')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Currently ULY to UEY/i,
      }),
    ).toBeInTheDocument();
  });

  it('uses the current output as the new input when swapping direction', () => {
    window.history.pushState({}, '', '/?view=convert');
    render(<App />);

    fireEvent.change(getConversionInput(), {
      target: { value: 'سالام' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: /Currently UEY to ULY/i,
      }),
    );

    expect(getConversionInput()).toHaveValue('salam');
    expect(screen.getByText('سالام')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Currently ULY to UEY/i,
      }),
    ).toBeInTheDocument();
  });

  it('cycles theme mode with a single slider control', () => {
    render(<App />);

    const getThemeToggle = () =>
      screen.getByRole('button', { name: /Theme mode:/i });

    expect(getThemeToggle()).toHaveAccessibleName(/Theme mode: System/i);

    fireEvent.click(getThemeToggle());
    expect(getThemeToggle()).toHaveAccessibleName(/Theme mode: Day/i);

    fireEvent.click(getThemeToggle());
    expect(getThemeToggle()).toHaveAccessibleName(/Theme mode: Night/i);
  });
});

function getConversionInput() {
  const input = document.querySelector<HTMLTextAreaElement>('#text-input');
  expect(input).not.toBeNull();
  return input!;
}
