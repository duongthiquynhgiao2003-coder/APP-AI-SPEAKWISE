import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Volume2,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Layers,
  Award,
  HelpCircle,
  ListFilter,
  Check,
  RotateCcw,
  Mic,
  Play,
  Pause,
} from 'lucide-react';
import {
  TargetUnitItem,
  TEXTBOOK_UNITS_DATABASE,
  getUnitsByGrade,
} from '../data/textbookUnitsData';
import {
  evaluateTranscriptAgainstUnit,
  TargetKeywordEvaluation,
} from '../utils/targetVocabMatcher';
import { SchoolLevel } from '../types';

interface TargetVocabChecklistProps {
  grade: string;
  onGradeChange?: (grade: string) => void;
  schoolLevel: SchoolLevel;
  currentTranscript: string; // From live speech mic or submitted speech
  onShowToast?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onApplyWordToSpeech?: (word: string) => void;
}

export const TargetVocabChecklist: React.FC<TargetVocabChecklistProps> = ({
  grade,
  onGradeChange,
  schoolLevel,
  currentTranscript,
  onShowToast,
  onApplyWordToSpeech,
}) => {
  const gradeNum = parseInt(grade, 10) || 4;

  // Available units for this grade
  const availableUnits = useMemo(() => {
    return getUnitsByGrade(gradeNum);
  }, [gradeNum]);

  // Active selected unit
  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    const units = getUnitsByGrade(gradeNum);
    return units[0]?.id || 'g4_gs_u1';
  });

  // When grade changes, sync selected unit to first available of that grade
  useEffect(() => {
    const units = getUnitsByGrade(gradeNum);
    if (units.length > 0 && !units.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(units[0].id);
    }
  }, [gradeNum]);

  // Selected unit object
  const activeUnit = useMemo(() => {
    return (
      availableUnits.find((u) => u.id === selectedUnitId) ||
      availableUnits[0] ||
      TEXTBOOK_UNITS_DATABASE[2] // fallback to Grade 4 Unit 1
    );
  }, [availableUnits, selectedUnitId]);

  // Custom added words for teacher/student flexibility
  const [customWords, setCustomWords] = useState<
    { word: string; meaningVi: string; phonetic?: string }[]
  >([]);
  const [newWordInput, setNewWordInput] = useState('');
  const [newMeaningInput, setNewMeaningInput] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Active playing audio state (Text-to-speech)
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  // Student pronunciation recordings per target word
  const [recordingWord, setRecordingWord] = useState<string | null>(null);
  const [wordAudioMap, setWordAudioMap] = useState<Record<string, string>>({});
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  // Track words student has practiced/spoken per unit
  const [practicedWordsByUnit, setPracticedWordsByUnit] = useState<
    Record<string, Record<string, boolean>>
  >(() => {
    try {
      const saved = localStorage.getItem('edu_practiced_vocab_by_unit');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync practiced words to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'edu_practiced_vocab_by_unit',
        JSON.stringify(practicedWordsByUnit)
      );
    } catch {}
  }, [practicedWordsByUnit]);

  // Refs for media recording & audio playback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const soundDetectedRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserIntervalRef = useRef<any>(null);

  // Expanded panel state (defaults to collapsed for compact interface)
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGrammarBox, setShowGrammarBox] = useState(true);

  // Filter mode: 'all' | 'used' | 'missing'
  const [filterMode, setFilterMode] = useState<'all' | 'used' | 'missing'>('all');

  // Merged unit with custom words
  const effectiveUnit: TargetUnitItem = useMemo(() => {
    if (!activeUnit) return TEXTBOOK_UNITS_DATABASE[2];
    if (customWords.length === 0) return activeUnit;

    return {
      ...activeUnit,
      targetKeywords: [
        ...activeUnit.targetKeywords,
        ...customWords.map((cw) => ({
          word: cw.word,
          meaningVi: cw.meaningVi,
          phonetic: cw.phonetic || '',
          partOfSpeech: 'custom',
          exampleSentence: `I can use the word "${cw.word}" in my English speaking.`,
        })),
      ],
    };
  }, [activeUnit, customWords]);

  // Evaluation results: accurately merges speech recognition transcript + student practice recordings
  const checklistResult = useMemo(() => {
    const baseResult = evaluateTranscriptAgainstUnit(effectiveUnit, currentTranscript);
    const unitPracticed = practicedWordsByUnit[selectedUnitId] || {};

    let usedCount = 0;
    const mergedKeywords: TargetKeywordEvaluation[] = baseResult.keywords.map((kw) => {
      const normWord = kw.word.toLowerCase().trim();
      const isUsed = kw.isUsed || Boolean(unitPracticed[normWord]);
      if (isUsed) {
        usedCount++;
      }
      return {
        ...kw,
        isUsed,
      };
    });

    const totalWords = mergedKeywords.length;
    const usedWordsCount = usedCount;
    const wordPercentage = totalWords > 0 ? Math.round((usedWordsCount / totalWords) * 100) : 0;
    const isFullyMastered = totalWords > 0 && usedWordsCount === totalWords;

    return {
      ...baseResult,
      totalWords,
      usedWordsCount,
      wordPercentage,
      keywords: mergedKeywords,
      isFullyMastered,
    };
  }, [effectiveUnit, currentTranscript, practicedWordsByUnit, selectedUnitId]);

  // Toggle manually marking a word as practiced/unpracticed
  const handleToggleWordMastery = (word: string) => {
    const normWord = word.toLowerCase().trim();
    setPracticedWordsByUnit((prev) => {
      const currentForUnit = { ...(prev[selectedUnitId] || {}) };
      if (currentForUnit[normWord]) {
        delete currentForUnit[normWord];
        onShowToast?.(`Đã chuyển từ "${word}" sang danh sách Chưa dùng`, 'info');
      } else {
        currentForUnit[normWord] = true;
        onShowToast?.(`Đã ghi nhận luyện nói từ "${word}" vào danh sách Đã nói`, 'success');
      }
      return {
        ...prev,
        [selectedUnitId]: currentForUnit,
      };
    });
  };

  // Reset practiced words for the current active unit
  const handleResetPracticedWords = () => {
    setPracticedWordsByUnit((prev) => {
      const updated = { ...prev };
      delete updated[selectedUnitId];
      return updated;
    });
    setWordAudioMap({});
    onShowToast?.('Đã đặt lại tiến độ luyện nói của bài này', 'info');
  };

  // Text-to-Speech pronunciation for a target word
  const handlePronounceWord = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if (!window.speechSynthesis) {
      onShowToast?.('Trình duyệt không hỗ trợ phát âm (SpeechSynthesis)', 'warning');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      setSpeakingWord(word);
      utterance.onend = () => setSpeakingWord(null);
      utterance.onerror = () => setSpeakingWord(null);

      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingWord(null);
    }
  };

  const handleAddCustomWord = () => {
    const trimmedWord = newWordInput.trim().toLowerCase();
    if (!trimmedWord) return;

    if (
      effectiveUnit.targetKeywords.some(
        (k) => k.word.toLowerCase() === trimmedWord
      )
    ) {
      onShowToast?.(`Từ "${trimmedWord}" đã có trong danh sách!`, 'warning');
      return;
    }

    setCustomWords((prev) => [
      ...prev,
      {
        word: trimmedWord,
        meaningVi: newMeaningInput.trim() || 'Từ bổ sung giáo viên',
      },
    ]);
    setNewWordInput('');
    setNewMeaningInput('');
    setShowAddCustomModal(false);
    onShowToast?.(`Đã thêm từ mục tiêu: "${trimmedWord}"`, 'success');
  };

  // Stop recording and cleanup microphone streams
  const stopCurrentRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
    }
  };

  // Cleanup Web Audio API analyser
  const cleanupAudioAnalyser = () => {
    if (analyserIntervalRef.current) {
      clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  // Toggle recording for student's pronunciation of a specific target word
  const handleToggleRecordWord = async (e: React.MouseEvent, word: string) => {
    e.stopPropagation();

    // If audio is currently playing, stop it
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setPlayingWord(null);
    }

    // Case 1: Student is currently recording THIS word -> Click to STOP recording
    if (recordingWord === word) {
      stopCurrentRecording();
      return;
    }

    // Case 2: Student was recording another word -> Stop that first
    if (recordingWord) {
      stopCurrentRecording();
    }

    // Clear all previous word recordings so the old word's play button disappears immediately
    setWordAudioMap((prev) => {
      Object.values(prev).forEach((url) => {
        if (typeof url === 'string') {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
      });
      return {};
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Reset sound detection flag
      soundDetectedRef.current = false;

      // Set up real-time audio volume and frequency analyser to detect actual voice
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const sourceNode = audioCtx.createMediaStreamSource(stream);
          const analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 512;
          sourceNode.connect(analyserNode);

          const timeData = new Uint8Array(analyserNode.fftSize);
          const freqData = new Uint8Array(analyserNode.frequencyBinCount);
          let voiceHits = 0;

          analyserIntervalRef.current = setInterval(() => {
            analyserNode.getByteTimeDomainData(timeData);
            analyserNode.getByteFrequencyData(freqData);

            // Time-domain deviation from center 128 (silence is exactly 128)
            let maxDeviation = 0;
            for (let i = 0; i < timeData.length; i++) {
              const diff = Math.abs(timeData[i] - 128);
              if (diff > maxDeviation) maxDeviation = diff;
            }

            // Frequency domain energy in voice frequency range
            let freqSum = 0;
            const freqLimit = Math.min(freqData.length, 64);
            for (let i = 0; i < freqLimit; i++) {
              freqSum += freqData[i];
            }
            const avgFreq = freqSum / freqLimit;

            // Background silence typically has deviation 0-4 and avgFreq 0-5.
            // Human speech typically produces deviation >= 10 and avgFreq >= 10.
            if (maxDeviation >= 10 || avgFreq >= 10) {
              voiceHits++;
              if (voiceHits >= 2) {
                soundDetectedRef.current = true;
              }
            }
          }, 60);
        }
      } catch (err) {
        console.warn('AudioContext analyser not initialized:', err);
      }

      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        cleanupAudioAnalyser();

        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        const hadVoiceSound = soundDetectedRef.current;

        // ONLY show play button and mark as practiced if actual voice / audio was detected!
        if (hadVoiceSound && audioBlob.size > 500) {
          const audioUrl = URL.createObjectURL(audioBlob);
          setWordAudioMap({ [word]: audioUrl });

          // Register this word into practicedWords for this unit
          const normWord = word.toLowerCase().trim();
          setPracticedWordsByUnit((prev) => {
            const currentForUnit = prev[selectedUnitId] || {};
            return {
              ...prev,
              [selectedUnitId]: {
                ...currentForUnit,
                [normWord]: true,
              },
            };
          });

          onShowToast?.(`Đã ghi nhận luyện nói từ "${word}". Bấm nút Play để nghe lại!`, 'success');
        } else {
          // No sound detected -> Do not show play button
          setWordAudioMap({});
          onShowToast?.('Không phát hiện thấy âm thanh giọng đọc. Hãy nói vào micro khi ghi âm!', 'warning');
        }

        setRecordingWord(null);

        // Clean up tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setRecordingWord(word);
    } catch (err: any) {
      cleanupAudioAnalyser();
      console.error('Microphone access error:', err);
      onShowToast?.('Vui lòng cấp quyền truy cập micro để ghi âm phát âm!', 'error');
      setRecordingWord(null);
    }
  };

  // Toggle playback of student's recorded audio
  const handleTogglePlayWordAudio = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    const audioUrl = wordAudioMap[word];
    if (!audioUrl) return;

    // If currently playing this word -> Stop it
    if (playingWord === word) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      setPlayingWord(null);
      return;
    }

    // If playing another word -> Stop previous
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    setPlayingWord(word);

    audio.onended = () => {
      setPlayingWord(null);
      audioPlayerRef.current = null;
    };

    audio.onerror = () => {
      setPlayingWord(null);
      audioPlayerRef.current = null;
      onShowToast?.('Không thể phát bản ghi âm này.', 'error');
    };

    audio.play().catch((err) => {
      console.error('Playback error:', err);
      setPlayingWord(null);
    });
  };

  // Clean up on unit change or unmount
  useEffect(() => {
    return () => {
      stopCurrentRecording();
      cleanupAudioAnalyser();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [selectedUnitId]);

  // Filtered keywords based on user filter
  const displayedKeywords = useMemo(() => {
    if (filterMode === 'used') {
      return checklistResult.keywords.filter((k) => k.isUsed);
    }
    if (filterMode === 'missing') {
      return checklistResult.keywords.filter((k) => !k.isUsed);
    }
    return checklistResult.keywords;
  }, [checklistResult.keywords, filterMode]);

  return (
    <div
      id="targetVocabChecklistContainer"
      className="w-full bg-[#081124]/95 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 text-slate-100 shadow-[0_0_35px_rgba(6,182,212,0.12)] relative overflow-hidden transition-all mb-5"
    >
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />

      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                Bảng kiểm Từ vựng & Ngữ pháp mục tiêu theo Unit
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                GDPT 2018 Target Checklist
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động bắt từ qua giọng nói • Đèn xanh lá (<span className="text-emerald-400 font-bold">✓</span>) khi đã dùng thành công
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Quick collapse/expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-lg bg-[#0d1a38] hover:bg-[#132552] border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title={isExpanded ? 'Thu gọn bảng kiểm' : 'Mở rộng bảng kiểm'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Thu gọn</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Mở rộng</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3.5 space-y-4">
          {/* UNIT SELECTOR & TEXTBOOK BAR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-[#0b162e] border border-cyan-500/30 rounded-xl">
            {/* Textbook indicator & Unit selector */}
            <div className="md:col-span-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1.5 rounded-md bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold shrink-0 flex items-center gap-1">
                  📖 {activeUnit.textbook}
                </span>

                {/* Grade Dropdown: Cho phép chọn Lớp 1 đến Lớp 12 */}
                <div className="relative shrink-0">
                  <select
                    id="targetGradeSelect"
                    value={gradeNum.toString()}
                    onChange={(e) => {
                      const newG = e.target.value;
                      if (onGradeChange) {
                        onGradeChange(newG);
                      }
                      const units = getUnitsByGrade(parseInt(newG, 10));
                      if (units.length > 0) {
                        setSelectedUnitId(units[0].id);
                      }
                    }}
                    className="pl-2.5 pr-7 py-1.5 rounded-md bg-blue-950/90 hover:bg-blue-900 border border-blue-400/60 text-blue-200 text-xs font-black appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-sm transition-all"
                    title="Select grade from Grade 1 to Grade 12"
                  >
                    <optgroup label="Primary School (Grades 1-5)">
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                      <option value="5">Grade 5</option>
                    </optgroup>
                    <optgroup label="Lower Secondary (Grades 6-9)">
                      <option value="6">Grade 6</option>
                      <option value="7">Grade 7</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                    </optgroup>
                    <optgroup label="Upper Secondary (Grades 10-12)">
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </optgroup>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-blue-300">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Unit Dropdown */}
              <div className="relative flex-1">
                <select
                  id="targetUnitSelect"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full bg-[#081024] border border-cyan-500/40 text-slate-100 text-xs sm:text-sm font-bold rounded-lg px-3 py-2 appearance-none focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner pr-8"
                >
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#081024] text-slate-100 py-1">
                      Unit {u.unitNumber}: {u.unitTitleEn} ({u.unitTitleVi})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="md:col-span-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Bổ sung từ mục tiêu riêng của buổi học"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm từ</span>
              </button>

              {customWords.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomWords([]);
                    onShowToast?.('Đã đặt lại danh sách từ vựng gốc của bài', 'info');
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Xóa các từ tự thêm"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          {/* MASTERY PROGRESS BAR (Thanh tiến độ chuẩn đầu ra) */}
          <div className="p-3 bg-[#0b162d]/80 border border-cyan-500/25 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Award
                  className={`w-4 h-4 ${
                    checklistResult.isFullyMastered
                      ? 'text-amber-400 animate-bounce'
                      : checklistResult.wordPercentage >= 60
                      ? 'text-emerald-400'
                      : 'text-cyan-400'
                  }`}
                />
                <span className="font-bold text-slate-200">
                  Tiến độ vận dụng từ mục tiêu:
                </span>
                <span
                  className={`font-black px-2 py-0.5 rounded text-xs ${
                    checklistResult.wordPercentage >= 80
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : checklistResult.wordPercentage >= 50
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {checklistResult.usedWordsCount} / {checklistResult.totalWords} từ ({checklistResult.wordPercentage}%)
                </span>
              </div>

              {/* Status badge */}
              <div>
                {checklistResult.isFullyMastered ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-400/60 text-[11px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    <Check className="w-3 h-3 text-emerald-300" />
                    🌟 Hoàn thành xuất sắc 100% mục tiêu Unit!
                  </span>
                ) : checklistResult.wordPercentage >= 60 ? (
                  <span className="text-[11px] text-cyan-300 font-semibold">
                    👍 Đạt chuẩn bài học! Cố gắng thêm {checklistResult.totalWords - checklistResult.usedWordsCount} từ nữa.
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    💡 Hãy nói hoặc chèn thêm các từ màu xám vào câu nói tiếp theo
                  </span>
                )}
              </div>
            </div>

            {/* Visual Animated Bar */}
            <div className="w-full bg-[#070e1e] h-2.5 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  checklistResult.wordPercentage === 100
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                    : checklistResult.wordPercentage >= 50
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
                style={{ width: `${Math.max(4, checklistResult.wordPercentage)}%` }}
              />
            </div>
          </div>

          {/* FILTER PILLS */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 font-medium">Bộ lọc hiển thị:</span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                    : 'bg-[#0b162d] text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                Tất cả ({checklistResult.totalWords})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('used')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  filterMode === 'used'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-[#0b162d] text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                ✓ Đã nói ({checklistResult.usedWordsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('missing')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  filterMode === 'missing'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-[#0b162d] text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                ⏳ Chưa dùng ({checklistResult.totalWords - checklistResult.usedWordsCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {checklistResult.usedWordsCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetPracticedWords}
                  className="px-2 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-700/70 transition-colors cursor-pointer"
                  title="Đặt lại các từ đã luyện nói trong bài này"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              )}
              <div className="text-[11px] text-slate-400 italic">
                *Nhấp loa để nghe mẫu • Nhấp micro để ghi âm luyện đọc
              </div>
            </div>
          </div>

          {/* TARGET WORDS GRID: Dynamic Status Lighting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {displayedKeywords.map((item, idx) => {
              const isUsed = item.isUsed;
              const isPronouncing = speakingWord === item.word;
              const isRecordingThisWord = recordingWord === item.word;
              const hasRecording = Boolean(wordAudioMap[item.word]);
              const isPlayingThisWord = playingWord === item.word;

              return (
                <div
                  key={idx}
                  id={`vocabCard-${idx}-${item.word.replace(/\s+/g, '_')}`}
                  className={`p-2.5 rounded-xl border transition-all duration-300 relative group flex flex-col justify-between ${
                    isUsed
                      ? 'bg-gradient-to-br from-[#08221c] to-[#0b2b23] border-emerald-400 text-emerald-100 ring-1 ring-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : 'bg-[#0a1226]/80 border-slate-700/70 border-dashed text-slate-300 hover:border-cyan-500/50 hover:bg-[#0c1630]'
                  }`}
                >
                  {/* Top line: Word, Status & Audio button */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {/* Status indicator icon: Clickable to toggle mastery manually */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWordMastery(item.word);
                        }}
                        title={
                          isUsed
                            ? `Từ "${item.word}" đã luyện nói. Nhấp để chuyển sang Chưa dùng nếu muốn`
                            : `Nhấp để đánh dấu đã luyện nói từ "${item.word}"`
                        }
                        className="cursor-pointer focus:outline-none transition-transform hover:scale-110 shrink-0"
                      >
                        {isUsed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-slate-950 shrink-0 shadow-[0_0_8px_#10b981]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-500 border border-slate-600/60 shrink-0 text-[10px] hover:border-cyan-400 hover:text-cyan-300">
                            <Circle className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>

                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span
                            className={`font-black text-xs sm:text-sm tracking-wide ${
                              isUsed ? 'text-emerald-200 font-extrabold' : 'text-slate-200'
                            }`}
                          >
                            {item.word}
                          </span>
                          {item.partOfSpeech && (
                            <span className="text-[10px] text-slate-500 italic">
                              ({item.partOfSpeech})
                            </span>
                          )}
                        </div>

                        {item.phonetic && (
                          <span className="text-[10.5px] font-mono text-cyan-400/80 block">
                            {item.phonetic}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pronunciation Speaker button */}
                    <button
                      type="button"
                      onClick={(e) => handlePronounceWord(e, item.word)}
                      title={`Nghe phát âm từ "${item.word}"`}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                        isPronouncing
                          ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                          : 'bg-[#0d1c3a] border-cyan-500/30 text-cyan-300 hover:bg-[#142952] hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Vietnamese Meaning & Student Pronunciation Recording */}
                  <div className="pt-1.5 border-t border-slate-700/40 flex items-center justify-between gap-1 text-xs">
                    <span className="text-slate-300 font-medium truncate" title={item.meaningVi}>
                      👉 {item.meaningVi}
                    </span>

                    {/* Recording & Playback controls replacing "Gợi ý bổ sung" */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUsed && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hidden sm:inline-block">
                          Đã nói ✓
                        </span>
                      )}

                      {/* Microphone Recording Button */}
                      <button
                        type="button"
                        id={`btnRecordWord-${idx}-${item.word.replace(/\s+/g, '_')}`}
                        onClick={(e) => handleToggleRecordWord(e, item.word)}
                        title={
                          isRecordingThisWord
                            ? `Đang ghi âm từ "${item.word}" - Nhấp để dừng`
                            : `Ghi âm lại phát âm từ "${item.word}"`
                        }
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                          isRecordingThisWord
                            ? 'bg-[#b45309] hover:bg-[#92400e] border-2 border-amber-300 text-white animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                            : 'bg-slate-700/85 hover:bg-slate-600 border border-slate-500/60 text-slate-200 hover:text-white'
                        }`}
                      >
                        <Mic className={`w-3.5 h-3.5 ${isRecordingThisWord ? 'fill-white text-white' : ''}`} />
                      </button>

                      {/* Playback Button: Disappears when recording, appears when stopped */}
                      {hasRecording && !isRecordingThisWord && (
                        <button
                          type="button"
                          id={`btnPlayWord-${idx}-${item.word.replace(/\s+/g, '_')}`}
                          onClick={(e) => handleTogglePlayWordAudio(e, item.word)}
                          title={
                            isPlayingThisWord
                              ? 'Nhấp để dừng phát'
                              : `Nghe lại giọng bạn vừa đọc từ "${item.word}"`
                          }
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                            isPlayingThisWord
                              ? 'bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 text-white animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                              : 'bg-slate-600/90 hover:bg-emerald-600 border border-slate-400/60 text-slate-100 hover:text-white'
                          }`}
                        >
                          {isPlayingThisWord ? (
                            <Pause className="w-3.5 h-3.5 fill-white" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* KEY GRAMMAR PATTERNS BOX (Cấu trúc ngữ pháp trọng tâm theo Unit) */}
          <div className="p-3.5 bg-[#091329] border border-cyan-500/30 rounded-xl space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowGrammarBox(!showGrammarBox)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs sm:text-sm font-bold text-cyan-300">
                  Cấu trúc câu & Mẫu ngữ pháp bài học (Unit Sentence Patterns)
                </h4>
              </div>
              <button
                type="button"
                className="text-cyan-400 hover:text-cyan-200 text-xs flex items-center gap-1 font-medium"
              >
                {showGrammarBox ? 'Thu gọn' : 'Xem chi tiết'}
                {showGrammarBox ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {showGrammarBox && (
              <div className="space-y-2 pt-1">
                {activeUnit.keyGrammarPatterns.map((gp, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-2.5 rounded-lg bg-[#060c1c] border border-cyan-500/25 text-xs text-slate-200 space-y-1"
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="font-bold text-cyan-200 font-mono text-[12.5px]">
                        {gp.pattern}
                      </span>
                      <span className="text-[11px] text-slate-400 italic">
                        {gp.explanationVi}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11.5px] bg-[#0c1836] p-1.5 rounded border border-cyan-500/15">
                      💬 <span className="font-medium text-emerald-300">Ví dụ chuẩn:</span>{' '}
                      <span className="italic">{gp.example}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM TARGET WORD FOR TEACHER / EXAM PRACTICE */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#0b1428] border border-cyan-500/50 rounded-2xl max-w-md w-full p-5 text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Thêm Từ Vựng Mục Tiêu Riêng
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Đóng
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Giáo viên hoặc học sinh có thể thêm các từ/cụm từ trọng tâm muốn kiểm tra trong bài nói hôm nay.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Từ / Cụm từ tiếng Anh (English Word / Phrase):
                </label>
                <input
                  type="text"
                  value={newWordInput}
                  onChange={(e) => setNewWordInput(e.target.value)}
                  placeholder="ví dụ: cheerful, best friend, teamwork..."
                  className="w-full bg-[#070d1c] border border-cyan-500/40 rounded-lg px-3 py-2 text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nghĩa tiếng Việt (Vietnamese Meaning):
                </label>
                <input
                  type="text"
                  value={newMeaningInput}
                  onChange={(e) => setNewMeaningInput(e.target.value)}
                  placeholder="ví dụ: vui vẻ, bạn thân nhất..."
                  className="w-full bg-[#070d1c] border border-cyan-500/40 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleAddCustomWord}
                disabled={!newWordInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)] cursor-pointer disabled:opacity-50"
              >
                ✓ Thêm vào bảng kiểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
