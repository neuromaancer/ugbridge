import { useState } from 'react';
import type { ReactNode } from 'react';
import type {
  ConversionTrace,
  ConversionSegment,
  ConversionSegmentKind,
} from '../lib/converter';

type ScriptMode = 'uey' | 'uly';

interface ConversionOutputProps {
  mode: ScriptMode;
  value: string;
  ipa?: string;
  trace?: ConversionTrace;
  actions?: ReactNode;
}

const CONFIG: Record<
  ScriptMode,
  { dir: 'rtl' | 'ltr'; lang: string; label: string; subtitle: string }
> = {
  uey: {
    dir: 'rtl',
    lang: 'ug',
    label: 'UEY',
    subtitle: 'Uyghur Arabic script',
  },
  uly: {
    dir: 'ltr',
    lang: 'en',
    label: 'ULY',
    subtitle: 'Uyghur Latin alphabet',
  },
};

const HIGHLIGHT_CLASSES: Record<ConversionSegmentKind, string> = {
  letter: 'bg-sky-100 text-sky-950',
  digraph: 'bg-violet-100 text-violet-950',
  vowel: 'bg-emerald-100 text-emerald-950',
  'hamza-vowel': 'bg-amber-100 text-amber-950',
  hamza: 'bg-slate-200 text-slate-500',
  punctuation: 'bg-rose-100 text-rose-950',
  space: '',
  passthrough: 'bg-slate-100 text-slate-700',
};

export function ConversionOutput({
  mode,
  value,
  ipa,
  trace,
  actions,
}: ConversionOutputProps) {
  const [copied, setCopied] = useState(false);
  const config = CONFIG[mode];

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-7 items-center justify-between">
        <label
          htmlFor="text-output"
          className="text-sm font-semibold text-slate-700"
        >
          {config.label}{' '}
          <span className="font-normal text-slate-400">
            · {config.subtitle}
          </span>
        </label>
        <div className="flex items-center gap-1">
          {actions}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className="rounded-md px-2 py-0.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="flex min-h-8 items-center">
        {ipa ? (
          <p
            aria-label="International Phonetic Alphabet"
            className="w-full truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm text-slate-600 shadow-xs"
          >
            IPA /{ipa}/
          </p>
        ) : null}
      </div>
      <div
        id="text-output"
        dir={config.dir}
        lang={config.lang}
        className="h-56 w-full overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-xl leading-relaxed text-slate-900 shadow-xs"
      >
        {mode === 'uey' && value ? (
          <div className="grid gap-4">
            <div>{value}</div>
            {trace?.segments.length ? (
              <div className="border-t border-slate-200 pt-3">
                {renderHighlightedSegments(trace, true)}
              </div>
            ) : null}
          </div>
        ) : trace?.segments.length ? (
          renderHighlightedSegments(trace, mode === 'uey')
        ) : value ? (
          value
        ) : (
          <span className="text-slate-400">
            Converted text will appear here…
          </span>
        )}
      </div>
    </div>
  );
}

function renderHighlightedSegments(trace: ConversionTrace, showSourceBridge = false) {
  if (showSourceBridge) {
    return (
      <div dir="rtl" className="flex flex-row flex-wrap justify-start gap-1.5">
        {trace.segments.map((segment) =>
          segment.output.trim() ? (
            <SegmentBridgeTile key={segment.id} segment={segment} />
          ) : null,
        )}
      </div>
    );
  }

  return trace.segments.map((segment) =>
    segment.output ? (
      <span
        key={segment.id}
        title={segment.note ?? `${segment.source || ' '} → ${segment.output}`}
        className={
          HIGHLIGHT_CLASSES[segment.kind]
            ? `${HIGHLIGHT_CLASSES[segment.kind]} rounded-sm px-0.5 transition hover:ring-1 hover:ring-indigo-300`
            : undefined
        }
      >
        {segment.output}
      </span>
    ) : null,
  );
}

function SegmentBridgeTile({ segment }: { segment: ConversionSegment }) {
  const source = segment.canonicalSource ?? segment.source;

  return (
    <span
      title={segment.note ?? `${segment.source || ' '} -> ${segment.output}`}
      className={`inline-grid min-w-8 justify-items-center gap-0.5 rounded-md px-1.5 py-1 ring-1 ring-slate-200 ${
        HIGHLIGHT_CLASSES[segment.kind] || 'bg-slate-50 text-slate-700'
      }`}
    >
      <span dir="rtl" lang="ug" className="text-lg font-semibold leading-6">
        {segment.output}
      </span>
      <span className="text-[10px] leading-none text-slate-400" aria-hidden="true">
        ↓
      </span>
      <span dir="ltr" className="font-mono text-xs font-bold text-indigo-700">
        {source}
      </span>
    </span>
  );
}
