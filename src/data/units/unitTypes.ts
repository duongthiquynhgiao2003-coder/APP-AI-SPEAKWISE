export interface TargetKeywordItem {
  word: string;
  phonetic?: string;
  meaningVi: string;
  partOfSpeech?: string;
  exampleSentence?: string;
}

export interface KeyGrammarPatternItem {
  pattern: string;
  explanationVi: string;
  example: string;
}

export type GrammarPatternItem = KeyGrammarPatternItem;

export interface TargetUnitItem {
  id: string;
  grade: number;
  textbook: 'Global Success' | 'Friends Plus' | 'i-Learn Smart';
  unitNumber: number;
  unitTitleEn: string;
  unitTitleVi: string;
  theme: string;
  targetKeywords: TargetKeywordItem[];
  keyGrammarPatterns: KeyGrammarPatternItem[];
}
