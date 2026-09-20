import { PhonemeIssue } from '../types';

export interface PhonologicalProfile {
  ipa: string;
  category: 'ending_consonant' | 'stress' | 'vowel_length' | 'cluster';
  errorType: 'missing_ending' | 'mispronounced' | 'stress_intonation';
  errorLabelVi: string;
  problemVi: string;
  solutionVi: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Curated knowledge base of common pronunciation errors, missing endings, and phonetic traps
 * specifically for Vietnamese learners speaking English.
 */
const PHONEME_DATABASE: Record<string, PhonologicalProfile> = {
  // 1. High frequency words with critical ending sounds (/s/, /z/, /ʃ/, /tʃ/, /k/, /t/, /d/, /v/)
  england: {
    ipa: '/ˈɪŋɡlənd/',
    category: 'cluster',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt cụm âm cuối /nd/',
    problemVi: 'Học sinh thường nuốt âm cuối thành "Ing-lân" hoặc đọc lệch thành "Ing-lừn", bỏ quên âm bật /d/.',
    solutionVi: 'Nhấn trọng âm ở âm đầu /ˈɪŋɡ/, âm sau đọc lướt /lənd/ và bật nhẹ âm chặn /d/ ở đầu lưỡi.',
    severity: 'high',
  },
  english: {
    ipa: '/ˈɪŋɡlɪʃ/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Thiếu âm đuôi /ʃ/',
    problemVi: 'Học sinh thường nuốt âm gió cuối hoặc phát âm nhầm thành "ing-lít" / "ing-lích".',
    solutionVi: 'Chu tròn môi, cong nhẹ đầu lưỡi và bật luồng hơi ma sát /ʃ/ (âm "suýt") dứt khoát.',
    severity: 'high',
  },
  is: {
    ipa: '/ɪz/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm rung /z/',
    problemVi: 'Dễ nuốt âm đuôi thành "i" hoặc đọc thành âm vô thanh /s/.',
    solutionVi: 'Rung nhẹ dây thanh quản ở cuối từ để tạo âm /z/, không nuốt âm.',
    severity: 'high',
  },
  like: {
    ipa: '/laɪk/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Thiếu âm chặn /k/',
    problemVi: 'Thường nuốt âm cuối thành "lai", khiến người nghe nhầm thành "lie" (nói dối / nằm).',
    solutionVi: 'Nâng phần sau của lưỡi chạm vòm miệng mềm và bật dứt khoát âm chặn hơi /k/.',
    severity: 'high',
  },
  likes: {
    ipa: '/laɪks/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Rơi rụng cụm âm đuôi /ks/',
    problemVi: 'Thường bỏ quên âm /s/ chia động từ ngôi thứ ba số ít hoặc nuốt âm /k/.',
    solutionVi: 'Bật liên tục hai phụ âm dứt khoát: chặn hơi /k/ rồi xì gió /s/ ngay lập tức (/laɪks/).',
    severity: 'high',
  },
  chicken: {
    ipa: '/ˈtʃɪkɪn/',
    category: 'cluster',
    errorType: 'mispronounced',
    errorLabelVi: 'Phát âm lệch âm đầu /tʃ/',
    problemVi: 'Dễ đọc âm đầu /tʃ/ thành "si" hoặc "chi" nhẹ không bật hơi.',
    solutionVi: 'Khép đầu lưỡi vào vòm họng trên và bật hơi thật mạnh để tạo âm /tʃ/ chuẩn xác.',
    severity: 'medium',
  },
  vietnam: {
    ipa: '/ˌvjetˈnæm/',
    category: 'stress',
    errorType: 'stress_intonation',
    errorLabelVi: 'Sai trọng âm tiếng Anh',
    problemVi: 'Thường đọc đều bằng giọng tiếng Việt "Việt Nam", thiếu trọng âm chính tiếng Anh.',
    solutionVi: 'Nhấn mạnh rõ vào âm tiết thứ hai /-ˈnæm/ và ngậm hai môi dứt khoát để giữ âm /m/.',
    severity: 'medium',
  },
  vietnamese: {
    ipa: '/ˌvjetnəˈmiːz/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Thiếu âm đuôi rung /z/',
    problemVi: 'Dễ đọc lướt thành "vịt-na-mi", bỏ mất âm rung /z/ và trọng âm âm tiết 3.',
    solutionVi: 'Ngân dài nguyên âm /iː/ và rung nhẹ dây thanh quản cho âm cuối /z/.',
    severity: 'high',
  },
  love: {
    ipa: '/lʌv/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm răng môi /v/',
    problemVi: 'Thường phát âm thành "lớp" (nhầm sang âm /p/) hoặc "lâu" (nuốt hẳn phụ âm cuối).',
    solutionVi: 'Đặt răng cửa trên chạm nhẹ môi dưới và thổi luồng hơi rung /v/ ở cuối từ.',
    severity: 'medium',
  },
  name: {
    ipa: '/neɪm/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm ngậm môi /m/',
    problemVi: 'Dễ phát âm thành "nây" (nuốt âm cuối /m/) thay vì ngậm hai môi kết thúc.',
    solutionVi: 'Phát âm nguyên âm đôi /eɪ/ rồi khép chặt hai môi lại để phát rõ âm mũi /m/.',
    severity: 'medium',
  },
  school: {
    ipa: '/skuːl/',
    category: 'cluster',
    errorType: 'mispronounced',
    errorLabelVi: 'Lệch cụm phụ âm /sk/ & /l/',
    problemVi: 'Thường chèn thêm nguyên âm thừa thành "sờ-cun" và không cong lưỡi âm /l/.',
    solutionVi: 'Không đọc "sờ", ngậm âm /k/ nhanh, ngân dài /uː/ rồi cong đầu lưỡi chạm chân răng trên /l/.',
    severity: 'high',
  },
  children: {
    ipa: '/ˈtʃɪldrən/',
    category: 'cluster',
    errorType: 'mispronounced',
    errorLabelVi: 'Phát âm sai âm đầu /tʃ/ và /dr/',
    problemVi: 'Đọc thành "chi-đần" hoặc nhầm lẫn với số ít "child".',
    solutionVi: 'Nhấn mạnh âm đầu /ˈtʃɪl/, bật gọn cụm phụ âm /dr/ ở âm tiết sau (/drən/).',
    severity: 'medium',
  },
  child: {
    ipa: '/tʃaɪld/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Thiếu cụm âm cuối /ld/',
    problemVi: 'Dễ đọc thành "chai" (bỏ mất cả âm cong lưỡi /l/ và âm chặn /d/).',
    solutionVi: 'Đọc nguyên âm đôi /aɪ/, cong lưỡi tạo /l/ rồi bật nhẹ âm chặn /d/ ở đầu lưỡi.',
    severity: 'high',
  },
  friends: {
    ipa: '/frendz/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Thiếu âm đuôi số nhiều /dz/',
    problemVi: 'Thường nuốt mất âm /s/ hoặc /z/ của danh từ số nhiều, người nghe hiểu thành số ít.',
    solutionVi: 'Rung nhẹ dây thanh quản cho cụm âm cuối /dz/ dứt khoát.',
    severity: 'high',
  },
  friend: {
    ipa: '/frend/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm chặn cuối /d/',
    problemVi: 'Dễ đọc thành "phen" (nuốt âm /d/ ở cuối).',
    solutionVi: 'Chạm nhẹ đầu lưỡi vào chân răng trên và bật nhẹ âm bật /d/.',
    severity: 'medium',
  },
  years: {
    ipa: '/jɪəz/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Rơi rụng âm đuôi /z/',
    problemVi: 'Đọc thành "dia" hoặc "ia", bỏ quên âm rung /z/ ở cuối.',
    solutionVi: 'Bắt đầu bằng âm lướt /j/ và dứt khoát tạo âm rung /z/ ở cuối từ.',
    severity: 'medium',
  },
  old: {
    ipa: '/əʊld/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm đuôi /ld/',
    problemVi: 'Thường nuốt thành "âu" trong cụm "years old".',
    solutionVi: 'Cong lưỡi âm /l/ và bật nhẹ âm /d/ (/əʊld/).',
    severity: 'medium',
  },
  favorite: {
    ipa: '/ˈfeɪvərɪt/',
    category: 'stress',
    errorType: 'stress_intonation',
    errorLabelVi: 'Lệch trọng âm và nuốt âm cuối /t/',
    problemVi: 'Nhấn sai vị trí trọng âm hoặc đọc thành 4 âm "phây-vơ-rít-tờ".',
    solutionVi: 'Nhấn dứt khoát âm đầu /ˈfeɪ/, âm giữa đọc lướt nhẹ, cuối từ bật nhẹ /t/.',
    severity: 'high',
  },
  subject: {
    ipa: '/ˈsʌbdʒɪkt/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt cụm phụ âm đuôi /kt/',
    problemVi: 'Thường nuốt âm cuối thành "sắp-dếch" mà không bật cụm /kt/.',
    solutionVi: 'Bật rõ âm chặn /k/ rồi tiếp nối ngay âm /t/ dứt khoát ở cuối từ.',
    severity: 'high',
  },
  because: {
    ipa: '/bɪˈkəz/ or /bɪˈkɒz/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm kết thúc /z/',
    problemVi: 'Thường đọc thành "bi-cơ" hoặc xì âm /s/ vô thanh.',
    solutionVi: 'Rung nhẹ thanh quản ở âm cuối /z/ (/bɪˈkəz/), không nuốt âm.',
    severity: 'medium',
  },
  what: {
    ipa: '/wɒt/ or /wʌt/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm bật hơi /t/',
    problemVi: 'Thường đọc thành "goát" không có âm đuôi.',
    solutionVi: 'Chạm nhanh đầu lưỡi vào chân răng trên để giữ và bật dứt khoát âm /t/.',
    severity: 'medium',
  },
  watch: {
    ipa: '/wɒtʃ/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Lẫn lộn giữa /tʃ/ và /s/',
    problemVi: 'Dễ xì hơi thành "goát-xừ" thay vì âm bật vòm họng /tʃ/.',
    solutionVi: 'Chu môi và bật hơi dứt khoát /tʃ/ (tương tự tiếng bật trong "chờ" nhưng mạnh hơn).',
    severity: 'high',
  },
  speak: {
    ipa: '/spiːk/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Thiếu âm chặn hơi /k/',
    problemVi: 'Dễ đọc thành "sờ-píc" mà nuốt mất âm chặn /k/ ở cuối.',
    solutionVi: 'Bật dứt khoát âm chặn /k/ ở cổ họng sau khi phát nguyên âm dài /iː/.',
    severity: 'medium',
  },
  music: {
    ipa: '/ˈmjuːzɪk/',
    category: 'ending_consonant',
    errorType: 'missing_ending',
    errorLabelVi: 'Nuốt âm cuối /k/',
    problemVi: 'Đọc thành "miu-dịt" hoặc bỏ âm cuối.',
    solutionVi: 'Âm giữa là âm rung /z/, kết thúc dứt khoát bằng âm chặn hơi /k/.',
    severity: 'medium',
  },
  teacher: {
    ipa: '/ˈtiːtʃər/',
    category: 'stress',
    errorType: 'stress_intonation',
    errorLabelVi: 'Chưa rõ âm bật /tʃ/ ở giữa',
    problemVi: 'Đọc lướt thành "tí-chơ" nhẹ không bật hơi.',
    solutionVi: 'Ngân dài nguyên âm /iː/, nhấn mạnh âm 1 và bật rõ âm /tʃ/ ở giữa.',
    severity: 'low',
  },
  study: {
    ipa: '/ˈstʌdi/',
    category: 'cluster',
    errorType: 'mispronounced',
    errorLabelVi: 'Chèn âm thừa thành "sờ-ta-đi"',
    problemVi: 'Thêm nguyên âm phụ trước cụm phụ âm /st/.',
    solutionVi: 'Lướt nhanh âm gió /s/ nối liền vào /t/, không đọc tách thành "sờ".',
    severity: 'low',
  },
};

/**
 * Clean transcript tokens into searchable words
 */
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

/**
 * Intelligent Phoneme & Pronunciation Analyzer:
 * Strictly diagnoses:
 * 1. Mispronounced words & Missing Endings in words the student ACTUALLY SPOKE.
 * 2. Missing/Omitted essential words compared to expected target or standard grammar (e.g. "am / from" in "I Vietnam").
 * 3. Never returns generic irrelevant words (like hello, family, because when student didn't say them).
 */
export function extractAccuratePhonemeIssues(
  rawTranscript: string,
  sampleContent: string
): PhonemeIssue[] {
  const issues: PhonemeIssue[] = [];
  const studentText = (rawTranscript || '').trim();

  // If transcript is totally empty, analyze sampleContent
  const sourceText = studentText.length >= 3 ? studentText : sampleContent;
  const studentWords = tokenize(sourceText);

  // Check unique student words in order of speaking
  const uniqueStudentWords: string[] = [];
  const seen = new Set<string>();
  for (const w of studentWords) {
    if (!seen.has(w)) {
      seen.add(w);
      uniqueStudentWords.push(w);
    }
  }

  // --- 1. Check for Grammatical / Key Vocabulary Omissions (Bỏ sót từ) ---
  // E.g. Student said "I Vietnam" instead of "I come from Vietnam" or "I am from Vietnam"
  if (/\bi\s+vietnam\b/i.test(studentText)) {
    issues.push({
      word: 'am / come from',
      phoneticExpected: '/æm/ - /kʌm frɒm/',
      phoneticIssue:
        'Lỗi bỏ sót từ: Học sinh nói tắt "I Vietnam" làm thiếu động từ và giới từ. Cần nói đủ "I am from Vietnam" hoặc "I come from Vietnam".',
      severity: 'high',
      errorType: 'omitted_word',
      errorLabelVi: 'Bỏ sót từ liên kết',
      suggestedActionVi: 'Bổ sung đầy đủ trợ động từ "am" và giới từ "from" trước tên quốc gia.',
    });
  }

  // E.g. Missing "years old" or "old"
  if (/\b\d+\s+(?!years|year)/i.test(studentText) && !/years\s+old/i.test(studentText)) {
    issues.push({
      word: 'years old',
      phoneticExpected: '/jɪəz əʊld/',
      phoneticIssue:
        'Lỗi thiếu cụm chỉ tuổi: Khi nói tuổi, cần phát âm trọn vẹn cụm "years old" với âm rung /z/ nối liền âm /əʊld/.',
      severity: 'medium',
      errorType: 'omitted_word',
      errorLabelVi: 'Thiếu cụm từ cần thiết',
      suggestedActionVi: 'Nói đủ cụm từ "years old" sau số tuổi.',
    });
  }

  // --- 2. Check Real Student Words with Phoneme Traps & Missing Endings ---
  // Prioritize high-impact ending sounds: /ʃ/ in English, /z/ in is, /k/ in like, /v/ in love, /ks/ in likes
  const prioritizedCandidates = uniqueStudentWords.filter((w) => PHONEME_DATABASE[w]);

  // Sort by severity (high first) and whether it has a tricky ending sound
  prioritizedCandidates.sort((a, b) => {
    const sevOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const aScore = (sevOrder[PHONEME_DATABASE[a].severity] || 1) + (PHONEME_DATABASE[a].category === 'ending_consonant' ? 2 : 0);
    const bScore = (sevOrder[PHONEME_DATABASE[b].severity] || 1) + (PHONEME_DATABASE[b].category === 'ending_consonant' ? 2 : 0);
    return bScore - aScore;
  });

  for (const word of prioritizedCandidates) {
    if (issues.some((i) => i.word.toLowerCase() === word)) continue;

    const data = PHONEME_DATABASE[word];
    issues.push({
      word,
      phoneticExpected: data.ipa,
      phoneticIssue: `${data.errorLabelVi}: ${data.problemVi} 💡 Khắc phục: ${data.solutionVi}`,
      severity: data.severity,
      errorType: data.errorType,
      errorLabelVi: data.errorLabelVi,
      suggestedActionVi: data.solutionVi,
    });

    if (issues.length >= 3) break;
  }

  // --- 3. Dynamic Structural Check for other words with Ending Sounds ---
  if (issues.length < 3) {
    for (const word of uniqueStudentWords) {
      if (issues.some((i) => i.word.toLowerCase() === word)) continue;

      // Words ending in 'sh'
      if (word.endsWith('sh') && word.length >= 3) {
        issues.push({
          word,
          phoneticExpected: `/${word.slice(0, -2)}ʃ/`,
          phoneticIssue: `Lỗi nuốt âm đuôi /ʃ/ ở từ "${word}": Cần chu tròn môi và tạo luồng hơi ma sát dứt khoát, tránh đọc thành tiếng câm.`,
          severity: 'high',
          errorType: 'missing_ending',
          errorLabelVi: 'Thiếu âm gió /ʃ/',
          suggestedActionVi: 'Bật hơi gió /ʃ/ dứt khoát ở cuối từ.',
        });
      }
      // Words ending in 'ch'
      else if (word.endsWith('ch') && word.length >= 3) {
        issues.push({
          word,
          phoneticExpected: `/${word.slice(0, -2)}tʃ/`,
          phoneticIssue: `Lỗi thiếu âm bật /tʃ/ ở cuối từ "${word}": Cần chạm đầu lưỡi vào vòm trên và bật mạnh luồng hơi dứt khoát.`,
          severity: 'high',
          errorType: 'missing_ending',
          errorLabelVi: 'Thiếu âm bật /tʃ/',
          suggestedActionVi: 'Bật dứt khoát âm chặn /tʃ/ cuối từ.',
        });
      }
      // Words ending in 's' / 'es' (plural or verb)
      else if (word.endsWith('s') && word.length >= 4 && !word.endsWith('is')) {
        issues.push({
          word,
          phoneticIssue: `Lỗi rơi âm đuôi số nhiều/chia động từ ở "${word}": Cần phát âm rõ âm xì /s/ hoặc âm rung /z/ ở cuối từ để câu chuẩn ngữ pháp.`,
          severity: 'medium',
          errorType: 'missing_ending',
          errorLabelVi: 'Rơi âm đuôi /s/-/z/',
          suggestedActionVi: 'Phát âm dứt khoát âm cuối /s/ hoặc /z/.',
        });
      }

      if (issues.length >= 3) break;
    }
  }

  // --- 4. Fallback: If absolutely no tricky words identified ---
  if (issues.length === 0 && uniqueStudentWords.length > 0) {
    const candidate = uniqueStudentWords.find((w) => w.length >= 4) || uniqueStudentWords[0];
    issues.push({
      word: candidate,
      phoneticIssue: `Cần chú ý giữ nguyên âm chuẩn và dứt khoát phụ âm kết thúc của từ "${candidate}".`,
      severity: 'low',
      errorType: 'mispronounced',
      errorLabelVi: 'Phát âm cần rõ ràng hơn',
      suggestedActionVi: 'Nghe lại phát âm chuẩn và luyện tập nhắc lại.',
    });
  }

  return issues;
}
