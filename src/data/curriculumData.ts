import { FeedbackEntry, PracticePrompt, SchoolLevel, TaskTypeOption } from '../types';

export const TASK_TYPES: TaskTypeOption[] = [
  // ==========================================
  // CẤP 1 - TIỂU HỌC (PRIMARY SCHOOL) - MÀU XANH DƯƠNG (BLUE)
  // ==========================================
  {
    id: 'read_words',
    en: 'Read words and short sentences',
    vi: 'Đọc từ và câu ngắn',
    level: 'primary',
    levelLabel: 'Cấp 1 - Tiểu học',
    colorClass: 'text-blue-600',
    hoverBgClass: 'hover:bg-blue-50/80',
    selectedBgClass: 'bg-blue-50 text-blue-700 font-bold',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    colorHex: '#2563eb',
  },
  {
    id: 'listen_repeat',
    en: 'Listen and repeat',
    vi: 'Nghe và nhắc lại',
    level: 'primary',
    levelLabel: 'Cấp 1 - Tiểu học',
    colorClass: 'text-blue-600',
    hoverBgClass: 'hover:bg-blue-50/80',
    selectedBgClass: 'bg-blue-50 text-blue-700 font-bold',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    colorHex: '#2563eb',
  },
  {
    id: 'answer_questions',
    en: 'Answer personal questions',
    vi: 'Trả lời câu hỏi cá nhân',
    level: 'primary',
    levelLabel: 'Cấp 1 - Tiểu học',
    colorClass: 'text-blue-600',
    hoverBgClass: 'hover:bg-blue-50/80',
    selectedBgClass: 'bg-blue-50 text-blue-700 font-bold',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    colorHex: '#2563eb',
  },
  {
    id: 'picture_description',
    en: 'Picture description',
    vi: 'Nói theo tranh',
    level: 'primary',
    levelLabel: 'Cấp 1 - Tiểu học',
    colorClass: 'text-blue-600',
    hoverBgClass: 'hover:bg-blue-50/80',
    selectedBgClass: 'bg-blue-50 text-blue-700 font-bold',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    colorHex: '#2563eb',
  },
  {
    id: 'introduce_yourself',
    en: 'Introduce yourself',
    vi: 'Giới thiệu bản thân',
    level: 'primary',
    levelLabel: 'Cấp 1 - Tiểu học',
    colorClass: 'text-blue-600',
    hoverBgClass: 'hover:bg-blue-50/80',
    selectedBgClass: 'bg-blue-50 text-blue-700 font-bold',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    colorHex: '#2563eb',
  },
  {
    id: 'describe',
    en: 'Describe',
    vi: 'Mô tả',
    level: 'primary',
    levelLabel: 'Cấp 1 - Tiểu học',
    colorClass: 'text-blue-600',
    hoverBgClass: 'hover:bg-blue-50/80',
    selectedBgClass: 'bg-blue-50 text-blue-700 font-bold',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    colorHex: '#2563eb',
  },
  {
    id: 'role_play',
    en: 'Role-play short conversations',
    vi: 'Đóng vai hội thoại ngắn',
    level: 'primary',
    levelLabel: 'Cấp 1 - Tiểu học',
    colorClass: 'text-blue-600',
    hoverBgClass: 'hover:bg-blue-50/80',
    selectedBgClass: 'bg-blue-50 text-blue-700 font-bold',
    borderColor: 'border-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    colorHex: '#2563eb',
  },

  // ==========================================
  // CẤP 2 - THCS (SECONDARY SCHOOL) - MÀU XANH LÁ (GREEN)
  // ==========================================
  {
    id: 'm_storytelling',
    en: 'Storytelling',
    vi: 'Kể chuyện',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },
  {
    id: 'm_picture_description',
    en: 'Picture Description',
    vi: 'Miêu tả tranh',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },
  {
    id: 'm_read_aloud',
    en: 'Read Aloud',
    vi: 'Đọc to',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },
  {
    id: 'm_topic_speaking',
    en: 'Topic Speaking',
    vi: 'Nói theo chủ đề',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },
  {
    id: 'm_qa',
    en: 'Q&A',
    vi: 'Hỏi đáp',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },
  {
    id: 'm_recount',
    en: 'Recount an event',
    vi: 'Kể lại sự việc',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },
  {
    id: 'm_open_questions',
    en: 'Answer open-ended questions',
    vi: 'Trả lời câu hỏi mở',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },
  {
    id: 'm_mindmap',
    en: 'Speak from a mind map or keywords',
    vi: 'Nói theo sơ đồ hoặc từ khóa',
    level: 'middle',
    levelLabel: 'Cấp 2 - THCS',
    colorClass: 'text-emerald-600',
    hoverBgClass: 'hover:bg-emerald-50/80',
    selectedBgClass: 'bg-emerald-50 text-emerald-700 font-bold',
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    colorHex: '#059669',
  },

  // ==========================================
  // CẤP 3 - THPT (HIGH SCHOOL) - MÀU TÍM (PURPLE)
  // ==========================================
  {
    id: 'h_presentation',
    en: 'Presentation',
    vi: 'Thuyết trình',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_debate',
    en: 'Debate',
    vi: 'Tranh biện',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_opinion',
    en: 'Opinion',
    vi: 'Nêu ý kiến',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_storytelling',
    en: 'Storytelling',
    vi: 'Kể chuyện',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_compare_choose',
    en: 'Compare and choose',
    vi: 'So sánh và lựa chọn',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_analyze_issue',
    en: 'Analyze an issue',
    vi: 'Phân tích vấn đề',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_propose_solution',
    en: 'Propose a solution',
    vi: 'Đề xuất giải pháp',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_interview',
    en: 'Interview',
    vi: 'Phỏng vấn',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_real_life',
    en: 'Speak based on real-life situations',
    vi: 'Nói theo tình huống thực tế',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
  {
    id: 'h_learning_project',
    en: 'Present a learning project',
    vi: 'Trình bày dự án học tập',
    level: 'high',
    levelLabel: 'Cấp 3 - THPT',
    colorClass: 'text-purple-600',
    hoverBgClass: 'hover:bg-purple-50/80',
    selectedBgClass: 'bg-purple-50 text-purple-700 font-bold',
    borderColor: 'border-purple-500',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    colorHex: '#9333ea',
  },
];

export const FEEDBACK_DICT: Record<string, { high: FeedbackEntry[]; mid: FeedbackEntry[]; low: FeedbackEntry[] }> = {
  pronunciation: {
    high: [
      { e: "Excellent pronunciation. Very clear and natural.", v: "Phát âm xuất sắc. Rất rõ ràng và tự nhiên." },
      { e: "Native-like pronunciation with clear articulation.", v: "Phát âm giống người bản xứ, nhả chữ rất rõ." },
      { e: "Outstanding clarity. All sounds are pronounced correctly.", v: "Độ rõ ràng nổi bật. Mọi âm đều được phát âm đúng." }
    ],
    mid: [
      { e: "Good pronunciation, but some ending sounds are missing.", v: "Phát âm tốt, nhưng thỉnh thoảng thiếu âm cuối." },
      { e: "Clear enough to understand, minor mother-tongue influence.", v: "Đủ rõ để hiểu, chịu ảnh hưởng một chút từ tiếng mẹ đẻ." },
      { e: "Generally accurate. Watch out for tricky vowel sounds.", v: "Nhìn chung chính xác. Chú ý các nguyên âm khó." }
    ],
    low: [
      { e: "Pronunciation needs work. Focus on phonetics.", v: "Phát âm cần cải thiện. Hãy tập trung vào ngữ âm." },
      { e: "Heavy accent makes some words difficult to catch.", v: "Giọng địa phương nặng khiến một số từ khó nghe." },
      { e: "Frequent mispronunciations affecting clarity.", v: "Thường xuyên phát âm sai làm giảm độ rõ ràng." }
    ]
  },
  fluency: {
    high: [
      { e: "Very fluent and smooth speaking pace.", v: "Tốc độ nói rất trôi chảy và mượt mà." },
      { e: "Excellent flow with no hesitation.", v: "Mạch nói xuất sắc, không hề ngập ngừng." },
      { e: "Consistent pace, sounds very confident.", v: "Tốc độ ổn định, nghe rất tự tin." }
    ],
    mid: [
      { e: "Moderate pace with occasional hesitation.", v: "Tốc độ vừa phải, thỉnh thoảng còn ngập ngừng." },
      { e: "Flow is okay, but self-corrects a few times.", v: "Mạch nói tạm ổn, nhưng đôi khi phải tự sửa lỗi." },
      { e: "Speaks well, but slightly slow at times.", v: "Nói tốt, nhưng đôi lúc tốc độ hơi chậm." }
    ],
    low: [
      { e: "Speech is slow with many pauses.", v: "Nói chậm và ngắt quãng nhiều." },
      { e: "Choppy rhythm, struggles to find words.", v: "Nhịp điệu rời rạc, chật vật trong việc tìm từ." },
      { e: "Hesitates too often, disrupting the flow.", v: "Ngập ngừng quá thường xuyên làm đứt mạch nói." }
    ]
  },
  intonation: {
    high: [
      { e: "Excellent use of intonation and stress.", v: "Sử dụng ngữ điệu và trọng âm xuất sắc." },
      { e: "Very expressive and natural tone.", v: "Giọng điệu rất biểu cảm và tự nhiên." },
      { e: "Great rise and fall matching the context.", v: "Lên xuống giọng tuyệt vời, hợp với ngữ cảnh." }
    ],
    mid: [
      { e: "Acceptable intonation, slightly flat in longer sentences.", v: "Ngữ điệu chấp nhận được, hơi đều ở những câu dài." },
      { e: "Good effort, but stress on some words is misplaced.", v: "Nỗ lực tốt, nhưng nhấn âm một số từ bị sai." },
      { e: "Needs more variation in tone to sound engaging.", v: "Cần thay đổi tông giọng nhiều hơn để cuốn hút." }
    ],
    low: [
      { e: "Speech sounds monotone and flat.", v: "Giọng nói đều đều và thiếu cảm xúc." },
      { e: "Incorrect word stress changes the meaning.", v: "Nhấn âm sai làm thay đổi ý nghĩa của từ." },
      { e: "Robot-like intonation. Needs practice on tones.", v: "Ngữ điệu như đọc vẹt. Cần luyện tập lên xuống giọng." }
    ]
  },
  vocabulary: {
    high: [
      { e: "Wide range of vocabulary used accurately and naturally.", v: "Vốn từ vựng rộng, sử dụng chính xác và tự nhiên." },
      { e: "Impressive lexical resource and precise word choice.", v: "Vốn từ ấn tượng và chọn lọc từ ngữ chính xác." },
      { e: "Uses advanced words and collocations perfectly.", v: "Sử dụng từ vựng nâng cao và cụm từ hoàn hảo." }
    ],
    mid: [
      { e: "Adequate vocabulary to convey meaning, but lacks variety.", v: "Đủ từ vựng để truyền đạt ý nghĩa, nhưng thiếu sự đa dạng." },
      { e: "Good basic vocabulary. Try to use more descriptive words.", v: "Từ vựng cơ bản tốt. Hãy thử dùng thêm từ miêu tả." },
      { e: "Uses safe words. Occasional inappropriate word choice.", v: "Dùng từ an toàn. Thỉnh thoảng chọn từ chưa phù hợp." }
    ],
    low: [
      { e: "Vocabulary is limited and repetitive.", v: "Từ vựng hạn chế và bị lặp lại nhiều." },
      { e: "Struggles to find the right words to express ideas.", v: "Chật vật tìm từ vựng đúng để diễn đạt ý." },
      { e: "Frequent incorrect word usage causes confusion.", v: "Thường xuyên dùng sai từ gây khó hiểu." }
    ]
  },
  grammar: {
    high: [
      { e: "Excellent grammar control with complex structures.", v: "Kiểm soát ngữ pháp xuất sắc với các cấu trúc phức tạp." },
      { e: "Almost error-free with great sentence variety.", v: "Hầu như không có lỗi, cấu trúc câu rất đa dạng." },
      { e: "Perfect subject-verb agreement and tense usage.", v: "Chia thì và hòa hợp chủ-vị hoàn hảo." }
    ],
    mid: [
      { e: "Good control for basic sentences. Watch out for tenses.", v: "Kiểm soát tốt câu cơ bản. Chú ý các thì." },
      { e: "Some minor grammatical errors that don't block meaning.", v: "Vài lỗi ngữ pháp nhỏ không làm mất nghĩa." },
      { e: "Needs to practice more complex sentence structures.", v: "Cần rèn luyện thêm cấu trúc câu phức tạp hơn." }
    ],
    low: [
      { e: "Frequent grammatical errors hinder communication.", v: "Lỗi ngữ pháp thường xuyên cản trở giao tiếp." },
      { e: "Struggles with basic sentence construction.", v: "Chật vật trong việc xây dựng câu cơ bản." },
      { e: "Incorrect verb tenses used throughout.", v: "Sử dụng sai thì của động từ xuyên suốt bài." }
    ]
  },
  task: {
    high: [
      { e: "Fully addressed all parts of the prompt with great detail.", v: "Giải quyết đầy đủ tất cả phần của đề bài rất chi tiết." },
      { e: "Comprehensive and highly relevant answer.", v: "Câu trả lời toàn diện và cực kỳ bám sát đề." },
      { e: "Excellent expansion of ideas and clear examples.", v: "Mở rộng ý tưởng xuất sắc và có ví dụ rõ ràng." }
    ],
    mid: [
      { e: "Addressed the main points clearly but lacked some elaboration.", v: "Trình bày rõ ý chính nhưng thiếu sự diễn giải chi tiết." },
      { e: "Mostly on topic, but missed one small requirement.", v: "Đa phần đúng chủ đề, nhưng sót một yêu cầu nhỏ." },
      { e: "Good effort, but could be more specific.", v: "Nỗ lực tốt, nhưng có thể trình bày cụ thể hơn." }
    ],
    low: [
      { e: "Did not fully answer the prompt. Off-topic elements.", v: "Chưa trả lời trọn vẹn đề bài. Có phần lạc đề." },
      { e: "Answer is too short to fully assess the task.", v: "Câu trả lời quá ngắn để đánh giá toàn diện." },
      { e: "Missed the core message of the requirement.", v: "Hiểu sai thông điệp cốt lõi của yêu cầu." }
    ]
  },
  presentation: {
    high: [
      { e: "Confident demeanor and highly engaging interaction.", v: "Phong thái tự tin và tương tác cực kỳ cuốn hút." },
      { e: "Great eye contact and natural body language.", v: "Giao tiếp bằng mắt tuyệt vời, ngôn ngữ cơ thể tự nhiên." },
      { e: "Captivating presentation style.", v: "Phong cách thuyết trình rất thu hút." }
    ],
    mid: [
      { e: "Good eye contact, but looks a bit nervous.", v: "Giao tiếp bằng mắt tốt, nhưng trông hơi căng thẳng." },
      { e: "Body language is slightly stiff, try to relax.", v: "Ngôn ngữ cơ thể hơi cứng, hãy cố gắng thư giãn." },
      { e: "Reads from notes occasionally, losing connection.", v: "Thỉnh thoảng nhìn tài liệu, làm giảm sự kết nối." }
    ],
    low: [
      { e: "Lacks eye contact. Seems to be reading a script.", v: "Thiếu giao tiếp bằng mắt. Có vẻ như đang đọc kịch bản." },
      { e: "Very stiff posture, looks uncomfortable.", v: "Tư thế quá cứng nhắc, trông không thoải mái." },
      { e: "Needs to project voice and look at the camera.", v: "Cần nói to rõ hơn và nhìn vào ống kính camera." }
    ]
  }
};

export function getDynamicFeedback(score: number, category: string): FeedbackEntry {
  const tier = score >= 8.5 ? 'high' : score >= 6.5 ? 'mid' : 'low';
  const pool = FEEDBACK_DICT[category]?.[tier] || FEEDBACK_DICT.pronunciation.mid;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export const TASK_PROMPTS: Record<string, PracticePrompt> = {
  // --- CẤP 1 (Tiểu học) ---
  read_words: {
    id: 'p_rw',
    title: 'Đọc từ vựng và câu ngắn - Chủ đề Family & School',
    instructionVi: 'Đọc to, phát âm rõ ràng từng từ và câu bên dưới.',
    instructionEn: 'Read aloud clearly with proper pronunciation and ending sounds.',
    sampleContent: 'Father, mother, sister, brother. I love my family very much. This is my school bag. It is blue and yellow.',
    suggestedVocabulary: ['father', 'mother', 'sister', 'brother', 'school bag']
  },
  listen_repeat: {
    id: 'p_lr',
    title: 'Nghe và nhắc lại - Tiếng Anh Tiểu học',
    instructionVi: 'Nghe câu mẫu rồi nhắc lại với ngữ điệu chuẩn xác.',
    instructionEn: 'Listen to the audio and repeat with accurate stress and intonation.',
    sampleContent: 'Hello! How are you today? I am fine, thank you. What is your favorite color? I like green.',
  },
  answer_questions: {
    id: 'p_aq',
    title: 'Trả lời câu hỏi cá nhân',
    instructionVi: 'Trả lời 3 câu hỏi sau bằng câu hoàn chỉnh.',
    instructionEn: 'Answer the following questions in complete sentences.',
    sampleContent: '1. What is your name? \n2. How old are you? \n3. What subjects do you like at school?',
    sampleQuestions: ['What is your name?', 'How old are you?', 'What subjects do you like at school?']
  },
  picture_description: {
    id: 'p_pd',
    title: 'Nói theo tranh - Classroom Activities',
    instructionVi: 'Quan sát bức tranh lớp học và miêu tả 3-4 câu về những gì bạn thấy.',
    instructionEn: 'Look at the classroom scene and describe what people are doing in 3-4 sentences.',
    sampleContent: 'In the classroom, the teacher is standing near the board. A boy is reading a book, and two girls are drawing pictures.',
  },
  introduce_yourself: {
    id: 'p_iy',
    title: 'Giới thiệu bản thân - Self Introduction',
    instructionVi: 'Giới thiệu họ tên, tuổi, lớp học, sở thích và gia đình của bạn.',
    instructionEn: 'Introduce your name, age, grade/class, favorite hobby, and family members.',
    sampleContent: 'My name is Quynh Giao. I am in class 4/1. I enjoy reading English comic books and playing badminton with my friends.',
  },
  describe: {
    id: 'p_des',
    title: 'Miêu tả con vật nuôi yêu thích - My Favorite Pet',
    instructionVi: 'Miêu tả con vật cưng của bạn (tên, màu lông, sở thích ăn uống).',
    instructionEn: 'Describe your favorite pet: its name, appearance, and what it likes to eat.',
    sampleContent: 'I have a little cat named Mimi. She has white fur and big round eyes. She loves drinking milk and sleeping in the sun.',
  },
  role_play: {
    id: 'p_rp',
    title: 'Đóng vai hội thoại chào hỏi và hỏi giờ',
    instructionVi: 'Đóng cả hai vai Tom và Mary để thực hành đoạn hội thoại ngắn.',
    instructionEn: 'Role-play the short conversation between Tom and Mary.',
    sampleContent: 'Tom: Good morning, Mary! What time is it now? \nMary: Good morning! It is eight o\'clock. Let\'s go to class!',
  },

  // --- CẤP 2 (THCS) ---
  m_storytelling: {
    id: 'm_st',
    title: 'Kể chuyện - Storytelling (The Clever Fox)',
    instructionVi: 'Kể lại một câu chuyện ngụ ngôn hoặc mẩu chuyện ngắn có mở đầu, diễn biến và kết thúc.',
    instructionEn: 'Tell a short story or fable with a clear beginning, middle, and end.',
    sampleContent: 'Once upon a time, a clever fox saw a crow with a piece of cheese. The fox flattered the crow\'s singing, and when the crow opened its beak, the cheese fell down.',
    suggestedVocabulary: ['once upon a time', 'clever fox', 'flattered', 'moral lesson']
  },
  m_picture_description: {
    id: 'm_pd',
    title: 'Miêu tả tranh - Traditional Festival',
    instructionVi: 'Miêu tả không khí lễ hội truyền thống, trang phục và hoạt động của mọi người trong tranh.',
    instructionEn: 'Describe the traditional festival, people\'s costumes, and activities in the picture.',
    sampleContent: 'In this picture, people are gathered in the village square to celebrate the Mid-Autumn Festival. Children are holding colorful star lanterns and smiling happily.',
    suggestedVocabulary: ['village square', 'celebrate', 'star lanterns', 'festival atmosphere']
  },
  m_read_aloud: {
    id: 'm_ra',
    title: 'Đọc to - Read Aloud (Community Helpers)',
    instructionVi: 'Đọc to đoạn văn với nhịp điệu tự nhiên, chú ý ngắt nghỉ đúng chỗ và nối âm.',
    instructionEn: 'Read the paragraph aloud with clear rhythm, natural pauses, and linked sounds.',
    sampleContent: 'Community volunteers work tirelessly to keep our city clean and green. They plant trees, collect recyclable plastic, and help elderly neighbors with daily tasks.',
    suggestedVocabulary: ['volunteers', 'tirelessly', 'recyclable plastic', 'daily tasks']
  },
  m_topic_speaking: {
    id: 'm_ts',
    title: 'Nói theo chủ đề - Topic Speaking (Healthy Lifestyle)',
    instructionVi: 'Nói về chủ đề lối sống lành mạnh của học sinh (ăn uống, thể thao, ngủ đủ giấc).',
    instructionEn: 'Talk about healthy lifestyle habits for teenagers (nutrition, exercise, sleep).',
    sampleContent: 'Maintaining a healthy lifestyle is very important for students. We should eat more vegetables, drink plenty of water, and exercise for at least thirty minutes each day.',
    suggestedVocabulary: ['healthy lifestyle', 'balanced diet', 'exercise', 'physical mental health']
  },
  m_qa: {
    id: 'm_qa',
    title: 'Hỏi đáp - Q&A (School Life & Interests)',
    instructionVi: 'Lắng nghe các câu hỏi và trả lời tự tin, mạch lạc với đầy đủ thông tin.',
    instructionEn: 'Listen to the questions and answer with complete, informative sentences.',
    sampleContent: '1. What is your favorite school subject and why? \n2. What extracurricular activities do you take part in? \n3. How do you prepare for English speaking tests?',
    sampleQuestions: ['What is your favorite subject?', 'What activities do you take part in?']
  },
  m_recount: {
    id: 'm_rec',
    title: 'Kể lại sự việc - Recount an Event (A Memorable Field Trip)',
    instructionVi: 'Kể lại một chuyến đi dã ngoại hoặc sự kiện đáng nhớ theo trình tự thời gian.',
    instructionEn: 'Recount a memorable field trip or school event in chronological order.',
    sampleContent: 'Last month, our class went on a field trip to the National History Museum. First, our guide showed us ancient artifacts. After that, we took part in a fun historical quiz.',
    suggestedVocabulary: ['field trip', 'first, after that, finally', 'artifacts', 'memorable experience']
  },
  m_open_questions: {
    id: 'm_oq',
    title: 'Trả lời câu hỏi mở - Answer Open-ended Questions (Future Technology)',
    instructionVi: 'Bày tỏ quan điểm và giải thích lý do cho các câu hỏi mở mang tính tư duy.',
    instructionEn: 'Express your thoughts and provide reasons for open-ended questions.',
    sampleContent: 'How will artificial intelligence change the way we learn languages in the next decade? Explain your ideas with two specific examples.',
    suggestedVocabulary: ['in my opinion', 'furthermore', 'interactive tools', 'future of learning']
  },
  m_mindmap: {
    id: 'm_mm',
    title: 'Nói theo sơ đồ hoặc từ khóa - Speak from a Mind Map (Protecting Environment)',
    instructionVi: 'Dựa vào sơ đồ từ khóa để phát triển bài nói mạch lạc về bảo vệ môi trường.',
    instructionEn: 'Use the mind map keywords to deliver a coherent talk on environmental protection.',
    sampleContent: 'Keywords: [Reduce Waste] -> [Save Energy] -> [Plant Trees] -> [Eco-friendly Transport]. \nLet us protect our planet by taking small daily actions together.',
    suggestedVocabulary: ['reduce, reuse, recycle', 'carbon footprint', 'eco-friendly', 'global responsibility']
  },

  // --- CẤP 3 (THPT) ---
  h_presentation: {
    id: 'h_pres',
    title: 'Thuyết trình - Presentation (Sustainable Energy Transition)',
    instructionVi: 'Thuyết trình một chủ đề học thuật có mở bài, thân bài lập luận và kết luận chặt chẽ.',
    instructionEn: 'Deliver a structured academic presentation with introduction, arguments, and conclusion.',
    sampleContent: 'Ladies and gentlemen, today I want to discuss the transition toward renewable energy. Transitioning to wind and solar power is not merely an option; it is an urgent imperative for our planet\'s survival.',
    suggestedVocabulary: ['sustainable transition', 'renewable energy', 'imperative', 'carbon neutrality']
  },
  h_debate: {
    id: 'h_deb',
    title: 'Tranh biện - Debate (AI in Modern Education)',
    instructionVi: 'Đưa ra luận điểm, luận cứ và phản biện quan điểm đối lập trong tranh biện.',
    instructionEn: 'Present clear premises, evidence, and counter-arguments in a formal debate.',
    sampleContent: 'While opponents argue that AI may erode critical thinking skills, I contend that AI acts as an empowering equalizer that personalizes learning pace and fosters deeper inquiry.',
    suggestedVocabulary: ['I contend that', 'counter-argument', 'empirical evidence', 'critical thinking']
  },
  h_opinion: {
    id: 'h_op',
    title: 'Nêu ý kiến - Opinion (The Value of Cultural Exchange)',
    instructionVi: 'Bày tỏ quan điểm cá nhân sâu sắc về giá trị của giao lưu văn hóa trong thời đại toàn cầu hóa.',
    instructionEn: 'State your personal stance with reasoned justification and societal relevance.',
    sampleContent: 'In my perspective, participating in international cultural exchanges fosters empathy, dismantles stereotypes, and equips young people to thrive in a globalized workforce.',
    suggestedVocabulary: ['in my perspective', 'fosters empathy', 'global citizenship', 'mutual respect']
  },
  h_storytelling: {
    id: 'h_st3',
    title: 'Kể chuyện - Storytelling (Overcoming Adversity)',
    instructionVi: 'Kể một câu chuyện truyền cảm hứng về nỗ lực vượt qua thử thách để đạt thành công.',
    instructionEn: 'Share an inspiring story about overcoming setbacks to achieve meaningful growth.',
    sampleContent: 'When Minh first entered the national English speaking contest, he struggled with public anxiety. Instead of giving up, he practiced daily in front of mirrors and ultimately earned the first prize.',
    suggestedVocabulary: ['adversity', 'resilience', 'perseverance', 'transformational journey']
  },
  h_compare_choose: {
    id: 'h_cc',
    title: 'So sánh và lựa chọn - Compare and Choose (Online vs Traditional Learning)',
    instructionVi: 'So sánh ưu nhược điểm của hai phương án và đưa ra lựa chọn có luận giải thuyết phục.',
    instructionEn: 'Compare two options systematically and justify your final choice.',
    sampleContent: 'Both traditional classrooms and digital e-learning platforms provide distinct advantages. While online learning offers unparalleled flexibility, in-person interaction remains irreplaceable for social skills.',
    suggestedVocabulary: ['comparatively speaking', 'on the other hand', 'weighing the pros and cons', 'irreplaceable']
  },
  h_analyze_issue: {
    id: 'h_ai',
    title: 'Phân tích vấn đề - Analyze an Issue (Mental Well-being in High School)',
    instructionVi: 'Phân tích nguyên nhân gốc rễ, hệ quả và các yếu tố ảnh hưởng của vấn đề sức khỏe tinh thần.',
    instructionEn: 'Analyze the underlying causes, impacts, and dimensions of a social issue.',
    sampleContent: 'Academic pressure combined with excessive social media consumption has contributed to rising anxiety among teenagers. To address this, schools need comprehensive mental health support systems.',
    suggestedVocabulary: ['root causes', 'consequential impact', 'holistic approach', 'well-being']
  },
  h_propose_solution: {
    id: 'h_ps',
    title: 'Đề xuất giải pháp - Propose a Solution (Reducing Single-Use Plastics)',
    instructionVi: 'Đề xuất các giải pháp khả thi, thực tế để giải quyết bài toán rác thải nhựa tại trường học.',
    instructionEn: 'Propose feasible, actionable solutions to tackle plastic waste in educational institutions.',
    sampleContent: 'To eliminate single-use plastics on campus, I propose a three-step initiative: install water refill stations, subsidize reusable lunchboxes, and incentivize student recycling champions.',
    suggestedVocabulary: ['feasible solution', 'actionable roadmap', 'incentivize', 'sustainable impact']
  },
  h_interview: {
    id: 'h_int',
    title: 'Phỏng vấn - Interview (University Admission / Youth Ambassador)',
    instructionVi: 'Trả lời phỏng vấn chuyên nghiệp với phong thái tự tin, câu trả lời có cấu trúc STAR.',
    instructionEn: 'Deliver confident, structured interview responses using the STAR method.',
    sampleContent: 'When asked about leadership experience, I highlighted my role coordinating the provincial youth climate summit, where our team engaged over five hundred student delegates.',
    suggestedVocabulary: ['situation, task, action, result', 'leadership capability', 'collaborative spirit']
  },
  h_real_life: {
    id: 'h_rl',
    title: 'Nói theo tình huống thực tế - Speak based on Real-life Situations (Resolving Conflict)',
    instructionVi: 'Xử lý tình huống giao tiếp thực tế: thương lượng, giải quyết bất đồng hoặc thuyết phục người khác.',
    instructionEn: 'Handle a realistic communicative challenge: negotiation, conflict resolution, or persuasion.',
    sampleContent: 'Suppose your study group faces a deadline conflict between science and history projects. Facilitate a diplomatic dialogue to re-allocate workload equitably.',
    suggestedVocabulary: ['diplomatic approach', 'equitable allocation', 'constructive feedback', 'win-win solution']
  },
  h_learning_project: {
    id: 'h_lp',
    title: 'Trình bày dự án học tập - Present a Learning Project (Community STEM Initiative)',
    instructionVi: 'Báo cáo tổng kết dự án học tập: mục tiêu, quá trình triển khai, kết quả đạt được và bài học.',
    instructionEn: 'Report on a learning project: objectives, methodology, key findings, and reflections.',
    sampleContent: 'Our team\'s project, "Clean Water for Rural Communities," developed low-cost sand filtration kits. Over six months, we piloted the design across three remote communes with verified success.',
    suggestedVocabulary: ['project scope', 'methodology', 'empirical outcomes', 'key takeaways']
  }
};

export const CURRICULUM_PROMPTS: Record<SchoolLevel, Record<string, PracticePrompt>> = {
  primary: TASK_PROMPTS,
  middle: TASK_PROMPTS,
  high: TASK_PROMPTS,
};

export function getCurriculumPrompt(level: SchoolLevel, taskId: string): PracticePrompt {
  if (TASK_PROMPTS[taskId]) {
    return TASK_PROMPTS[taskId];
  }
  // Fallback to default
  return TASK_PROMPTS.read_words;
}
