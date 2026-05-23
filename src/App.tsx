import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpenText,
  BookmarkPlus,
  Copy,
  Download,
  Files,
  GraduationCap,
  History,
  Home,
  Languages,
  ListChecks,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  detectConversionDirection,
  traceConversion,
  ulyToIpa,
} from './lib/converter';
import { TextInput } from './components/TextInput';
import { ConversionOutput } from './components/ConversionOutput';
import { SpeakButton } from './components/SpeakButton';
import { DirectionControl } from './components/DirectionControl';
import { TtsSettingsPanel } from './components/TtsSettingsPanel';
import { LearnPanel } from './components/LearnPanel';
import { AlphabetPanel } from './components/AlphabetPanel';
import { DictionaryPanel } from './components/DictionaryPanel';
import { QuizPanel } from './components/QuizPanel';
import { useTtsStatus } from './hooks/useTtsStatus';
import { createTtsProvider } from './lib/tts';
import { loadTtsSettings, type TtsSettings } from './lib/tts/settings';
import {
  addConversionHistoryEntry,
  clearConversionHistory,
  loadConversionHistory,
  saveConversionHistory,
  type ConversionHistoryEntry,
} from './lib/conversion-history';
import {
  addCustomTransliteration,
  applyCustomTransliterations,
  loadCustomTransliterations,
  removeCustomTransliteration,
  saveCustomTransliterations,
  type CustomTransliterationEntry,
} from './lib/custom-transliterations';

type Direction = 'uey-to-uly' | 'uly-to-uey';
type View = 'home' | 'convert' | 'learn' | 'quiz' | 'alphabet' | 'dictionary';

interface InitialState {
  direction: Direction;
  input: string;
  view: View;
}

const BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export default function App() {
  const initial = useMemo(readInitialState, []);
  const [activeView, setActiveView] = useState<View>(initial.view);
  const [direction, setDirection] = useState<Direction>(initial.direction);
  const [input, setInput] = useState(initial.input);
  const [ttsSettings, setTtsSettings] =
    useState<TtsSettings>(loadTtsSettings);
  const [history, setHistory] = useState<ConversionHistoryEntry[]>(
    loadConversionHistory,
  );
  const [customEntries, setCustomEntries] = useState<
    CustomTransliterationEntry[]
  >(loadCustomTransliterations);
  const [customUey, setCustomUey] = useState('');
  const [customUly, setCustomUly] = useState('');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tts = useMemo(
    () => createTtsProvider(ttsSettings),
    [ttsSettings],
  );
  const { isAvailable, hasUyghurVoice } = useTtsStatus(tts);

  const activeDirection =
    activeView === 'learn' ? 'uly-to-uey' : direction;
  const conversionInput = useMemo(
    () =>
      activeView === 'convert'
        ? applyCustomTransliterations(input, activeDirection, customEntries)
        : input,
    [activeDirection, activeView, customEntries, input],
  );
  const trace = useMemo(
    () => traceConversion(conversionInput, activeDirection),
    [conversionInput, activeDirection],
  );
  const detectedDirection = useMemo(
    () => detectConversionDirection(input),
    [input],
  );
  const output = trace.output;

  const ueyText = activeDirection === 'uey-to-uly' ? input : output;
  const ulyText = activeDirection === 'uey-to-uly' ? output : input;
  const ipaText = useMemo(() => ulyToIpa(ulyText).trim(), [ulyText]);
  const inputMode = activeDirection === 'uey-to-uly' ? 'uey' : 'uly';
  const outputMode = activeDirection === 'uey-to-uly' ? 'uly' : 'uey';
  const lineCount = input ? input.split(/\r\n|\r|\n/).length : 0;
  const showDetectedDirection =
    activeView === 'convert' &&
    detectedDirection.confidence === 'high' &&
    detectedDirection.direction;
  const hasTextWorkspaceActions =
    activeView === 'convert' || activeView === 'learn';

  useEffect(() => {
    if (activeView !== 'convert' || !input.trim() || !output.trim()) return;

    const timer = window.setTimeout(() => {
      setHistory((current) => {
        const next = addConversionHistoryEntry(current, {
          direction: activeDirection,
          input,
          output,
        });
        saveConversionHistory(next);
        return next;
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [activeDirection, activeView, input, output]);

  const swap = () => {
    setInput(output);
    setDirection((d) => (d === 'uey-to-uly' ? 'uly-to-uey' : 'uey-to-uly'));
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (activeView !== 'convert') return;

    const detected = detectConversionDirection(value);
    if (
      detected.confidence === 'high' &&
      detected.direction &&
      detected.direction !== direction
    ) {
      setDirection(detected.direction);
      showNotice(
        detected.direction === 'uey-to-uly'
          ? 'Detected UEY input'
          : 'Detected ULY input',
      );
    }
  };

  const copyText = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showNotice(`${label} copied`);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('view', activeView);
    url.searchParams.set('d', activeDirection);
    if (input) url.searchParams.set('q', input);
    await navigator.clipboard.writeText(url.toString());
    showNotice('Share link copied');
  };

  const downloadOutput = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      activeDirection === 'uey-to-uly'
        ? 'uybridge-output-uly.txt'
        : 'uybridge-output-uey.txt';
    link.click();
    URL.revokeObjectURL(url);
    showNotice('TXT downloaded');
  };

  const uploadTxt = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    handleInputChange(text);
    showNotice(`${file.name} loaded`);
  };

  const restoreHistoryEntry = (entry: ConversionHistoryEntry) => {
    setInput(entry.input);
    setDirection(entry.direction);
    setActiveView('convert');
    showNotice('History restored');
  };

  const clearHistory = () => {
    setHistory(clearConversionHistory());
    showNotice('History cleared');
  };

  const addCustomEntry = () => {
    const next = addCustomTransliteration(customEntries, {
      uey: customUey,
      uly: customUly,
    });

    setCustomEntries(saveCustomTransliterations(next));
    setCustomUey('');
    setCustomUly('');
    showNotice('Custom word saved');
  };

  const removeCustomEntry = (id: string) => {
    const next = removeCustomTransliteration(customEntries, id);
    setCustomEntries(saveCustomTransliterations(next));
    showNotice('Custom word removed');
  };

  const openLearnView = () => {
    if (direction === 'uey-to-uly' && input) {
      const uly = traceConversion(input, 'uey-to-uly').output;
      setInput(uly);
      setDirection('uly-to-uey');
    }
    setActiveView('learn');
  };

  const studyDictionaryEntry = (uly: string) => {
    setInput(uly);
    setDirection('uly-to-uey');
    setActiveView('learn');
  };

  const convertDictionaryEntry = (uey: string) => {
    setInput(uey);
    setDirection('uey-to-uly');
    setActiveView('convert');
  };

  const showVoiceWarning = isAvailable && hasUyghurVoice === false;
  const showUnsupportedWarning = !isAvailable;

  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
                aria-label="Open home"
              >
                <Languages className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="text-left text-3xl font-bold tracking-tight text-slate-950 transition hover:text-indigo-700"
              >
                UG Bridge
              </button>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Convert between UEY (Uyghur Arabic script) and ULY (Uyghur Latin
              alphabet), search a Uyghur-English dictionary, and study Uyghur
              script.
            </p>
          </div>

          <AppTabs
            activeView={activeView}
            onConvert={() => setActiveView('convert')}
            onLearn={openLearnView}
            onQuiz={() => setActiveView('quiz')}
            onAlphabet={() => setActiveView('alphabet')}
            onDictionary={() => setActiveView('dictionary')}
          />
        </header>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          {activeView === 'home' ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
              <Home className="h-4 w-4" aria-hidden="true" />
              Home
            </div>
          ) : activeView === 'convert' ? (
            <DirectionControl direction={direction} onSwap={swap} />
          ) : activeView === 'learn' ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              ULY to UEY study mode
            </div>
          ) : activeView === 'quiz' ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              UEY quiz
            </div>
          ) : activeView === 'alphabet' ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              <BookOpenText className="h-4 w-4" aria-hidden="true" />
              Alphabet explorer
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Search className="h-4 w-4" aria-hidden="true" />
              Local dictionary
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {hasTextWorkspaceActions && (
              <SpeakButton
                text={ueyText}
                isAvailable={isAvailable}
                tts={tts}
              />
            )}
            {(hasTextWorkspaceActions || activeView === 'dictionary') && (
              <button
                type="button"
                onClick={() => setInput('')}
                disabled={!input}
                className={BUTTON_CLASS}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            )}
            {hasTextWorkspaceActions && (
              <>
                <button
                  type="button"
                  onClick={() => copyText(ueyText, 'UEY')}
                  disabled={!ueyText}
                  className={BUTTON_CLASS}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy UEY
                </button>
                <button
                  type="button"
                  onClick={() => copyText(ulyText, 'ULY')}
                  disabled={!ulyText}
                  className={BUTTON_CLASS}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy ULY
                </button>
                <button
                  type="button"
                  onClick={() =>
                    copyText(`UEY:\n${ueyText}\n\nULY:\n${ulyText}`, 'Both')
                  }
                  disabled={!ueyText && !ulyText}
                  className={BUTTON_CLASS}
                >
                  <Files className="h-4 w-4" aria-hidden="true" />
                  Copy both
                </button>
              </>
            )}
            <button
              type="button"
              onClick={copyShareLink}
              className={BUTTON_CLASS}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share
            </button>
            {hasTextWorkspaceActions && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={BUTTON_CLASS}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload TXT
                </button>
                <button
                  type="button"
                  onClick={downloadOutput}
                  disabled={!output}
                  className={BUTTON_CLASS}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download TXT
                </button>
                <TtsSettingsPanel
                  settings={ttsSettings}
                  onChange={setTtsSettings}
                />
              </>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(event) => {
            uploadTxt(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        {(notice || lineCount > 1 || showDetectedDirection) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            {notice && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                {notice}
              </span>
            )}
            {lineCount > 1 && (
              <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-600">
                {lineCount} lines
              </span>
            )}
            {showDetectedDirection && (
              <button
                type="button"
                onClick={() => setDirection(detectedDirection.direction!)}
                disabled={detectedDirection.direction === direction}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-default disabled:bg-indigo-50 disabled:text-indigo-700"
                title={detectedDirection.reason}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {detectedDirection.direction === 'uey-to-uly'
                  ? 'Detected UEY'
                  : 'Detected ULY'}
              </button>
            )}
          </div>
        )}

        {activeView !== 'home' &&
          activeView !== 'dictionary' &&
          activeView !== 'alphabet' &&
          activeView !== 'quiz' &&
          (showVoiceWarning || showUnsupportedWarning) && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
          >
            {showUnsupportedWarning
              ? 'Speech synthesis is not supported in this browser.'
              : 'No Uyghur voice detected on this device; use TTS API for reliable speech.'}
          </div>
        )}

        {activeView === 'home' ? (
          <HomePanel
            onConvert={() => setActiveView('convert')}
            onDictionary={() => setActiveView('dictionary')}
            onLearn={openLearnView}
            onQuiz={() => setActiveView('quiz')}
            onAlphabet={() => setActiveView('alphabet')}
          />
        ) : activeView === 'convert' ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <TextInput
                mode={inputMode}
                value={input}
                onChange={handleInputChange}
              />
              <ConversionOutput
                mode={outputMode}
                value={output}
                ipa={ipaText}
                trace={trace}
              />
            </div>
            <HighlightLegend />
            <CustomTransliterationPanel
              entries={customEntries}
              uey={customUey}
              uly={customUly}
              onUeyChange={setCustomUey}
              onUlyChange={setCustomUly}
              onAdd={addCustomEntry}
              onRemove={removeCustomEntry}
            />
            <ConversionHistoryPanel
              history={history}
              onRestore={restoreHistoryEntry}
              onClear={clearHistory}
            />
          </>
        ) : activeView === 'learn' ? (
          <LearnPanel trace={trace} value={input} onChange={setInput} />
        ) : activeView === 'quiz' ? (
          <QuizPanel />
        ) : activeView === 'alphabet' ? (
          <AlphabetPanel />
        ) : (
          <DictionaryPanel
            query={input}
            onQueryChange={setInput}
            onStudy={studyDictionaryEntry}
            onConvert={convertDictionaryEntry}
          />
        )}
      </div>
    </div>
  );
}

function AppTabs({
  activeView,
  onConvert,
  onLearn,
  onQuiz,
  onAlphabet,
  onDictionary,
}: {
  activeView: View;
  onConvert: () => void;
  onLearn: () => void;
  onQuiz: () => void;
  onAlphabet: () => void;
  onDictionary: () => void;
}) {
  const tabClass = (view: View) =>
    `inline-flex items-center justify-center gap-1 rounded-full px-1.5 py-2 text-[0.7rem] font-semibold transition sm:gap-1.5 sm:px-3 sm:text-sm ${
      activeView === view
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <nav
      aria-label="Workspace"
      className="grid w-full grid-cols-5 rounded-full border border-slate-200 bg-white p-1 shadow-sm md:w-[44rem]"
    >
      <button
        type="button"
        onClick={onConvert}
        aria-current={activeView === 'convert' ? 'page' : undefined}
        className={tabClass('convert')}
      >
        <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
        Convert
      </button>
      <button
        type="button"
        onClick={onLearn}
        aria-current={activeView === 'learn' ? 'page' : undefined}
        className={tabClass('learn')}
      >
        <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
        Learn UEY
      </button>
      <button
        type="button"
        onClick={onQuiz}
        aria-current={activeView === 'quiz' ? 'page' : undefined}
        className={tabClass('quiz')}
      >
        <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
        Quiz
      </button>
      <button
        type="button"
        onClick={onAlphabet}
        aria-current={activeView === 'alphabet' ? 'page' : undefined}
        className={tabClass('alphabet')}
      >
        <BookOpenText className="h-4 w-4 shrink-0" aria-hidden="true" />
        Alphabet
      </button>
      <button
        type="button"
        onClick={onDictionary}
        aria-current={activeView === 'dictionary' ? 'page' : undefined}
        className={tabClass('dictionary')}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        Dictionary
      </button>
    </nav>
  );
}

function HomePanel({
  onConvert,
  onDictionary,
  onLearn,
  onQuiz,
  onAlphabet,
}: {
  onConvert: () => void;
  onDictionary: () => void;
  onLearn: () => void;
  onQuiz: () => void;
  onAlphabet: () => void;
}) {
  return (
    <main className="grid gap-6">
      <section className="grid gap-5 py-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Uyghur script workspace
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Convert, search, and study Uyghur across UEY and ULY.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            UEY is the Uyghur Arabic-script writing system. ULY is Uyghur
            written with the Latin alphabet. UG Bridge keeps both forms visible
            for conversion, dictionary lookup, alphabet study, IPA hints, and
            speech playback.
          </p>
          <ScriptGlossary />
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConvert}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Start converting
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDictionary}
              className={BUTTON_CLASS}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search dictionary
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3">
            <div dir="rtl" lang="ug" className="text-4xl leading-relaxed text-slate-950">
              ئۇيغۇرچە يېزىق
            </div>
            <div className="font-mono text-lg font-semibold text-indigo-700">
              uyghurche yéziq
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {['ئا', 'ب', 'چ', 'غ', 'ق', 'ڭ', 'ئې', 'ي'].map((letter) => (
                <span
                  key={letter}
                  dir="rtl"
                  lang="ug"
                  className="grid h-12 place-items-center rounded-md bg-white text-2xl text-slate-900 ring-1 ring-slate-200"
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <HomeFeature
          icon={<Languages className="h-5 w-5" aria-hidden="true" />}
          title="Convert"
          description="Switch UEY and ULY text with visible letter-by-letter mapping."
          onClick={onConvert}
        />
        <HomeFeature
          icon={<Search className="h-5 w-5" aria-hidden="true" />}
          title="Dictionary"
          description="Look up Uyghur headwords from UEY, ULY, or English input."
          onClick={onDictionary}
        />
        <HomeFeature
          icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
          title="Learn UEY"
          description="Break ULY words into UEY letters, shapes, and IPA hints."
          onClick={onLearn}
        />
        <HomeFeature
          icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          title="Quiz"
          description="Practice all 32 UEY sounds across four presentation forms."
          onClick={onQuiz}
        />
        <HomeFeature
          icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
          title="Alphabet"
          description="Study all 32 letters, examples, joining forms, and vowels."
          onClick={onAlphabet}
        />
      </section>
    </main>
  );
}

function ScriptGlossary() {
  return (
    <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <dt className="font-semibold text-slate-950">UEY</dt>
        <dd className="mt-1 leading-6 text-slate-600">
          Uyghur Ereb Yéziqi, the Arabic-based script commonly used for Uyghur.
        </dd>
      </div>
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <dt className="font-semibold text-slate-950">ULY</dt>
        <dd className="mt-1 leading-6 text-slate-600">
          Uyghur Latin Yéziqi, a Latin-alphabet writing system for Uyghur.
        </dd>
      </div>
    </dl>
  );
}

function HomeFeature({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-40 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
    >
      <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-700">
        {icon}
      </span>
      <span className="mt-4 block text-base font-semibold text-slate-950">
        {title}
      </span>
      <span className="mt-2 block text-sm leading-6 text-slate-500">
        {description}
      </span>
    </button>
  );
}

function HighlightLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
      <LegendItem className="bg-sky-100 text-sky-950" label="letter" />
      <LegendItem className="bg-violet-100 text-violet-950" label="digraph" />
      <LegendItem className="bg-emerald-100 text-emerald-950" label="vowel" />
      <LegendItem
        className="bg-amber-100 text-amber-950"
        label="initial vowel"
      />
      <LegendItem
        className="bg-rose-100 text-rose-950"
        label="punctuation"
      />
    </div>
  );
}

function CustomTransliterationPanel({
  entries,
  uey,
  uly,
  onUeyChange,
  onUlyChange,
  onAdd,
  onRemove,
}: {
  entries: CustomTransliterationEntry[];
  uey: string;
  uly: string;
  onUeyChange: (value: string) => void;
  onUlyChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const canAdd = Boolean(uey.trim() && uly.trim());

  return (
    <section
      aria-label="Custom transliterations"
      className="mt-6 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
        <BookmarkPlus className="h-4 w-4 text-slate-400" aria-hidden="true" />
        Custom words
      </div>

      <form
        className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (canAdd) onAdd();
        }}
      >
        <input
          type="text"
          value={uey}
          onChange={(event) => onUeyChange(event.target.value)}
          dir="rtl"
          lang="ug"
          placeholder="قەشقەر"
          className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Custom UEY word"
        />
        <input
          type="text"
          value={uly}
          onChange={(event) => onUlyChange(event.target.value)}
          placeholder="Kashgar"
          className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          aria-label="Custom ULY word"
        />
        <button
          type="submit"
          disabled={!canAdd}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </form>

      {entries.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entries.map((entry) => (
            <span
              key={entry.id}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
            >
              <span className="truncate">
                <span dir="rtl" lang="ug">
                  {entry.uey}
                </span>{' '}
                → {entry.uly}
              </span>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label={`Remove custom word ${entry.uly}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ConversionHistoryPanel({
  history,
  onRestore,
  onClear,
}: {
  history: ConversionHistoryEntry[];
  onRestore: (entry: ConversionHistoryEntry) => void;
  onClear: () => void;
}) {
  if (!history.length) return null;

  return (
    <section
      aria-label="Recent conversions"
      className="mt-6 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Recent
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {history.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onRestore(entry)}
            className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <span className="mb-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[0.7rem] font-semibold text-slate-500 shadow-sm">
              {entry.direction === 'uey-to-uly' ? 'UEY → ULY' : 'ULY → UEY'}
            </span>
            <span className="block truncate text-sm font-medium text-slate-900">
              {entry.input}
            </span>
            <span className="mt-1 block truncate text-xs text-slate-500">
              {entry.output}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className={`rounded px-2 py-1 font-medium ${className}`}>
      {label}
    </span>
  );
}

function readInitialState(): InitialState {
  if (typeof window === 'undefined') {
    return { direction: 'uey-to-uly', input: '', view: 'home' };
  }

  const params = new URLSearchParams(window.location.search);
  const direction =
    params.get('d') === 'uly-to-uey' ? 'uly-to-uey' : 'uey-to-uly';
  const viewParam = params.get('view');
  const view =
    viewParam === 'learn' ||
    viewParam === 'home' ||
    viewParam === 'quiz' ||
    viewParam === 'alphabet' ||
    viewParam === 'dictionary'
      ? viewParam
      : 'home';
  return {
    direction,
    view,
    input: params.get('q') ?? '',
  };
}
