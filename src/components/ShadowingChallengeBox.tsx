import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ChevronUp,
  Award,
  Zap,
} from 'lucide-react';
import { playPedagogicalAudio, stopSpeechAudio } from '../utils/speechPlayer';
import { playCelebrationChime, playEncouragementChime } from '../utils/audioEffects';
import {
  evaluateShadowingAttempt,
  ShadowingEvaluationResult,
} from '../utils/shadowingEvaluator';

interface ShadowingChallengeBoxProps {
  targetSentence: string;
  studentOriginalSentence?: string;
  index: number;
  onClose?: () => void;
}

export const ShadowingChallengeBox: React.FC<ShadowingChallengeBoxProps> = ({
  targetSentence,
  studentOriginalSentence,
  index,
  onClose,
}) => {
  const [isPlayingModel, setIsPlayingModel] = useState<number | null>(null); // rate: 1.0 or 0.8
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveSpokenText, setLiveSpokenText] = useState('');
  const [manualText, setManualText] = useState('');
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<ShadowingEvaluationResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false);

  // Refs for recording & audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeechAudio();
      stopRecordingCleanup();
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, []);

  const stopRecordingCleanup = () => {
    clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  // Play model native audio
  const handlePlayModel = (rate: number) => {
    if (isPlayingModel === rate) {
      stopSpeechAudio();
      setIsPlayingModel(null);
      return;
    }

    stopSpeechAudio();
    setIsPlayingModel(rate);

    playPedagogicalAudio(targetSentence, {
      rate: rate,
      pitch: 1.02,
      onStart: () => setIsPlayingModel(rate),
      onEnd: () => setIsPlayingModel(null),
      onError: () => setIsPlayingModel(null),
    });
  };

  // Start Shadowing Recording
  const startRecording = async () => {
    stopSpeechAudio();
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setEvaluationResult(null);
    setLiveSpokenText('');
    setManualText('');
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      // 1. Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
      };

      mediaRecorder.start(250);

      // 3. Initialize SpeechRecognition if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript + ' ';
          }
          const cleaned = transcript.replace(/\s+/g, ' ').trim();
          setLiveSpokenText(cleaned);
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
            console.warn('SpeechRecognition error:', event.error);
          }
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {}
      }

      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access error:', err);
      // If mic is denied or not supported, allow manual typing mode
      setShowManualEdit(true);
      setIsRecording(false);
    }
  };

  // Stop Recording & Evaluate
  const stopRecordingAndEvaluate = () => {
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);

    const elapsedSeconds = Math.max(1.5, (Date.now() - startTimeRef.current) / 1000);

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Evaluate
    const studentSpeech = (liveSpokenText || manualText).trim();
    if (!studentSpeech) {
      setShowManualEdit(true);
      return;
    }

    const evalResult = evaluateShadowingAttempt(targetSentence, studentSpeech, elapsedSeconds);
    setEvaluationResult(evalResult);

    // Play chime sound effect
    if (evalResult.badge === 'excellent') {
      playCelebrationChime();
    } else {
      playEncouragementChime();
    }
  };

  // Play student's recorded audio
  const handleTogglePlayRecordedAudio = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingRecordedAudio) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      setIsPlayingRecordedAudio(false);
    } else {
      stopSpeechAudio();
      const audio = new Audio(recordedAudioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlayingRecordedAudio(false);
      audio.onerror = () => setIsPlayingRecordedAudio(false);
      audio.play().catch(() => setIsPlayingRecordedAudio(false));
      setIsPlayingRecordedAudio(true);
    }
  };

  // Handle manual submit (in case student typed or edited)
  const handleManualSubmit = () => {
    const studentSpeech = manualText.trim();
    if (!studentSpeech) return;
    const evalResult = evaluateShadowingAttempt(targetSentence, studentSpeech, 4);
    setEvaluationResult(evalResult);
    if (evalResult.badge === 'excellent') {
      playCelebrationChime();
    } else {
      playEncouragementChime();
    }
  };

  // Reset to re-try
  const handleRetry = () => {
    setEvaluationResult(null);
    setLiveSpokenText('');
    setManualText('');
    setRecordingSeconds(0);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="overflow-hidden mt-3 rounded-2xl bg-[#060c18] border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.18)]"
    >
      {/* Header bar */}
      <div className="bg-gradient-to-r from-cyan-950/90 via-[#0d213f] to-cyan-950/90 px-4 py-2.5 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h5 className="text-[12.5px] font-black text-cyan-200 uppercase tracking-wider leading-tight">
              PRACTICE & SHADOWING CHALLENGE
            </h5>
            <p className="text-[10px] text-cyan-300/70 font-normal leading-tight">
              Thử thách luyện nói lặp lại: Bắt chước & Chuẩn hóa phản xạ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-mono">
            Câu #{index + 1}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              title="Đóng thử thách"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Step 1: Target Model Sentence */}
        <div className="p-3.5 rounded-xl bg-[#0a152d] border border-cyan-500/25 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Câu mẫu chuẩn cần nói lại (Target Sentence):
            </span>

            {/* Model Audio Listen Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePlayModel(1.0)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isPlayingModel === 1.0
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse'
                    : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/40 text-cyan-300'
                }`}
                title="Nghe mẫu tốc độ tự nhiên 1.0x"
              >
                {isPlayingModel === 1.0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>Nghe chuẩn 1.0x</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayModel(0.8)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isPlayingModel === 0.8
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                    : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/40 text-amber-300'
                }`}
                title="Nghe mẫu chậm và rõ từng âm tiết 0.8x"
              >
                {isPlayingModel === 0.8 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>Nghe chậm 0.8x</span>
              </button>
            </div>
          </div>

          <p className="text-[14px] sm:text-[15px] text-white font-bold tracking-wide leading-relaxed pl-3 border-l-4 border-cyan-400 bg-[#070f20]/60 p-2.5 rounded-r-lg">
            "{targetSentence}"
          </p>
        </div>

        {/* Step 2: Interactive Practice / Recording Controls */}
        {!evaluationResult ? (
          <div className="p-4 rounded-xl bg-[#09142b] border border-cyan-500/25 flex flex-col items-center justify-center text-center space-y-3">
            {!isRecording ? (
              <>
                <div className="text-slate-300 text-xs sm:text-[13px] font-medium max-w-md">
                  Bấm nút bên dưới, nghe mẫu rồi nói lại câu trên thật tự tin. AI sẽ chấm điểm phát âm và nhịp điệu ngay lập tức!
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all cursor-pointer transform active:scale-95"
                  >
                    <Mic className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
                    <span>BẮT ĐẦU NÓI LẠI (START SHADOWING)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualEdit(!showManualEdit)}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                  >
                    {showManualEdit ? 'Ẩn ô nhập' : 'Nhập văn bản nếu mic lỗi'}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full space-y-3">
                {/* Active Recording State */}
                <div className="flex items-center justify-center gap-3">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                  </span>
                  <span className="text-rose-400 font-bold text-xs uppercase tracking-wider animate-pulse">
                    ĐANG LẮNG NGHE & GHI ÂM ({recordingSeconds}s)...
                  </span>
                </div>

                {/* Pulsing Visual Waveform */}
                <div className="flex items-center justify-center gap-1.5 h-8">
                  {[40, 75, 100, 60, 90, 45, 80, 100, 50, 70, 95, 60].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['8px', `${h}%`, '8px'] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        delay: i * 0.06,
                        ease: 'easeInOut',
                      }}
                      className="w-1 bg-cyan-400 rounded-full"
                    />
                  ))}
                </div>

                {/* Live Real-time Spoken Text Preview */}
                <div className="min-h-[48px] p-3 rounded-lg bg-[#050a14] border border-cyan-500/30 text-slate-100 text-xs sm:text-sm italic">
                  {liveSpokenText ? (
                    <span>"{liveSpokenText}"</span>
                  ) : (
                    <span className="text-slate-500 not-italic">
                      Hãy nói câu mẫu vào micro, AI đang nhận diện từng từ...
                    </span>
                  )}
                </div>

                {/* Stop & Evaluate Button */}
                <button
                  type="button"
                  onClick={stopRecordingAndEvaluate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>DỪNG & CHẤM ĐIỂM NGAY (STOP & EVALUATE)</span>
                </button>
              </div>
            )}

            {/* Manual text input fallback */}
            {showManualEdit && !isRecording && (
              <div className="w-full pt-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Gõ lại câu em vừa nói để kiểm tra..."
                  className="flex-grow text-xs bg-[#050b16] border border-cyan-500/30 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
                >
                  Chấm
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Step 3: Instant Evaluation & Mastery Badge Results */
          <div className="space-y-3.5">
            {/* Badge Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
                evaluationResult.badge === 'excellent'
                  ? 'bg-gradient-to-r from-amber-950/80 via-yellow-900/40 to-[#0e1f3a] border-amber-400/70 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
                  : evaluationResult.badge === 'good'
                  ? 'bg-gradient-to-r from-cyan-950/80 via-blue-900/40 to-[#0e1f3a] border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-gradient-to-r from-slate-900 via-rose-950/30 to-[#0e1f3a] border-rose-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                    evaluationResult.badge === 'excellent'
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce'
                      : evaluationResult.badge === 'good'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-rose-500 text-white border-rose-400'
                  }`}
                >
                  <Trophy className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm sm:text-base font-black tracking-wide ${
                        evaluationResult.badge === 'excellent'
                          ? 'text-yellow-300'
                          : evaluationResult.badge === 'good'
                          ? 'text-cyan-300'
                          : 'text-rose-300'
                      }`}
                    >
                      {evaluationResult.badgeTitleVi}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      ({evaluationResult.badgeTitleEn})
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-200 font-medium mt-0.5 leading-snug">
                    {evaluationResult.badgeDescriptionVi}
                  </p>
                </div>
              </div>

              {/* Overall Score Circle */}
              <div className="flex items-center gap-2 ml-auto">
                <div className="text-right">
                  <span className="text-[9.5px] text-slate-400 uppercase font-bold block">
                    ĐIỂM SHADOWING
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white font-mono">
                      {evaluationResult.overallScore}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#09152b] rounded-lg p-2 border border-cyan-500/20">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Độ chính xác từ (Word Accuracy)
                </span>
                <span className="text-base font-bold text-cyan-300 font-mono">
                  {evaluationResult.accuracyScore}%
                </span>
              </div>
              <div className="bg-[#09152b] rounded-lg p-2 border border-cyan-500/20">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Tốc độ nói (Speaking Pace)
                </span>
                <span className="text-base font-bold text-blue-300 font-mono">
                  {evaluationResult.wordsPerMinute} WPM
                </span>
              </div>
              <div className="bg-[#09152b] rounded-lg p-2 border border-cyan-500/20">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Độ trôi chảy (Fluency)
                </span>
                <span className="text-base font-bold text-emerald-300 font-mono">
                  {evaluationResult.fluencyScore}%
                </span>
              </div>
            </div>

            {/* Word-by-Word Alignment Pills */}
            <div className="p-3 rounded-xl bg-[#09142b] border border-cyan-500/25 space-y-2">
              <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-medium">
                <span className="font-bold text-slate-300 uppercase tracking-wide">
                  Chi tiết từng từ bạn đã nói (Word-by-word Match):
                </span>
                <div className="flex items-center gap-3 text-[9.5px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đúng chuẩn
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Gần đúng
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Chưa đạt
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {evaluationResult.wordMatches.map((m, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      m.status === 'correct'
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                        : m.status === 'near'
                        ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                        : 'bg-rose-950/70 border-rose-500/60 text-rose-300 line-through opacity-80'
                    }`}
                    title={m.note || (m.status === 'correct' ? 'Phát âm chuẩn xác' : '')}
                  >
                    {m.status === 'correct' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    {m.status === 'near' && <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span>{m.word}</span>
                  </span>
                ))}
              </div>

              {/* What the student actually said */}
              <div className="pt-2 text-[11.5px] text-slate-400 border-t border-slate-800">
                <span className="font-bold text-slate-300">Câu AI ghi nhận: </span>
                <span className="italic text-slate-200">
                  "{evaluationResult.spokenSentence}"
                </span>
              </div>
            </div>

            {/* Pedagogical Suggestions */}
            {evaluationResult.feedbackVi.length > 0 && (
              <div className="p-3 rounded-xl bg-[#071124] border border-cyan-500/20 text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Nhận xét & Hướng dẫn sư phạm:
                </span>
                <div className="space-y-0.5 text-slate-300 leading-relaxed">
                  {evaluationResult.feedbackVi.map((fb, i) => (
                    <div key={i}>{fb}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Listen to own recording & Retry */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              {recordedAudioUrl ? (
                <button
                  type="button"
                  onClick={handleTogglePlayRecordedAudio}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isPlayingRecordedAudio
                      ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'bg-purple-950/80 hover:bg-purple-900 border-purple-500/40 text-purple-300'
                  }`}
                >
                  {isPlayingRecordedAudio ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Dừng nghe lại giọng em</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Nghe lại giọng nói của em</span>
                    </>
                  )}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>LUYỆN LẠI LẦN NỮA (TRY AGAIN)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
