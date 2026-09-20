/**
 * Shadowing & Re-try Evaluator
 * Compares student's spoken sentence against target model sentence.
 * Calculates word accuracy, pronunciation alignment, rhythm (WPM), and awards badges.
 */

export interface WordMatch {
  word: string;
  matchedSpokenWord?: string;
  status: 'correct' | 'near' | 'missing';
  similarity: number; // 0 to 1
  note?: string;
}

export interface ShadowingEvaluationResult {
  targetSentence: string;
  spokenSentence: string;
  wordMatches: WordMatch[];
  accuracyScore: number; // 0 - 100
  fluencyScore: number; // 0 - 100
  rhythmScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  wordsPerMinute: number;
  durationSeconds: number;
  badge: 'excellent' | 'good' | 'needs_practice';
  badgeTitleEn: string;
  badgeTitleVi: string;
  badgeDescriptionVi: string;
  feedbackVi: string[];
}

function cleanWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[^\w']/g, '')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let j = 0; j <= bn; ++j) matrix[j][0] = j;

  for (let j = 1; j <= bn; ++j) {
    for (let i = 1; i <= an; ++i) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

function wordSimilarity(w1: string, w2: string): number {
  const c1 = cleanWord(w1);
  const c2 = cleanWord(w2);
  if (!c1 || !c2) return 0;
  if (c1 === c2) return 1.0;

  // Handle common contractions & synonyms
  const equivalents: [string, string][] = [
    ["i'm", 'i am'],
    ["it's", 'it is'],
    ["don't", 'do not'],
    ["doesn't", 'does not'],
    ["can't", 'cannot'],
    ["didn't", 'did not'],
    ['mom', 'mother'],
    ['dad', 'father'],
    ['two', '2'],
    ['three', '3'],
    ['four', '4'],
    ['five', '5'],
  ];

  for (const [eq1, eq2] of equivalents) {
    if ((c1 === eq1 && c2 === eq2) || (c1 === eq2 && c2 === eq1)) {
      return 0.98;
    }
  }

  const maxLen = Math.max(c1.length, c2.length);
  const dist = levenshtein(c1, c2);
  const sim = Math.max(0, 1 - dist / maxLen);
  return sim;
}

/**
 * Evaluates student's shadowing attempt against the target sentence
 */
export function evaluateShadowingAttempt(
  targetSentence: string,
  spokenSentence: string,
  durationSeconds: number = 4
): ShadowingEvaluationResult {
  const targetWordsRaw = targetSentence.trim().split(/\s+/).filter(Boolean);
  const spokenWordsRaw = spokenSentence.trim().split(/\s+/).filter(Boolean);

  const targetWords = targetWordsRaw.map(w => cleanWord(w));
  const spokenWords = spokenWordsRaw.map(w => cleanWord(w));

  // Align words sequentially using dynamic programming / greedy lookahead
  const wordMatches: WordMatch[] = [];
  let spokenIdx = 0;
  let correctCount = 0;
  let nearCount = 0;

  for (let i = 0; i < targetWordsRaw.length; i++) {
    const rawTarget = targetWordsRaw[i];
    const cleanT = targetWords[i];

    // Look ahead in spoken words (window of 3) to find best match
    let bestMatchIdx = -1;
    let highestSim = 0;

    for (let j = spokenIdx; j < Math.min(spokenIdx + 4, spokenWords.length); j++) {
      const sim = wordSimilarity(cleanT, spokenWords[j]);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatchIdx = j;
      }
    }

    if (bestMatchIdx !== -1 && highestSim >= 0.82) {
      // High match: Correct
      wordMatches.push({
        word: rawTarget,
        matchedSpokenWord: spokenWordsRaw[bestMatchIdx],
        status: 'correct',
        similarity: highestSim,
      });
      correctCount++;
      spokenIdx = bestMatchIdx + 1;
    } else if (bestMatchIdx !== -1 && highestSim >= 0.55) {
      // Partial / Near match
      wordMatches.push({
        word: rawTarget,
        matchedSpokenWord: spokenWordsRaw[bestMatchIdx],
        status: 'near',
        similarity: highestSim,
        note: `Phát âm nghe giống "${spokenWordsRaw[bestMatchIdx]}"`,
      });
      nearCount++;
      spokenIdx = bestMatchIdx + 1;
    } else {
      // Word omitted or not captured
      wordMatches.push({
        word: rawTarget,
        status: 'missing',
        similarity: 0,
        note: 'Chưa nghe thấy hoặc bị bỏ sót',
      });
    }
  }

  // 1. Accuracy score (0 - 100)
  const totalTargetWords = Math.max(1, targetWordsRaw.length);
  const accuracyScore = Math.round(
    Math.min(100, Math.max(0, ((correctCount * 1.0 + nearCount * 0.6) / totalTargetWords) * 100))
  );

  // 2. Rhythm & WPM
  const safeDuration = Math.max(1.5, durationSeconds);
  const wordsPerMinute = Math.round((spokenWordsRaw.length / safeDuration) * 60);

  // Rhythm score based on comfortable ESL speaking pace (70 - 130 WPM is ideal)
  let rhythmScore = 90;
  if (wordsPerMinute >= 75 && wordsPerMinute <= 125) {
    rhythmScore = 95;
  } else if (wordsPerMinute >= 60 && wordsPerMinute < 75) {
    rhythmScore = 82;
  } else if (wordsPerMinute > 125 && wordsPerMinute <= 150) {
    rhythmScore = 85;
  } else if (wordsPerMinute < 60) {
    rhythmScore = 70;
  } else {
    rhythmScore = 75;
  }

  // 3. Fluency score
  const coverageRatio = spokenWordsRaw.length / totalTargetWords;
  let fluencyScore = Math.round(
    Math.min(100, Math.max(40, (coverageRatio >= 0.8 && coverageRatio <= 1.3 ? 92 : 75) * (accuracyScore / 100)))
  );
  if (fluencyScore < 50) fluencyScore = 50;

  // 4. Overall Weighted Score
  const overallScore = Math.round(accuracyScore * 0.7 + rhythmScore * 0.15 + fluencyScore * 0.15);

  // 5. Badging
  let badge: 'excellent' | 'good' | 'needs_practice' = 'needs_practice';
  let badgeTitleEn = 'KEEP TRYING & RE-PRACTICE';
  let badgeTitleVi = 'CỐ GẮNG LÊN - LUYỆN LẠI NHÉ!';
  let badgeDescriptionVi = 'Em hãy nghe lại mẫu chuẩn 0.8x một lần nữa và thử nói lại để bắt kịp nhịp điệu nhé.';

  if (overallScore >= 80) {
    badge = 'excellent';
    badgeTitleEn = 'EXCELLENT MASTERY ACHIEVED!';
    badgeTitleVi = '⭐ ĐẠT CHUẨN XUẤT SẮC!';
    badgeDescriptionVi = 'Tuyệt vời! Em đã phát âm rõ ràng, nhịp điệu tự nhiên và bám sát hoàn hảo câu mẫu!';
  } else if (overallScore >= 60) {
    badge = 'good';
    badgeTitleEn = 'GOOD EFFORT & PROGRESS!';
    badgeTitleVi = '👍 ĐẠT YÊU CẦU - KHÁ TỐT!';
    badgeDescriptionVi = 'Khá tốt! Em đã nắm được cấu trúc chính, chỉ cần nói to và tròn vành rõ chữ hơn ở các từ được đánh dấu.';
  }

  // 6. Actionable pedagogical feedback
  const feedbackVi: string[] = [];

  const missingWords = wordMatches.filter(m => m.status === 'missing').map(m => `"${m.word}"`);
  const nearWords = wordMatches.filter(m => m.status === 'near').map(m => `"${m.word}"`);

  if (accuracyScore >= 85) {
    feedbackVi.push('• Độ chính xác từ vựng rất cao, ngữ âm chuẩn xác và ngắt nghỉ tự nhiên.');
  } else if (missingWords.length > 0) {
    feedbackVi.push(`• Từ cần chú ý bổ sung: Em bị lỡ hoặc đọc lướt các từ: ${missingWords.slice(0, 4).join(', ')}.`);
  }

  if (nearWords.length > 0) {
    feedbackVi.push(`• Chú ý phát âm rõ âm cuối và trọng âm ở: ${nearWords.slice(0, 3).join(', ')}.`);
  }

  if (wordsPerMinute >= 75 && wordsPerMinute <= 130) {
    feedbackVi.push(`• Tốc độ nói lý tưởng (${wordsPerMinute} WPM), nhịp điệu đều đặn vừa vặn cho độ tuổi.`);
  } else if (wordsPerMinute < 75) {
    feedbackVi.push(`• Tốc độ nói (${wordsPerMinute} WPM) hơi chậm một chút. Lần sau em hãy tự tin nối các từ liền mạch hơn.`);
  } else {
    feedbackVi.push(`• Tốc độ nói (${wordsPerMinute} WPM) hơi nhanh. Em hãy chú ý ngắt nhịp nhẹ ở các dấu câu nhé.`);
  }

  return {
    targetSentence,
    spokenSentence,
    wordMatches,
    accuracyScore,
    fluencyScore,
    rhythmScore,
    overallScore,
    wordsPerMinute,
    durationSeconds: Math.round(safeDuration * 10) / 10,
    badge,
    badgeTitleEn,
    badgeTitleVi,
    badgeDescriptionVi,
    feedbackVi,
  };
}
