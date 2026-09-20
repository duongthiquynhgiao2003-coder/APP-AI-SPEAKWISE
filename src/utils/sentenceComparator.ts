import { SentenceComparison, SchoolLevel } from '../types';

/**
 * Capitalizes first letter of sentence and ensures terminal punctuation
 */
function cleanSentence(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return '';
  const first = trimmed.charAt(0).toUpperCase();
  const rest = trimmed.slice(1);
  return /[.?!]$/.test(rest) ? first + rest : first + rest + '.';
}

/**
 * Capitalizes standalone 'i' into 'I'
 */
function capitalizeI(str: string): string {
  return str
    .replace(/\bi\b/g, 'I')
    .replace(/\bi'm\b/g, "I'm")
    .replace(/\bi've\b/g, "I've")
    .replace(/\bi'll\b/g, "I'll");
}

/**
 * Removes dangling conjunctions or prepositions at the end
 */
function removeDanglingEnd(text: string): string {
  return text
    .replace(/\s+(my|the|a|an|and|or|in|at|on|to|with|of|is|are|have|has)\s*[.]?$/i, '')
    .trim();
}

/**
 * Normalizes speech-to-text stutter repetitions and phonetic misrecognitions
 */
function cleanRawSpeechText(raw: string): string {
  let s = raw.trim();

  // Deduplicate family repetitions (e.g. "my mother my mom", "my dad my father")
  s = s.replace(/\b(?:my\s+)?mother\s+(?:my\s+)?mom\b/gi, 'my mom');
  s = s.replace(/\b(?:my\s+)?mom\s+(?:my\s+)?mother\b/gi, 'my mom');
  s = s.replace(/\b(?:my\s+)?father\s+(?:my\s+)?dad\b/gi, 'my dad');
  s = s.replace(/\b(?:my\s+)?dad\s+(?:my\s+)?father\b/gi, 'my dad');

  // Fix common Vietnamese STT phonetic misrecognitions
  s = s.replace(/\b(?:the\s+raffle|the\s+rough|the\s+rubble|the\s+rival)\s+people\b/gi, 'there are four people');
  s = s.replace(/\b(?:the\s+raffle|the\s+rough|the\s+rubble|the\s+rival)\b/gi, 'there are four');
  s = s.replace(/\b(?:there\s+a\s+four|there\s+four)\s+people\b/gi, 'there are four people');
  s = s.replace(/\b(?:there\s+a\s+five|there\s+five)\s+people\b/gi, 'there are five people');
  s = s.replace(/\b(?:there\s+a\s+three|there\s+three)\s+people\b/gi, 'there are three people');

  // Clean trailing dangling "and."
  s = s.replace(/\s+and\s*[.]?$/i, '.');

  return s;
}

interface StudentSpeechData {
  greeting?: string;
  question?: string;
  name?: string;
  age?: string;
  origin?: string;
  pets?: string;
  foodLikes: string[];
  subjectLikes: string[];
  otherLikes: string[];
  familyCount?: number;
  familyMembers: string[];
  familyJobs: Array<{ relation: string; occupation: string }>;
  otherRemarks: string[];
}

/**
 * Extracts and cleans all communicative facts from raw speech
 */
function extractSpeechData(raw: string): StudentSpeechData {
  const s = cleanRawSpeechText(raw);

  const data: StudentSpeechData = {
    foodLikes: [],
    subjectLikes: [],
    otherLikes: [],
    familyMembers: [],
    familyJobs: [],
    otherRemarks: [],
  };

  // 1. Greeting
  const gMatch = s.match(/\b(hello|hi|good\s+morning|good\s+afternoon|good\s+evening)\b/i);
  if (gMatch) {
    data.greeting = gMatch[1].charAt(0).toUpperCase() + gMatch[1].slice(1).toLowerCase();
  }

  // 2. Question (What is your name, etc.)
  const qMatch = s.match(/\b(what(?:'s|\s+is)\s+your\s+name|how\s+are\s+you|where\s+are\s+you\s+from|how\s+old\s+are\s+you)\b/i);
  if (qMatch) {
    data.question = qMatch[1].trim();
  }

  // 3. Name (My name is Lan / I'm Lan)
  const nameMatch = s.match(/(?:my\s+name\s*(?:is|'s)?|i\s*am|i'm)\s+([A-Za-z]+)/i);
  if (
    nameMatch &&
    !['vietnam', 'student', 'teacher', 'doctor', 'ten', 'nine', 'eight', 'from', 'a', 'an', 'the'].includes(
      nameMatch[1].toLowerCase()
    )
  ) {
    data.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
  }

  // 4. Age
  const ageMatch = s.match(
    /(?:i(?:'m|\s+am)?\s*)?(\d+|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen)\s*(?:years?\s*old)?\b/i
  );
  if (ageMatch) {
    const wordToNum: Record<string, string> = {
      seven: '7',
      eight: '8',
      nine: '9',
      ten: '10',
      eleven: '11',
      twelve: '12',
      thirteen: '13',
      fourteen: '14',
      fifteen: '15',
    };
    data.age = wordToNum[ageMatch[1].toLowerCase()] || ageMatch[1];
  }

  // 5. Origin / Location
  if (/\b(?:from|in)\s+vietnam\b/i.test(s) || /\bvietnam\b/i.test(s)) {
    data.origin = 'Vietnam';
  } else {
    const fromMatch = s.match(/(?:from|live\s+in)\s+([a-zA-Z\s]+?)(?=\s+(?:and|i|my|what|with|$|\.))/i);
    if (fromMatch) {
      data.origin = fromMatch[1].trim();
    }
  }

  // 6. Pets (two dogs, one cat, etc.)
  const petMatch = s.match(
    /(?:have|got)\s+((?:two|three|four|one|a|an|\d+)?\s*(?:dogs?|cats?|pets?|puppies|puppy|fish|birds?))/i
  );
  if (petMatch) {
    let petStr = petMatch[1].toLowerCase();
    petStr = petStr.replace(/\bdog\b/i, 'dogs').replace(/\bcat\b/i, 'cats');
    data.pets = petStr;
  }

  // 7. Food likes
  const commonFoods = [
    'chicken',
    'pizza',
    'apples',
    'bananas',
    'rice',
    'noodles',
    'bread',
    'ice cream',
    'beef',
    'fish',
    'seafood',
    'hamburger',
    'pasta',
  ];
  for (const food of commonFoods) {
    if (new RegExp(`\\b${food}\\b`, 'i').test(s)) {
      data.foodLikes.push(food);
    }
  }

  // 8. Subject likes
  const commonSubjects = [
    'English',
    'Math',
    'Science',
    'Art',
    'Music',
    'History',
    'Geography',
    'Vietnamese',
    'PE',
  ];
  for (const sub of commonSubjects) {
    if (new RegExp(`\\b${sub}\\b`, 'i').test(s)) {
      data.subjectLikes.push(sub);
    }
  }

  // 9. Other hobby likes (sports, games, reading)
  const commonHobbies = ['football', 'badminton', 'swimming', 'reading books', 'basketball', 'chess'];
  for (const hob of commonHobbies) {
    if (new RegExp(`\\b${hob}\\b`, 'i').test(s)) {
      data.otherLikes.push(hob);
    }
  }

  // 10. Family members
  const memberSet = new Set<string>();
  if (/\b(mom|mother)\b/i.test(s)) memberSet.add('mom');
  if (/\b(dad|father)\b/i.test(s)) memberSet.add('dad');
  if (/\bbrother\b/i.test(s)) memberSet.add('brother');
  if (/\bsister\b/i.test(s)) memberSet.add('sister');
  if (/\b(me|myself)\b/i.test(s)) memberSet.add('me');
  data.familyMembers = Array.from(memberSet);

  // Family count
  const countMatch = s.match(/(?:there\s+are|have)\s+(\w+|\d+)\s+(?:people|members)?\s*in\s+my\s+family/i);
  if (countMatch) {
    const wMap: Record<string, number> = { three: 3, four: 4, five: 5, six: 6, seven: 7 };
    data.familyCount = parseInt(countMatch[1], 10) || wMap[countMatch[1].toLowerCase()] || data.familyMembers.length;
  } else if (data.familyMembers.length > 0) {
    data.familyCount = data.familyMembers.length;
  }

  // 11. Jobs
  const jobMatches = s.matchAll(
    /\b(?:my\s+)?(mom|mother|dad|father)\s+(?:is\s+(?:a\s+|an\s+)?|works\s+as\s+(?:a\s+|an\s+)?)([a-zA-Z]+)/gi
  );
  for (const jm of jobMatches) {
    const jobTitle = jm[2].toLowerCase();
    if (
      ['teacher', 'doctor', 'nurse', 'engineer', 'worker', 'farmer', 'driver', 'police', 'officer', 'accountant', 'business'].some(
        (val) => jobTitle.includes(val)
      )
    ) {
      data.familyJobs.push({
        relation: jm[1].toLowerCase().includes('m') ? 'mother' : 'father',
        occupation: jobTitle,
      });
    }
  }

  // 12. Other comments
  if (/they\s+are\s+very\s+cute/i.test(s)) {
    data.otherRemarks.push('cute_pets');
  }

  return data;
}

/**
 * Formats a clean, grammatically punctuated list of family members (e.g. Oxford comma)
 */
function formatMemberList(members: string[], level: SchoolLevel): string {
  if (members.length === 0) return '';
  const isHigh = level === 'high';
  const isMiddle = level === 'middle';

  const formatted = members.map((m) => {
    if (m === 'me') return isHigh ? 'myself' : 'me';
    const rel = isHigh || isMiddle ? (m === 'mom' ? 'mother' : m === 'dad' ? 'father' : m) : m;
    return `my ${rel}`;
  });

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  const last = formatted[formatted.length - 1];
  return `${formatted.slice(0, -1).join(', ')}, and ${last}`;
}

function getCountWord(count: number): string {
  const map: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven' };
  return map[count] || `${count}`;
}

/**
 * Builds completely unique, non-overlapping elevations for each educational level
 */
function buildElevatedSpeech(
  data: StudentSpeechData,
  level: SchoolLevel
): { sentence: string; explanation: string } {
  const parts: string[] = [];

  // ==========================================
  // LEVEL 1: PRIMARY (TIỂU HỌC - CẤP 1)
  // Trong sáng, tự nhiên, câu ngắn gọn, ấm áp
  // ==========================================
  if (level === 'primary') {
    // 1. Greeting & Identity
    let greetingPart = data.greeting ? `${data.greeting}!` : 'Hello!';
    if (data.question) {
      greetingPart += ` ${data.question.charAt(0).toUpperCase() + data.question.slice(1)}?`;
    }

    const introClauses: string[] = [];
    if (data.name) introClauses.push(`My name is ${data.name}`);
    if (data.age) introClauses.push(`I am ${data.age} years old`);
    if (data.origin) introClauses.push(`I come from ${data.origin}`);

    if (introClauses.length === 3) {
      parts.push(`${greetingPart} ${introClauses[0]}, and ${introClauses[1]}. ${introClauses[2]}.`);
    } else if (introClauses.length === 2) {
      parts.push(`${greetingPart} ${introClauses[0]}, and ${introClauses[1]}.`);
    } else if (introClauses.length === 1) {
      parts.push(`${greetingPart} ${introClauses[0]}.`);
    } else {
      parts.push(greetingPart);
    }

    // 2. Pets & Preferences
    if (data.pets) {
      parts.push(`At home, I have ${data.pets}.`);
    }

    const likesList: string[] = [];
    if (data.foodLikes.length > 0) {
      likesList.push(`my favorite food is ${data.foodLikes.join(' and ')}`);
    }
    if (data.subjectLikes.length > 0) {
      likesList.push(`I like ${data.subjectLikes.join(' and ')} very much`);
    }
    if (data.otherLikes.length > 0) {
      likesList.push(`I love ${data.otherLikes.join(' and ')}`);
    }

    if (likesList.length > 1) {
      const first = likesList[0].charAt(0).toUpperCase() + likesList[0].slice(1);
      parts.push(`${first}, and ${likesList[1]}!`);
    } else if (likesList.length === 1) {
      const first = likesList[0].charAt(0).toUpperCase() + likesList[0].slice(1);
      parts.push(`${first}!`);
    }

    // 3. Family & Jobs
    if (data.familyMembers.length > 0 || (data.familyCount && data.familyCount > 0)) {
      const count = data.familyCount || data.familyMembers.length;
      const countWord = getCountWord(count);
      const memberStr = formatMemberList(data.familyMembers, 'primary');

      parts.push(`There are ${countWord} people in my family: ${memberStr}.`);

      if (data.familyJobs.length > 0) {
        const jobClauses = data.familyJobs.map(
          (j) => `my ${j.relation === 'mother' ? 'mom' : 'dad'} is a ${j.occupation}`
        );
        parts.push(`In my family, ${jobClauses.join(', and ')}.`);
      }
    }

    // 4. Remarks
    if (data.otherRemarks.includes('cute_pets')) {
      parts.push('They are very cute and playful!');
    }

    const finalSentence = capitalizeI(parts.join(' ').replace(/\s+/g, ' ').trim());

    // Dynamic pedagogical explanation for Primary
    const priAdded: string[] = [];
    if (data.pets) priAdded.push('cụm diễn đạt tự nhiên "At home..."');
    if (data.subjectLikes.length > 0) priAdded.push('trạng từ "very much!"');
    if (data.familyMembers.length > 0) priAdded.push('dấu hai chấm (:) và dấu phẩy khi liệt kê');
    priAdded.push('liên từ "and" nối các vế');

    const explanation = [
      '• Tách & lược bỏ: Ngắt câu riêng sau lời chào; lọc bỏ lỗi lặp từ ngữ, dính câu và lỗi nhận diện tiếng ồn.',
      `• Thêm & bổ sung: Bổ sung ${priAdded.join(', ')}.`,
      '• Chuẩn hóa: Viết hoa đại từ "I", chuẩn hóa câu đơn giản, ấm áp, đúng ngữ pháp thiếu nhi.',
    ].join('\n');

    return { sentence: finalSentence, explanation };
  }

  // ==========================================
  // LEVEL 2: MIDDLE SCHOOL (THCS - CẤP 2)
  // Câu ghép & câu phức, từ nối mượt mà, A2-B1
  // ==========================================
  if (level === 'middle') {
    // 1. Greeting & Identity (Completely different pattern from Level 1)
    let greetingPart = data.greeting ? 'Hi everyone!' : 'Hi there!';
    if (data.question) {
      greetingPart += ` Nice to meet you, ${data.question.toLowerCase()}?`;
    }

    if (data.name && data.age && data.origin) {
      parts.push(`${greetingPart} I am ${data.name}, a ${data.age}-year-old student from ${data.origin}.`);
    } else if (data.name && data.origin) {
      parts.push(`${greetingPart} I am ${data.name}, a student from ${data.origin}.`);
    } else if (data.name && data.age) {
      parts.push(`${greetingPart} I am ${data.name}, and I am currently ${data.age} years old.`);
    } else if (data.name) {
      parts.push(`${greetingPart} I am ${data.name}.`);
    } else {
      parts.push(greetingPart);
    }

    // 2. Pets & Preferences (Completely different pattern from Level 1)
    if (data.pets) {
      parts.push(`I have ${data.pets} as friendly pets.`);
    }

    if (data.foodLikes.length > 0 && data.subjectLikes.length > 0) {
      parts.push(
        `When it comes to my favorites, I really love ${data.foodLikes.join(
          ' and '
        )}, and ${data.subjectLikes.join(' and ')} is my favorite subject at school.`
      );
    } else if (data.foodLikes.length > 0) {
      parts.push(`When it comes to food, I really love enjoying ${data.foodLikes.join(' and ')}.`);
    } else if (data.subjectLikes.length > 0) {
      parts.push(`${data.subjectLikes.join(' and ')} is definitely my favorite subject at school.`);
    }

    if (data.otherLikes.length > 0) {
      parts.push(`In my free time, I also enjoy ${data.otherLikes.join(' and ')}.`);
    }

    // 3. Family & Jobs
    if (data.familyMembers.length > 0 || (data.familyCount && data.familyCount > 0)) {
      const count = data.familyCount || data.familyMembers.length;
      const countWord = getCountWord(count);
      const memberStr = formatMemberList(data.familyMembers, 'middle');

      parts.push(`My family has ${countWord} members: ${memberStr}.`);

      if (data.familyJobs.length > 0) {
        const jobClauses = data.familyJobs.map((j) => `my ${j.relation} works as a ${j.occupation}`);
        parts.push(`As for my parents, ${jobClauses.join(', while ')}.`);
      }
    }

    // 4. Remarks
    if (data.otherRemarks.includes('cute_pets')) {
      parts.push('They are truly adorable companions.');
    }

    const finalSentence = capitalizeI(parts.join(' ').replace(/\s+/g, ' ').trim());

    // Dynamic pedagogical explanation for Middle
    const midVocab: string[] = [];
    if (data.age && data.origin) midVocab.push(`cụm danh từ ("a ${data.age}-year-old student from...")`);
    if (data.subjectLikes.length > 0) midVocab.push('"favorite subject at school"');
    if (data.familyMembers.length > 0) midVocab.push('danh xưng "mother/father", từ loại "members"');
    if (data.familyJobs.length > 0) midVocab.push('cấu trúc nghề nghiệp "works as a...", liên từ "while"');
    if (midVocab.length === 0) midVocab.push('từ vựng mở rộng chuẩn A2-B1');

    const explanation = [
      '• Ghép câu & chuyển tiếp: Sử dụng cấu trúc câu ghép nối tiếp và cụm dẫn dắt mượt mà ("When it comes to...").',
      `• Nâng cấp từ vựng: Vận dụng ${midVocab.join('; ')}.`,
      '• Chuẩn hóa: Hoàn thiện nhịp điệu và dấu câu chuẩn khung năng lực A2-B1.',
    ].join('\n');

    return { sentence: finalSentence, explanation };
  }

  // ==========================================
  // LEVEL 3: HIGH SCHOOL (THPT - CẤP 3)
  // Thuyết trình, phong thái đĩnh đạc, B1-B2
  // ==========================================
  // 1. Greeting & Identity (Completely unique presentation style)
  let greetingPart = 'Good morning!';
  if (data.question) {
    greetingPart = `Good morning! It is a pleasure to meet you. May I ask, ${data.question.toLowerCase()}?`;
  }

  if (data.name && data.age && data.origin) {
    parts.push(
      `${greetingPart} Allow me to introduce myself: my name is ${data.name}, ${data.age} years of age, coming from ${data.origin}.`
    );
  } else if (data.name && data.origin) {
    parts.push(
      `${greetingPart} Allow me to introduce myself: my name is ${data.name}, originally from ${data.origin}.`
    );
  } else if (data.name) {
    parts.push(`${greetingPart} Allow me to introduce myself: my name is ${data.name}.`);
  } else {
    parts.push(greetingPart);
  }

  // 2. Pets & Preferences (Academic, sophisticated collocations)
  if (data.pets && data.foodLikes.length > 0 && data.subjectLikes.length > 0) {
    parts.push(
      `Alongside caring for ${data.pets}, ${data.foodLikes.join(
        ' and '
      )} is my top favorite dish, and I take a keen interest in ${data.subjectLikes.join(' and ')}.`
    );
  } else if (data.pets && data.foodLikes.length > 0) {
    parts.push(`Alongside caring for ${data.pets}, ${data.foodLikes.join(' and ')} is my favorite dish.`);
  } else if (data.pets && data.subjectLikes.length > 0) {
    parts.push(`Besides keeping ${data.pets}, I take a keen interest in ${data.subjectLikes.join(' and ')}.`);
  } else {
    if (data.pets) parts.push(`I am a dedicated pet lover keeping ${data.pets} at home.`);
    if (data.foodLikes.length > 0)
      parts.push(`In terms of cuisine, ${data.foodLikes.join(' and ')} remains my preferred choice.`);
    if (data.subjectLikes.length > 0)
      parts.push(`Academically, I have developed a strong passion for ${data.subjectLikes.join(' and ')}.`);
  }

  if (data.otherLikes.length > 0) {
    parts.push(`Furthermore, I frequently engage in ${data.otherLikes.join(' and ')} during my leisure hours.`);
  }

  // 3. Family & Jobs
  if (data.familyMembers.length > 0 || (data.familyCount && data.familyCount > 0)) {
    const count = data.familyCount || data.familyMembers.length;
    const countWord = getCountWord(count);
    const memberStr = formatMemberList(data.familyMembers, 'high');

    parts.push(`Regarding my family background, it consists of ${countWord} members: ${memberStr}.`);

    if (data.familyJobs.length > 0) {
      const jobClauses = data.familyJobs.map((j) => `my ${j.relation} serves as a ${j.occupation}`);
      parts.push(`In terms of professional careers, ${jobClauses.join(', whereas ')}.`);
    }
  }

  // 4. Remarks
  if (data.otherRemarks.includes('cute_pets')) {
    parts.push('which bring immense joy to my daily life.');
  }

  const finalSentence = capitalizeI(parts.join(' ').replace(/\s+/g, ' ').trim());

  // Dynamic pedagogical explanation for High
  const highColloc: string[] = [];
  if (data.subjectLikes.length > 0) highColloc.push('"take a keen interest in"');
  if (data.familyMembers.length > 0) highColloc.push('"consists of ... members", "myself"');
  if (data.familyJobs.length > 0) highColloc.push('"serves as a...", liên từ "whereas"');
  if (highColloc.length === 0) highColloc.push('collocations học thuật B1-B2');

  const explanation = [
    '• Cấu trúc câu: Dùng câu dẫn nhập thuyết trình ("Allow me to introduce myself"), phân từ hiện tại ("coming from...") và mệnh đề trạng ngữ ("Alongside...").',
    `• Nâng cấp học thuật: Vận dụng collocations cao cấp (${highColloc.join('; ')}).`,
    '• Chuẩn hóa: Phân tách rõ các luận điểm, sắc thái đĩnh đạc tự tin chuẩn B1-B2.',
  ].join('\n');

  return { sentence: finalSentence, explanation };
}

/**
 * Elevates general speech topics other than personal introductions
 * (trips, daily routines, school, sports, stories)
 * Guarantees zero overlap between Primary, Middle, and High.
 */
function elevateGeneralSpeech(
  rawText: string,
  level: SchoolLevel
): { sentence: string; explanation: string } {
  let cleaned = removeDanglingEnd(cleanRawSpeechText(rawText));

  // Fix common grammar errors
  cleaned = cleaned
    .replace(/\bi\s+from\s+([a-z]+)/gi, 'I am from $1')
    .replace(/\bi\s+vietnam\b/gi, 'I am from Vietnam')
    .replace(/\bmy\s+name\s+([a-z]+)\b/gi, 'my name is $1')
    .replace(/\bi\s+(\d+|seven|eight|nine|ten)\s+year\s+old\b/gi, 'I am $1 years old')
    .replace(/\b(\d+|two|three|four)\s+dog\b/gi, '$1 dogs')
    .replace(/\b(\d+|two|three|four)\s+cat\b/gi, '$1 cats')
    .replace(/\bmy\s+mom\s+teacher\b/gi, 'my mom is a teacher')
    .replace(/\bmy\s+dad\s+doctor\b/gi, 'my dad is a doctor')
    .replace(/\bhe\s+like\b/gi, 'he likes')
    .replace(/\bshe\s+like\b/gi, 'she likes')
    .replace(/\bi\s+no\s+like\b/gi, "I don't like");

  if (level === 'primary') {
    const formatted = cleanSentence(
      capitalizeI(
        cleaned
          .replace(/\bbecause\b/gi, 'and because')
          .replace(/\bi\s+like\b/gi, 'I really like')
      )
    );

    return {
      sentence: formatted,
      explanation: [
        '• Tách & ngắt câu: Tách các câu đơn rõ ràng, ngắt nhịp tự nhiên cho học sinh tiểu học.',
        '• Thêm & bổ sung: Thêm liên từ "and", trạng từ "really" tăng tính biểu cảm.',
        '• Chuẩn hóa: Sửa lỗi trợ động từ và viết hoa đại từ "I".',
      ].join('\n'),
    };
  }

  if (level === 'middle') {
    const startChar = cleaned.startsWith('I ') || cleaned.startsWith("I'") ? 'I' : cleaned.charAt(0).toLowerCase();
    const restStr = cleaned.slice(1);

    const formatted = cleanSentence(
      capitalizeI(
        `In addition, ${startChar + restStr}`
          .replace(/\bi\s+like\b/gi, 'I really enjoy')
          .replace(/\bvery\s+good\b/gi, 'truly wonderful')
          .replace(/\bvery\s+nice\b/gi, 'great')
      )
    );

    return {
      sentence: formatted,
      explanation: [
        '• Ghép câu: Sử dụng liên từ dẫn dắt ("In addition") để liên kết ý tưởng liền mạch.',
        '• Nâng cấp từ vựng: Thay từ đơn điệu bằng từ vựng gợi cảm xúc ("really enjoy", "truly wonderful").',
        '• Chuẩn hóa: Hoàn thiện dấu câu và cấu trúc câu ghép chuẩn A2-B1.',
      ].join('\n'),
    };
  }

  // High School
  const startChar = cleaned.startsWith('I ') || cleaned.startsWith("I'") ? 'I' : cleaned.charAt(0).toLowerCase();
  const restStr = cleaned.slice(1);

  const formatted = cleanSentence(
    capitalizeI(
      `From an analytical perspective, ${startChar + restStr}`
        .replace(/\bi\s+like\b/gi, 'I have a strong inclination toward')
        .replace(/\bgood\b/gi, 'exceptional')
        .replace(/\bhappy\b/gi, 'greatly delighted')
    )
  );

  return {
    sentence: formatted,
    explanation: [
      '• Cấu trúc câu: Chuyển sang văn phong nghị luận/thuyết trình với cụm trạng ngữ học thuật ("From an analytical perspective").',
      '• Nâng cấp từ học thuật: Thay từ thông thường bằng collocations nâng cao ("strong inclination toward", "exceptional").',
      '• Chuẩn hóa: Hoàn thiện ngữ điệu đĩnh đạc chuẩn B1-B2.',
    ].join('\n'),
  };
}

/**
 * Intelligent Native-elevation & Grammar corrector that directly takes
 * whatever the student actually said and elevates it into authentic, natural native-speaker English.
 *
 * Crucial pedagogical rules strictly enforced:
 * 1. "Cách diễn đạt chuẩn & hay hơn" MUST BE noticeably elevated, natural, and richer than student's raw words.
 * 2. It must preserve 100% of ALL details and facts the student said (name, age, country, subject, hobby, pets, family members, jobs).
 * 3. Never repeat identical sentences or templates between Primary, Middle, and High tiers.
 * 4. Filters out STT noise, stuttering, and phonetic misrecognitions.
 */
export function reconstructStudentSpeech(
  rawTranscript: string,
  level: SchoolLevel,
  sampleContent: string
): SentenceComparison[] {
  const comparisons: SentenceComparison[] = [];
  const text = (rawTranscript || '').trim();

  if (!text || text.length < 3) {
    return comparisons;
  }

  // Extract communicative data from student's speech
  const data = extractSpeechData(text);

  const hasCoreIntroductionFacts = Boolean(
    data.name ||
      data.origin ||
      data.greeting ||
      data.pets ||
      data.foodLikes.length > 0 ||
      data.subjectLikes.length > 0 ||
      data.otherLikes.length > 0 ||
      data.familyMembers.length > 0 ||
      data.familyJobs.length > 0 ||
      data.age
  );

  if (hasCoreIntroductionFacts) {
    const elevated = buildElevatedSpeech(data, level);

    comparisons.push({
      studentSentence: text,
      improvedSentence: elevated.sentence,
      explanationVi: elevated.explanation,
      focusArea: 'naturalness',
    });

    return comparisons;
  }

  // Handle single question prompt repetition e.g. "what's your name my name is Lan"
  const questionRepeatMatch = text.match(
    /^(what(?:'s|\s+is)\s+your\s+name|how\s+old\s+are\s+you|where\s+are\s+you\s+from|what\s+is\s+your\s+hobby)\s+(.*)$/i
  );
  if (questionRepeatMatch) {
    const questionPart = questionRepeatMatch[1];
    let answerPart = questionRepeatMatch[2].trim();
    answerPart = removeDanglingEnd(answerPart);

    let elevated = answerPart;
    if (level === 'primary') {
      elevated = `Hello! ${cleanSentence(answerPart.replace(/\bi'm\s+from/i, 'I come from'))}`;
    } else if (level === 'middle') {
      elevated = `Nice to meet you. ${cleanSentence(answerPart.replace(/\bi'm\s+from/i, 'I come from and live in'))}`;
    } else {
      elevated = `It is a pleasure to introduce myself. ${cleanSentence(
        answerPart.replace(/\bi'm\s+from/i, 'I was born and raised in')
      )}`;
    }

    comparisons.push({
      studentSentence: text,
      improvedSentence: elevated,
      explanationVi: [
        `• Lược bỏ lỗi lặp: Bỏ việc nhắc lại nguyên văn câu hỏi của đề bài ("${questionPart}").`,
        '• Thêm & chuẩn hóa: Thêm lời chào lịch sự và trả lời trực diện vào trọng tâm thông tin.',
      ].join('\n'),
      focusArea: 'naturalness',
    });
    return comparisons;
  }

  // Fallback for general speech topics (hobbies, descriptions, stories, routines)
  const generalElevation = elevateGeneralSpeech(text, level);
  comparisons.push({
    studentSentence: text,
    improvedSentence: generalElevation.sentence,
    explanationVi: generalElevation.explanation,
    focusArea: 'naturalness',
  });

  return comparisons;
}

