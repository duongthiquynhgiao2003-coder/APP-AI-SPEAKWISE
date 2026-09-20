/**
 * Punctuation, Capitalization and Speech Transcription Normalizer
 *
 * High-precision speech-to-text post-processor for primary/middle school English speaking.
 * Features:
 * 1. Intelligent sentence boundary splitting based on English syntactic transitions.
 * 2. Proper capitalization for sentence starts, "I" / "I'm", countries, cities, subjects, and names.
 * 3. Terminal periods (.) at the end of complete sentences and question marks (?) for questions.
 * 4. Cleaning stutter artifacts (e.g. "am I I'm" -> "I'm", duplicate identical words).
 * 5. Supports both real-time interim streaming and final committed passes.
 */

const COMMON_PROPER_NOUNS = new Set([
  // Countries & Nationalities
  'vietnam',
  'vietnamese',
  'england',
  'english',
  'america',
  'american',
  'britain',
  'british',
  'australia',
  'australian',
  'singapore',
  'singaporean',
  'japan',
  'japanese',
  'korea',
  'korean',
  'china',
  'chinese',
  'france',
  'french',
  'canada',
  'canadian',
  'germany',
  'german',
  'thailand',
  'thai',
  'malaysia',
  // Cities
  'hanoi',
  'saigon',
  'danang',
  'london',
  'tokyo',
  'seoul',
  'paris',
  'sydney',
  // Days & Months
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  // Common School Subjects
  'math',
  'science',
  'music',
  // Common Student Names (Vietnamese & English)
  'nam',
  'linh',
  'lan',
  'mai',
  'minh',
  'phong',
  'hoa',
  'huy',
  'duc',
  'vy',
  'nga',
  'trang',
  'long',
  'quan',
  'phuc',
  'bao',
  'an',
  'binh',
  'quynh',
  'giao',
  'alex',
  'sam',
  'tom',
  'john',
  'mary',
  'david',
  'peter',
  'lucy',
  'sarah',
  'emma',
  'ben',
  'jack',
  'lily',
  'linda',
  'tony',
  'peter',
  'tom',
  'mary',
]);

/**
 * Words that can NEVER be the end of a sentence (prepositions, conjunctions, articles, copulas)
 */
const NON_TERMINAL_WORDS = new Set([
  'and',
  'or',
  'but',
  'because',
  'so',
  'that',
  'which',
  'who',
  'when',
  'where',
  'if',
  'while',
  'as',
  'with',
  'to',
  'of',
  'for',
  'in',
  'on',
  'at',
  'from',
  'about',
  'the',
  'a',
  'an',
  'is',
  'are',
  'am',
  'was',
  'were',
  'be',
  'been',
  'my',
  'your',
  'his',
  'her',
  'our',
  'their',
]);

/**
 * Clean and structure raw speech recognition output into accurately punctuated,
 * beautifully capitalized English sentences.
 *
 * @param rawText The raw transcription from Web Speech API.
 * @param isFinalPass If true, ensures every completed sentence terminates with . or ?
 */
export function normalizeTranscribedSpeech(rawText: string, isFinalPass: boolean = true): string {
  if (!rawText || !rawText.trim()) return '';

  let text = rawText.trim();

  // 1. Clean common microphone stutter & recognition artifacts
  text = text.replace(/\bam\s+i\s+i'm\b/gi, "I'm");
  text = text.replace(/\bam\s+i\s+i\s+am\b/gi, 'I am');
  text = text.replace(/\bhello\s+am\s+i\b/gi, "hello, I'm");
  text = text.replace(/\bhello\s+am\b/gi, 'hello');
  text = text.replace(/\b(i|i'm)\s+(i|i'm)\b/gi, "I'm");
  text = text.replace(/\b(\w+)\s+\1\b/gi, '$1'); // deduplicate identical consecutive words (e.g. "my my" -> "my")

  // 2. Identify sentence boundaries and insert terminal markers (. or ?)
  // Pattern A: Greetings boundary
  text = text.replace(
    /\b(hello|hi|good\s+morning|good\s+afternoon|good\s+evening)\s+(my\s+name|i'm|i\s+am|everyone|teacher|today|how)\b/gi,
    '$1. $2'
  );

  // Pattern B: Name declaration boundary
  // "my name is Lan I am from Vietnam..." -> "my name is Lan. I am from Vietnam..."
  text = text.replace(
    /\b(my\s+name\s+is\s+[a-zA-Z]+)\s+(i'm|i\s+am|i\s+come|i\s+live|today|this\s+is)\b/gi,
    '$1. $2'
  );

  // Pattern C: Origin / Country boundary
  // "... from Vietnam I'm 9 years old..." -> "... from Vietnam. I'm 9 years old..."
  text = text.replace(
    /\b((?:i'm|i\s+am|i\s+come)\s+from\s+[a-zA-Z]+(?:\s+city)?)\s+(i'm|i\s+am|my|today|i\s+live|i\s+study|i\s+like|i\s+love)\b/gi,
    '$1. $2'
  );

  // Pattern D: Age boundary
  // "... 9 years old my favorite color is..." -> "... 9 years old. My favorite color is..."
  text = text.replace(
    /\b((?:i'm|i\s+am|\b)\s*\d+\s+years?\s+old)\s+(my|i'm|i\s+am|i\s+like|i\s+love|i\s+study|i\s+live|what|there|and)\b/gi,
    '$1. $2'
  );

  // Pattern E: Favorites boundary
  // "my favorite [noun] is [value] I like..." -> "my favorite [noun] is [value]. I like..."
  text = text.replace(
    /\b(my\s+favorite\s+[a-zA-Z]+\s+is\s+[a-zA-Z]+)\s+(i\s+like|i\s+love|my|what|there|in\s+my|and\s+you)\b/gi,
    '$1. $2'
  );

  // Pattern F: Likes / Preference / Hobby boundary
  // "I like chicken what do you like" -> "I like chicken. What do you like?"
  text = text.replace(
    /\b(i\s+(?:like|love|enjoy)\s+[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(what\s+do\s+you|what\s+about|how\s+about|and\s+you|my\s+favorite|i\s+also)\b/gi,
    '$1. $2'
  );

  // Pattern G: General Subject-Verb boundary after completed thought
  // When a new clause starts with "I am / I'm / My / He is / She is / There is / There are"
  // and the preceding word is NOT a preposition/conjunction, insert a period.
  text = text.replace(
    /\b([a-zA-Z]{2,})\s+(i'm|i\s+am|my\s+favorite|there\s+are|there\s+is|he\s+is|she\s+is|it\s+is)\b/gi,
    (match, prevWord, nextPhrase) => {
      const lowerPrev = prevWord.toLowerCase();
      if (NON_TERMINAL_WORDS.has(lowerPrev)) {
        return match; // keep as-is if preceded by preposition/conjunction like "and", "because", "from"
      }
      return `${prevWord}. ${nextPhrase}`;
    }
  );

  // Pattern H: Interactive Questions at the end or middle
  text = text.replace(
    /\b(what\s+do\s+you\s+like|what\s+about\s+you|how\s+about\s+you|what\s+is\s+your\s+name|how\s+old\s+are\s+you)\b/gi,
    '$1?'
  );

  // Pattern I: Polite Closings
  text = text.replace(
    /\b(thank\s+you\s+for\s+listening|thanks\s+for\s+watching|nice\s+to\s+meet\s+you|goodbye|bye)\b/gi,
    '$1.'
  );

  // Clean redundant punctuation spaces
  text = text.replace(/\s*([.?!])\s*/g, '$1 ');

  // 3. Break into sentences and capitalize properly
  const sentenceTokens = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const formattedSentences = sentenceTokens.map((sentence, sIdx) => {
    if (!sentence) return '';

    // Split words inside sentence
    const words = sentence.split(/\s+/);
    const capitalizedWords = words.map((w, idx) => {
      // First word of sentence must always be capitalized
      if (idx === 0) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }

      // Standalone "i" or contractions like "i'm", "i've", "i'll", "i'd"
      if (/^i('m|'ve|'ll|'d)?$/i.test(w)) {
        return 'I' + w.slice(1);
      }

      // Check proper nouns (countries, cities, days, common names)
      const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
      if (COMMON_PROPER_NOUNS.has(cleanWord)) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }

      // Check if word immediately follows "name is [Name]" or "I am [Name]"
      if (
        (idx >= 3 && words[idx - 2]?.toLowerCase() === 'name' && words[idx - 1]?.toLowerCase() === 'is') ||
        (idx >= 2 && words[idx - 1]?.toLowerCase() === 'am' && idx === 2)
      ) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }

      return w;
    });

    let result = capitalizedWords.join(' ');

    // Terminal punctuation check:
    // If it is the last sentence and isFinalPass is false (user still speaking), do not force period yet
    const isLastSentence = sIdx === sentenceTokens.length - 1;
    if (!/[.?!]$/.test(result)) {
      if (isFinalPass || !isLastSentence) {
        result += '.';
      }
    }

    return result;
  });

  return formattedSentences.join(' ').trim();
}
