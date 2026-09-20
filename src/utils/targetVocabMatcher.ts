import { TargetUnitItem } from '../data/textbookUnitsData';

/**
 * Normalizes text for keyword matching: removes punctuation, lowercases, collapses extra spaces
 */
export function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate common stem/lemma forms for target English words and phrases
 * (handles plurals, third person -s, past tense -ed/-irregular, continuous -ing)
 */
function getWordVariants(word: string): string[] {
  const clean = word.toLowerCase().trim();
  const variants = new Set<string>([clean]);

  // If it's a multi-word phrase (e.g. "play together", "get up", "ride a bike")
  if (clean.includes(' ')) {
    const parts = clean.split(' ');
    const firstWord = parts[0];
    const rest = parts.slice(1).join(' ');

    // Handle common verb conjugations on the first word
    const verbConjugations = getSingleWordVariants(firstWord);
    for (const v of verbConjugations) {
      variants.add(`${v} ${rest}`);
    }

    // Also flexible on "a / the" inside phrase (e.g., "ride a bike" -> "ride bikes", "ride bike")
    if (parts.includes('a') || parts.includes('the')) {
      const withoutArticle = parts.filter(p => p !== 'a' && p !== 'the').join(' ');
      variants.add(withoutArticle);
      const firstWithoutArticle = withoutArticle.split(' ')[0];
      const restWithoutArticle = withoutArticle.split(' ').slice(1).join(' ');
      for (const v of getSingleWordVariants(firstWithoutArticle)) {
        variants.add(`${v} ${restWithoutArticle}`);
      }
    }

    return Array.from(variants);
  }

  return Array.from(getSingleWordVariants(clean));
}

function getSingleWordVariants(w: string): Set<string> {
  const set = new Set<string>([w]);

  // Irregular verbs common in school curriculum
  const irregulars: Record<string, string[]> = {
    'get': ['gets', 'got', 'getting', 'gotten'],
    'go': ['goes', 'went', 'going', 'gone'],
    'do': ['does', 'did', 'doing', 'done'],
    'have': ['has', 'had', 'having'],
    'swim': ['swims', 'swam', 'swimming', 'swum'],
    'ride': ['rides', 'rode', 'riding', 'ridden'],
    'sing': ['sings', 'sang', 'singing', 'sung'],
    'can': ['can', 'could', 'cannot', "can't"],
    'make': ['makes', 'made', 'making'],
    'take': ['takes', 'took', 'taking', 'taken'],
    'see': ['sees', 'saw', 'seeing', 'seen'],
    'eat': ['eats', 'ate', 'eating', 'eaten'],
    'write': ['writes', 'wrote', 'writing', 'written'],
    'read': ['reads', 'reading'],
    'run': ['runs', 'ran', 'running'],
    'speak': ['speaks', 'spoke', 'speaking', 'spoken'],
  };

  if (irregulars[w]) {
    irregulars[w].forEach(item => set.add(item));
  }

  // Plurals and simple past/present
  if (w.endsWith('y') && w.length > 2) {
    set.add(w.slice(0, -1) + 'ies'); // activity -> activities
    set.add(w.slice(0, -1) + 'ied');
  } else if (w.endsWith('e')) {
    set.add(w + 's');
    set.add(w + 'd');
    set.add(w.slice(0, -1) + 'ing');
  } else {
    set.add(w + 's');
    set.add(w + 'es');
    set.add(w + 'ed');
    set.add(w + 'ing');
  }

  // Plural -> singular if base word was plural
  if (w.endsWith('s') && w.length > 3) {
    set.add(w.slice(0, -1));
  }

  return set;
}

/**
 * Checks if a target keyword or phrase was successfully spoken in the student transcript
 */
export function checkWordInTranscript(targetWord: string, transcript: string): boolean {
  if (!transcript || transcript.trim().length === 0) return false;

  const normalizedTranscript = ' ' + normalizeForMatching(transcript) + ' ';
  const variants = getWordVariants(targetWord);

  for (const variant of variants) {
    const normVariant = normalizeForMatching(variant);
    // Exact word boundary match
    const regex = new RegExp(`(^|\\s)${escapeRegex(normVariant)}(?=\\s|$)`, 'i');
    if (regex.test(normalizedTranscript)) {
      return true;
    }
  }

  return false;
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface TargetKeywordEvaluation {
  word: string;
  phonetic?: string;
  meaningVi: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  isUsed: boolean;
}

export interface TargetGrammarEvaluation {
  pattern: string;
  explanationVi: string;
  example: string;
  isApplied: boolean;
}

export interface UnitChecklistResult {
  unitId: string;
  unitTitleEn: string;
  unitTitleVi: string;
  textbook: string;
  grade: number;
  totalWords: number;
  usedWordsCount: number;
  wordPercentage: number;
  keywords: TargetKeywordEvaluation[];
  grammarPatterns: TargetGrammarEvaluation[];
  isFullyMastered: boolean;
}

/**
 * Evaluates entire target checklist against current spoken transcript
 */
export function evaluateTranscriptAgainstUnit(
  unit: TargetUnitItem,
  transcript: string
): UnitChecklistResult {
  const keywords: TargetKeywordEvaluation[] = unit.targetKeywords.map((item) => {
    const isUsed = checkWordInTranscript(item.word, transcript);
    return {
      ...item,
      isUsed,
    };
  });

  const grammarPatterns: TargetGrammarEvaluation[] = unit.keyGrammarPatterns.map((gp) => {
    // Check if key structural indicator words exist in transcript
    const isApplied = checkGrammarStructureMatch(gp.pattern, transcript);
    return {
      ...gp,
      isApplied,
    };
  });

  const totalWords = keywords.length;
  const usedWordsCount = keywords.filter((k) => k.isUsed).length;
  const wordPercentage = totalWords > 0 ? Math.round((usedWordsCount / totalWords) * 100) : 0;

  return {
    unitId: unit.id,
    unitTitleEn: unit.unitTitleEn,
    unitTitleVi: unit.unitTitleVi,
    textbook: unit.textbook,
    grade: unit.grade,
    totalWords,
    usedWordsCount,
    wordPercentage,
    keywords,
    grammarPatterns,
    isFullyMastered: usedWordsCount === totalWords && totalWords > 0,
  };
}

/**
 * Checks if basic elements of the grammar pattern appear in the transcript
 */
function checkGrammarStructureMatch(pattern: string, transcript: string): boolean {
  if (!transcript || transcript.trim().length === 0) return false;
  const norm = normalizeForMatching(transcript);

  // Pattern heuristics:
  // e.g. "What is he/she like? - He/She is [adjective]."
  if (pattern.includes('What is he') || pattern.includes('like')) {
    return norm.includes('he is') || norm.includes('she is') || norm.includes('is very') || norm.includes('like');
  }
  if (pattern.includes('What time do you') || pattern.includes('o\'clock')) {
    return norm.includes('at') || norm.includes('o clock') || norm.includes('in the morning') || norm.includes('in the afternoon');
  }
  if (pattern.includes('Can you') || pattern.includes('I can')) {
    return norm.includes('can') || norm.includes('cannot') || norm.includes("can't");
  }
  if (pattern.includes('What day is it')) {
    return norm.includes('monday') || norm.includes('friday') || norm.includes('weekend') || norm.includes('today is');
  }
  if (pattern.includes('address') || pattern.includes('What is your address')) {
    return norm.includes('address') || norm.includes('flat') || norm.includes('city') || norm.includes('tower');
  }
  if (pattern.includes('would you like to be')) {
    return norm.includes('would like') || norm.includes('want to be') || norm.includes('because');
  }
  if (pattern.includes('Past Simple') || pattern.includes('donated')) {
    return norm.includes('last') || norm.includes('donated') || norm.includes('collected') || norm.includes('planted');
  }

  // Fallback: at least some key words match
  return norm.length > 25;
}
