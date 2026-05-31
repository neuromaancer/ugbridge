import { useState } from 'react';
import { X } from 'lucide-react';
import {
  ALPHABET_STUDY_ENTRIES,
  UEY_JOINING_FORM_LABELS,
  ulyTokenToIpa,
  type AlphabetExampleLabel,
  type AlphabetLetterForm,
  type AlphabetStudyEntry,
  type AlphabetStudyExample,
} from '../lib/converter';

export function AlphabetPanel() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const selectedEntry =
    ALPHABET_STUDY_ENTRIES.find((entry) => entry.token === selectedToken) ??
    null;

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Learn alphabet
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Pick a ULY letter or digraph to see its UEY form, IPA, and common
              word examples with the target letter highlighted.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Vowels show their common word-initial hamza form; right-joining
              letters only show the forms they actually use.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {ALPHABET_STUDY_ENTRIES.length} sounds
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {ALPHABET_STUDY_ENTRIES.map((entry) => (
            <AlphabetButton
              key={entry.token}
              entry={entry}
              selected={entry.token === selectedEntry?.token}
              onClick={() => setSelectedToken(entry.token)}
            />
          ))}
        </div>
      </section>

      {selectedEntry && (
        <>
          <section className="sm:hidden">
            <AlphabetDetails
              entry={selectedEntry}
              onClose={() => setSelectedToken(null)}
            />
          </section>
          <AlphabetModal
            entry={selectedEntry}
            onClose={() => setSelectedToken(null)}
          />
        </>
      )}
    </>
  );
}

function AlphabetButton({
  entry,
  selected,
  onClick,
}: {
  entry: AlphabetStudyEntry;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`grid min-h-20 justify-items-center rounded-md px-2 py-2 text-center ring-1 transition ${
        selected
          ? 'bg-indigo-600 text-white ring-indigo-600'
          : 'bg-slate-50 text-slate-950 ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-100'
      }`}
    >
      <span className="font-mono text-sm font-bold">{entry.token}</span>
      <span dir="rtl" lang="ug" className="mt-1 text-2xl leading-none">
        {entry.displayUey}
      </span>
      <span
        className={`mt-1 font-mono text-xs font-semibold ${
          selected ? 'text-indigo-100' : 'text-emerald-700'
        }`}
      >
        /{ulyTokenToIpa(entry.token)}/
      </span>
    </button>
  );
}

function AlphabetModal({
  entry,
  onClose,
}: {
  entry: AlphabetStudyEntry;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.token} alphabet examples`}
      className="fixed inset-0 z-50 hidden place-items-center bg-slate-950/40 px-4 py-6 sm:grid"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <AlphabetDetails entry={entry} onClose={onClose} />
      </div>
    </div>
  );
}

function AlphabetDetails({
  entry,
  onClose,
}: {
  entry: AlphabetStudyEntry;
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-2xl font-bold text-indigo-700">
            {entry.token}
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-emerald-700">
            /{ulyTokenToIpa(entry.token)}/
          </div>
          <div className="mt-2 w-fit rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
            {entry.kind}
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div dir="rtl" lang="ug" className="text-6xl leading-none text-slate-950">
            {entry.displayUey}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alphabet details"
            className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <AlphabetForms forms={entry.forms} />
        {entry.examples.length ? (
          entry.examples.map((example) => (
            <AlphabetExampleRow key={example.id} example={example} />
          ))
        ) : (
          <div className="rounded-md bg-white p-3 text-sm text-slate-500 ring-1 ring-slate-200">
            More common examples needed for this letter.
          </div>
        )}
      </div>
    </div>
  );
}

function AlphabetForms({ forms }: { forms: AlphabetLetterForm[] }) {
  if (!forms.length) return null;

  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Letter forms
      </div>
      <p className="mb-2 text-xs leading-5 text-slate-500">
        Unicode stores base letters; the shown shapes are the practical forms
        produced by Arabic-script joining rules.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {forms.map((form) => (
          <div
            key={form.label}
            className="grid justify-items-center rounded-md bg-slate-50 px-2 py-2 ring-1 ring-slate-200"
          >
            <span className="text-xs font-semibold text-slate-500">
              {formLabelText(form.label)}
            </span>
            <span dir="rtl" lang="ug" className="mt-1 text-4xl leading-none text-slate-950">
              {form.glyph}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlphabetExampleRow({
  example,
}: {
  example: AlphabetStudyExample;
}) {
  const segments = buildExampleSegments(example);

  return (
    <div className="grid gap-2 rounded-md bg-white p-3 ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${formClass(
              example.label,
            )}`}
          >
            {labelText(example.label)}
          </span>
          <span
            dir="rtl"
            lang="ug"
            className="rounded-md bg-slate-50 px-2 py-1 text-2xl leading-none text-slate-950 ring-1 ring-slate-200"
            title={`${labelText(example.label)} glyph`}
          >
            {example.highlightGlyph}
          </span>
        </div>
        <span className="font-mono text-sm font-semibold text-slate-500">
          {example.uly}
        </span>
      </div>
      <div dir="rtl" lang="ug" className="text-3xl leading-relaxed text-slate-800">
        {segments.map((segment) => (
          <span
            key={`${example.id}-${segment.startIndex}`}
            className={
              segment.highlighted
                ? 'rounded-sm bg-amber-200 px-1 text-amber-950'
                : undefined
            }
            title={
              segment.highlighted
                ? `${labelText(example.label)}: ${example.highlightGlyph}`
                : undefined
            }
          >
            {segment.text}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-mono font-semibold text-indigo-700">
          {example.uly}
        </span>
        <span className="text-slate-500">{example.english}</span>
      </div>
    </div>
  );
}

type AlphabetExampleSegment = {
  startIndex: number;
  highlighted: boolean;
  text: string;
};

function buildExampleSegments(
  example: AlphabetStudyExample,
): AlphabetExampleSegment[] {
  const highlightIndexes = new Set(example.highlightIndexes);
  const segments: AlphabetExampleSegment[] = [];

  example.displayGlyphs.forEach((glyph, index) => {
    const highlighted = highlightIndexes.has(index);
    const previous = segments[segments.length - 1];

    if (previous?.highlighted === highlighted) {
      previous.text += glyph;
      return;
    }

    segments.push({
      startIndex: index,
      highlighted,
      text: glyph,
    });
  });

  return segments;
}

function labelText(label: AlphabetExampleLabel) {
  return label === 'word-initial'
    ? 'word-initial'
    : UEY_JOINING_FORM_LABELS[label as Exclude<AlphabetExampleLabel, 'word-initial'>];
}

function formLabelText(label: AlphabetLetterForm['label']) {
  return label === 'word-initial' ? 'word-initial' : UEY_JOINING_FORM_LABELS[label];
}

function formClass(form: AlphabetStudyExample['label']) {
  if (form === 'word-initial') return 'bg-amber-100 text-amber-800';
  if (form === 'initial') return 'bg-sky-100 text-sky-800';
  if (form === 'medial') return 'bg-violet-100 text-violet-800';
  if (form === 'final') return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-100 text-slate-600';
}
