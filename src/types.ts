export type SchoolLevel = 'primary' | 'middle' | 'high';

export type TaskType = string;

export interface TaskTypeOption {
  id: string;
  en: string;
  vi: string;
  level: SchoolLevel;
  levelLabel: string;
  colorClass: string;
  hoverBgClass: string;
  selectedBgClass: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  colorHex: string;
}

export type ScoringScale = 10 | 100;

export type InputMethod = 'upload' | 'record' | 'video';

export interface FeedbackEntry {
  e: string;
  v: string;
}

export interface ScoreDetails {
  pronunciationScore: number;
  fluencyScore: number;
  intonationScore: number;
  vocabularyScore: number;
  grammarScore: number;
  taskCompletionScore: number;
  presentationScore?: number;
}

export interface PhonemeIssue {
  word: string;
  phoneticExpected?: string;
  phoneticIssue: string;
  severity: 'high' | 'medium' | 'low';
  errorType?: 'mispronounced' | 'missing_ending' | 'omitted_word' | 'stress_intonation';
  errorLabelVi?: string; // e.g. "Nuốt âm đuôi", "Phát âm lệch/sai", "Bỏ sót từ", "Sai trọng âm"
  suggestedActionVi?: string;
}

export interface SentenceComparison {
  studentSentence: string;
  improvedSentence: string;
  explanationVi: string;
  focusArea: 'grammar' | 'vocabulary' | 'naturalness';
}

export interface SpeechMetrics {
  durationSeconds: number;
  wordCount: number;
  wordsPerMinute: number;
  pauseCount: number;
  fillerWordsCount: number;
  fillerWordsList: string[];
  vocabularyRichnessPercentage: number;
  targetTaskAlignmentPercentage: number;
}

export type CefrLevel = 'Pre-A1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface AssessmentResult {
  overallScore: number;
  scale: ScoringScale;
  cefr: CefrLevel;
  cefrDescriptionVi?: string;
  hasVideo: boolean;
  transcript?: string;
  scores: {
    overall: string;
    pronunciation: string;
    fluency: string;
    intonation: string;
    vocabulary: string;
    grammar: string;
    taskCompletion: string;
    presentation?: string;
  };
  feedback: {
    pronunciation: FeedbackEntry;
    fluency: FeedbackEntry;
    intonation: FeedbackEntry;
    vocabulary: FeedbackEntry;
    grammar: FeedbackEntry;
    taskCompletion: FeedbackEntry;
    presentation?: FeedbackEntry;
  };
  speechMetrics?: SpeechMetrics;
  phonemeIssues?: PhonemeIssue[];
  sentenceComparisons?: SentenceComparison[];
  strengths?: string[];
  improvementPriorities?: string[];
  taskTopicEn?: string;
  taskTopicVi?: string;
}

export interface PracticePrompt {
  id: string;
  title: string;
  instructionVi: string;
  instructionEn: string;
  sampleContent: string;
  suggestedVocabulary?: string[];
  sampleQuestions?: string[];
  imageUrl?: string;
}
