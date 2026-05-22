import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadStaticDictionaryEntries,
  searchDictionary,
  suggestDictionary,
} from '../src/lib/dictionary';

describe('searchDictionary', () => {
  it('returns no results for empty queries', () => {
    expect(searchDictionary('')).toEqual([]);
    expect(searchDictionary('   ')).toEqual([]);
  });

  it('finds entries by ULY headword', () => {
    const [result] = searchDictionary('salam');
    expect(result.entry.uey).toBe('سالام');
    expect(result.matchedOn).toBe('uly');
    expect(result.matchedText).toBe('salam');
  });

  it('finds entries by UEY headword', () => {
    const [result] = searchDictionary('ياخشى');
    expect(result.entry.uly).toBe('yaxshi');
    expect(result.matchedOn).toBe('uly');
  });

  it('finds entries by English definition', () => {
    const [result] = searchDictionary('book');
    expect(result.entry.uly).toBe('kitab');
    expect(result.matchedOn).toBe('definition');
    expect(result.matchedText).toBe('book');
  });

  it('finds entries by example text', () => {
    const [result] = searchDictionary('love');
    expect(result.entry.uly).toBe('körimen');
    expect(result.matchedOn).toBe('example');
  });

  it('can limit search to English definitions', () => {
    expect(searchDictionary('book', undefined, 'english')).toHaveLength(1);
    expect(searchDictionary('kitab', undefined, 'english')).toEqual([]);
  });

  it('can limit search to UEY headwords', () => {
    const [result] = searchDictionary('ياخشى', undefined, 'uey');
    expect(result.entry.uly).toBe('yaxshi');
    expect(result.matchedOn).toBe('uey');
    expect(searchDictionary('yaxshi', undefined, 'uey')).toEqual([]);
  });

  it('can limit search to ULY headwords', () => {
    const [result] = searchDictionary('yaxshi', undefined, 'uly');
    expect(result.entry.uey).toBe('ياخشى');
    expect(result.matchedOn).toBe('uly');
    expect(searchDictionary('good', undefined, 'uly')).toEqual([]);
  });

  it('ranks exact and compact matches before broad noisy matches', () => {
    const results = searchDictionary('book', [
      {
        id: 'broad',
        uey: 'ئالدىن بېكىتىش',
        uly: 'aldin békitish',
        ipa: '',
        partOfSpeech: 'translation',
        definitions: ['schedule budgeting book', 'reservation', 'book up'],
      },
      {
        id: 'exact',
        uey: 'كىتاب',
        uly: 'kitab',
        ipa: '',
        partOfSpeech: 'noun',
        definitions: ['book'],
      },
    ]);

    expect(results[0].entry.id).toBe('exact');
    expect(results[0].matchedText).toBe('book');
  });
});

describe('suggestDictionary', () => {
  it('returns no suggestions for empty queries', () => {
    expect(suggestDictionary('')).toEqual([]);
    expect(suggestDictionary('   ')).toEqual([]);
  });

  it('suggests ULY headwords by prefix', () => {
    const [suggestion] = suggestDictionary('ya');
    expect(suggestion.value).toBe('yaxshi');
    expect(suggestion.matchedOn).toBe('uly');
  });

  it('suggests UEY headwords by prefix', () => {
    const [suggestion] = suggestDictionary('يا');
    expect(suggestion.entry.uly).toBe('yaxshi');
    expect(suggestion.matchedOn).toBe('uly');
  });

  it('suggests English definitions', () => {
    const [suggestion] = suggestDictionary('goo');
    expect(suggestion.value).toBe('good');
    expect(suggestion.entry.uly).toBe('yaxshi');
    expect(suggestion.matchedOn).toBe('definition');
  });

  it('can limit suggestions to English definitions', () => {
    const [suggestion] = suggestDictionary('goo', undefined, 'english');
    expect(suggestion.value).toBe('good');
    expect(suggestDictionary('ya', undefined, 'english')).toEqual([]);
  });

  it('can limit suggestions to UEY headwords', () => {
    const [suggestion] = suggestDictionary('يا', undefined, 'uey');
    expect(suggestion.value).toBe('ياخشى');
    expect(suggestion.matchedOn).toBe('uey');
    expect(suggestDictionary('ya', undefined, 'uey')).toEqual([]);
  });

  it('can limit suggestions to ULY headwords', () => {
    const [suggestion] = suggestDictionary('ya', undefined, 'uly');
    expect(suggestion.value).toBe('yaxshi');
    expect(suggestion.matchedOn).toBe('uly');
    expect(suggestDictionary('يا', undefined, 'uly')[0].value).toBe('yaxshi');
  });
});

describe('loadStaticDictionaryEntries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads only UEY shards for Arabic auto queries', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/dictionary/manifest.json') {
        return jsonResponse({
          entryCount: 1,
          definitionCount: 1,
          source: {
            repo: 'test/repo',
            license: 'apache-2.0',
            url: 'https://example.com',
          },
          shards: {
            english: { other: { file: 'shards/english-other.json', count: 1 } },
            uly: { y: { file: 'shards/uly-y.json', count: 1 } },
            uey: { '64a': { file: 'shards/uey-64a.json', count: 1 } },
          },
        });
      }

      return jsonResponse([['ياخشى', 'yaxshi', ['good']]]);
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await loadStaticDictionaryEntries('ياخشى', 'auto');

    expect(result.entries[0].uly).toBe('yaxshi');
    expect(fetchMock).toHaveBeenCalledWith('/dictionary/manifest.json');
    expect(fetchMock).toHaveBeenCalledWith('/dictionary/shards/uey-64a.json');
    expect(fetchMock).not.toHaveBeenCalledWith('/dictionary/shards/english-other.json');
  });
});

function jsonResponse(value: unknown) {
  return {
    ok: true,
    json: async () => value,
  } as Response;
}
