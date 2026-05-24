import { useRef } from 'react';
import { UlyInputHelper } from './UlyInputHelper';

type ScriptMode = 'uey' | 'uly';

interface TextInputProps {
  mode: ScriptMode;
  value: string;
  onChange: (value: string) => void;
}

const CONFIG: Record<
  ScriptMode,
  {
    dir: 'rtl' | 'ltr';
    lang: string;
    label: string;
    subtitle: string;
    placeholder: string;
  }
> = {
  uey: {
    dir: 'rtl',
    lang: 'ug',
    label: 'UEY',
    subtitle: 'Uyghur Arabic script',
    placeholder: 'ياخشىمۇسىز...',
  },
  uly: {
    dir: 'ltr',
    lang: 'en',
    label: 'ULY',
    subtitle: 'Uyghur Latin alphabet',
    placeholder: 'yaxshimusiz...',
  },
};

export function TextInput({ mode, value, onChange }: TextInputProps) {
  const config = CONFIG[mode];
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${text}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-7 items-center justify-between">
        <label
          htmlFor="text-input"
          className="text-sm font-semibold text-slate-700"
        >
          {config.label}{' '}
          <span className="font-normal text-slate-400">
            · {config.subtitle}
          </span>
        </label>
      </div>
      {mode === 'uly' ? <UlyInputHelper onInsert={insertText} /> : <div className="min-h-8" />}
      <textarea
        ref={textareaRef}
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={config.dir}
        lang={config.lang}
        placeholder={config.placeholder}
        className="h-56 w-full resize-y rounded-lg border border-slate-200 bg-white p-4 text-xl leading-relaxed text-slate-900 shadow-xs transition focus:border-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
