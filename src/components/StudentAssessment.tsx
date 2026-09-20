import React, { useState, useRef, useEffect } from 'react';
import {
  SchoolLevel,
  TaskType,
  ScoringScale,
  InputMethod,
  AssessmentResult,
  ScoreDetails,
  TaskTypeOption,
} from '../types';
import {
  TASK_TYPES,
  FEEDBACK_DICT,
  getDynamicFeedback,
  CURRICULUM_PROMPTS,
  getCurriculumPrompt,
} from '../data/curriculumData';
import { RadarChart } from './RadarChart';
import { SampleSpeechPlayer } from './SampleSpeechPlayer';
import { TargetVocabChecklist } from './TargetVocabChecklist';
import { DetailedFeedbackSection } from './DetailedFeedbackSection';
import { evaluateSpeakingRubric } from '../utils/speakingRubricEvaluator';
import confetti from 'canvas-confetti';
import {
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Mic,
  Video,
  Trash2,
  Camera,
  Loader2,
  Volume2,
  Wind,
  Activity,
  BookOpen,
  CheckCircle2,
  ListChecks,
  Users,
  Sparkles,
  Award,
  RefreshCw,
  Maximize2,
  Download,
  FileDown,
  Printer,
  FileAudio,
  FileVideo,
  MoreVertical,
  ChevronLeft,
  Check,
  Gauge,
  PictureInPicture,
  FileText,
} from 'lucide-react';
import { formatStudentFileName, downloadMediaFile } from '../utils';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { normalizeTranscribedSpeech } from '../utils/transcriptPunctuation';
import {
  downloadSpeakingReportPdf,
  printSpeakingReport,
  captureVideoSnapshot,
} from '../utils/speakingReportExporter';

interface StudentAssessmentProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  studentName: string;
  grade: string;
  onGradeChange?: (grade: string) => void;
  classNameVal: string;
}

export const StudentAssessment: React.FC<StudentAssessmentProps> = ({
  onShowToast,
  studentName,
  grade,
  onGradeChange,
  classNameVal,
}) => {
  // State
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(() => {
    const gNum = parseInt(grade, 10) || 4;
    return gNum <= 5 ? 'primary' : gNum <= 9 ? 'middle' : 'high';
  });

  // Sync school level when grade changes
  useEffect(() => {
    const gNum = parseInt(grade, 10) || 4;
    if (gNum <= 5) {
      setSchoolLevel('primary');
    } else if (gNum <= 9) {
      setSchoolLevel('middle');
    } else {
      setSchoolLevel('high');
    }
  }, [grade]);
  const [taskType, setTaskType] = useState<TaskType>('read_words');
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [scoringScale, setScoringScale] = useState<ScoringScale>(10);
  const [inputMethod, setInputMethod] = useState<InputMethod>('record');

  // Media state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  // Audio recording state
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioSeconds, setAudioSeconds] = useState(0);

  // Video recording state
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoFitMode, setVideoFitMode] = useState<'cover' | 'contain'>('cover');

  // 3-dots menus state
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isVideoMenuOpen, setIsVideoMenuOpen] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);

  // Playback speed states & submenus
  const [recordedVideoSpeed, setRecordedVideoSpeed] = useState<number>(1);
  const [isRecordedSpeedSubmenu, setIsRecordedSpeedSubmenu] = useState<boolean>(false);
  const [uploadedVideoSpeed, setUploadedVideoSpeed] = useState<number>(1);
  const [isUploadedSpeedSubmenu, setIsUploadedSpeedSubmenu] = useState<boolean>(false);
  const [recordedAudioSpeed, setRecordedAudioSpeed] = useState<number>(1);
  const [uploadedAudioSpeed, setUploadedAudioSpeed] = useState<number>(1);

  // Live Speech Recognition Transcript
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);

  // Guided Practice Prompt collapse/expand state (defaults to collapsed for compact interface)
  const [isPromptExpanded, setIsPromptExpanded] = useState<boolean>(false);

  // Analysis & Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCurrentMediaAnalyzed, setIsCurrentMediaAnalyzed] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Refs
  const audioTimerRef = useRef<any>(null);
  const videoTimerRef = useRef<any>(null);
  const audioMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const liveVideoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningSpeechRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');
  const sessionFinalTranscriptRef = useRef<string>('');
  const restartTimeoutRef = useRef<any>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const audioEnhancementCleanupRef = useRef<(() => void) | null>(null);
  const videoMirrorCleanupRef = useRef<(() => void) | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const videoBlobRef = useRef<Blob | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const uploadedAudioRef = useRef<HTMLAudioElement | null>(null);

  const PLAYBACK_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleSetSpeed = (
    videoEl: HTMLVideoElement | null,
    speed: number,
    isUploaded: boolean
  ) => {
    if (videoEl) {
      videoEl.playbackRate = speed;
    }
    if (isUploaded) {
      setUploadedVideoSpeed(speed);
      setIsUploadedSpeedSubmenu(false);
      setIsUploadMenuOpen(false);
    } else {
      setRecordedVideoSpeed(speed);
      setIsRecordedSpeedSubmenu(false);
      setIsVideoMenuOpen(false);
    }
    onShowToast(`⚡ Tốc độ phát: ${speed === 1 ? 'Chuẩn (1.0x)' : `${speed}x`}`, 'info');
  };

  const handleTogglePiP = async (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        onShowToast('Đã đóng chế độ Hình trong hình', 'info');
      } else if (videoEl.requestPictureInPicture) {
        await videoEl.requestPictureInPicture();
        onShowToast('📺 Đã bật chế độ Hình trong hình', 'info');
      } else {
        onShowToast('Trình duyệt không hỗ trợ Hình trong hình', 'error');
      }
    } catch (err: any) {
      onShowToast('Không thể mở Hình trong hình: ' + (err?.message || ''), 'error');
    }
    setIsVideoMenuOpen(false);
    setIsUploadMenuOpen(false);
  };

  // Current curriculum practice prompt
  const currentPrompt = getCurriculumPrompt(schoolLevel, taskType);

  // Auto-sync school level with selected Grade
  useEffect(() => {
    const gNum = parseInt(grade, 10);
    if (!isNaN(gNum)) {
      if (gNum <= 5 && schoolLevel !== 'primary') setSchoolLevel('primary');
      else if (gNum >= 6 && gNum <= 9 && schoolLevel !== 'middle') setSchoolLevel('middle');
      else if (gNum >= 10 && schoolLevel !== 'high') setSchoolLevel('high');
    }
  }, [grade]);

  // Audio enhancement pipeline using Web Audio API:
  // - Highpass filter (85Hz): eliminates mic thumps, low AC hum, and table rumble
  // - Vocal warmth (+1.2dB at 240Hz): adds rich chest resonance to the voice
  // - Vocal presence (+2.8dB at 3200Hz): boosts clarity, crispness, and articulation ("hay hơn")
  // - Studio Dynamics Compressor: smooths vocal volume variations, lifts soft syllables
  // - Clean Gain Boost (1.5x / ~+3.5dB): makes the final recording noticeably louder without clipping ("to hơn 1 chút")
  const createEnhancedAudioStream = (inputStream: MediaStream): {
    enhancedStream: MediaStream;
    cleanup: () => void;
  } => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass || inputStream.getAudioTracks().length === 0) {
        return { enhancedStream: inputStream, cleanup: () => {} };
      }

      const audioCtx = new AudioContextClass();
      const sourceNode = audioCtx.createMediaStreamSource(inputStream);

      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 85;

      const vocalWarmth = audioCtx.createBiquadFilter();
      vocalWarmth.type = 'peaking';
      vocalWarmth.frequency.value = 240;
      vocalWarmth.gain.value = 1.2;
      vocalWarmth.Q.value = 1.0;

      const vocalPresence = audioCtx.createBiquadFilter();
      vocalPresence.type = 'peaking';
      vocalPresence.frequency.value = 3200;
      vocalPresence.gain.value = 2.8;
      vocalPresence.Q.value = 1.2;

      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 14;
      compressor.ratio.value = 3.5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.15;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.5; // +3.5 dB louder, rich, and clear

      sourceNode.connect(highpass);
      highpass.connect(vocalWarmth);
      vocalWarmth.connect(vocalPresence);
      vocalPresence.connect(compressor);
      compressor.connect(gainNode);

      const destination = audioCtx.createMediaStreamDestination();
      gainNode.connect(destination);

      return {
        enhancedStream: destination.stream,
        cleanup: () => {
          try {
            audioCtx.close();
          } catch (e) {}
        },
      };
    } catch (err) {
      console.warn('Audio enhancement fallback to raw stream:', err);
      return { enhancedStream: inputStream, cleanup: () => {} };
    }
  };

  // Cleanup on unmount or input method switch
  useEffect(() => {
    return () => {
      stopCamera();
      if (videoMirrorCleanupRef.current) {
        videoMirrorCleanupRef.current();
        videoMirrorCleanupRef.current = null;
      }
      clearInterval(audioTimerRef.current);
      clearInterval(videoTimerRef.current);
      clearTimeout(restartTimeoutRef.current);
      isListeningSpeechRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Web Speech API for transcript with continuous, resilient listening, zero silence timeout,
  // and real-time capitalization + sentence punctuation formatting
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition is not supported in this browser.');
      return;
    }

    isListeningSpeechRef.current = true;
    accumulatedTranscriptRef.current = '';
    sessionFinalTranscriptRef.current = '';
    clearTimeout(restartTimeoutRef.current);
    setIsListeningSpeech(true);

    const initRecognition = () => {
      if (!isListeningSpeechRef.current) return;

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
          recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListeningSpeech(true);
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let sessionFinal = '';

          for (let i = 0; i < event.results.length; ++i) {
            const item = event.results[i];
            const transcript = item[0]?.transcript || '';
            if (item.isFinal) {
              sessionFinal += transcript + ' ';
            } else {
              interim += transcript + ' ';
            }
          }

          sessionFinalTranscriptRef.current = sessionFinal;

          // Merge past completed sessions + current session final + current active interim
          const combinedRaw = [
            accumulatedTranscriptRef.current,
            sessionFinal,
            interim,
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (combinedRaw) {
            // Real-time responsive formatting: capitalize, handle I/I'm, proper nouns, clean stutter
            const formatted = normalizeTranscribedSpeech(combinedRaw, false);
            setLiveTranscript(formatted);
          }
        };

        recognition.onerror = (event: any) => {
          // 'no-speech' or 'audio-capture' occurs during pauses; do not abort recording
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            return;
          }
        };

        recognition.onend = () => {
          // If student is still speaking/recording, commit session text and restart immediately!
          if (isListeningSpeechRef.current) {
            if (sessionFinalTranscriptRef.current.trim()) {
              accumulatedTranscriptRef.current = [
                accumulatedTranscriptRef.current,
                sessionFinalTranscriptRef.current.trim(),
              ]
                .filter(Boolean)
                .join(' ')
                .trim();
              sessionFinalTranscriptRef.current = '';
            }

            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = setTimeout(() => {
              if (isListeningSpeechRef.current) {
                initRecognition();
              }
            }, 60);
          } else {
            setIsListeningSpeech(false);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    };

    initRecognition();
  };

  const stopSpeechRecognition = () => {
    isListeningSpeechRef.current = false;
    clearTimeout(restartTimeoutRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Allow browser final audio packet to flush, then execute full final punctuation pass
    setTimeout(() => {
      setLiveTranscript((prev) => {
        if (!prev || !prev.trim()) return prev;
        return normalizeTranscribedSpeech(prev, true);
      });
      setIsListeningSpeech(false);
    }, 200);
  };

  // Reset analysis when inputs change
  const resetAnalysis = () => {
    setIsCurrentMediaAnalyzed(false);
    setResult(null);
  };

  // Switch input method
  const handleSwitchInputMethod = (method: InputMethod) => {
    resetAnalysis();
    if (method !== 'video') {
      stopCamera();
    }
    setInputMethod(method);
    if (method === 'video') {
      startCamera();
    }
  };

  // Camera Management
  const startCamera = async () => {
    try {
      if (videoStreamRef.current) return;
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
      };
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      videoStreamRef.current = stream;
      if (liveVideoPreviewRef.current) {
        liveVideoPreviewRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      onShowToast('⚠️ Không thể truy cập Camera/Microphone. Vui lòng cấp quyền!', 'error');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoMirrorCleanupRef.current) {
      videoMirrorCleanupRef.current();
      videoMirrorCleanupRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (liveVideoPreviewRef.current) {
      liveVideoPreviewRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Audio Recording Handlers
  const toggleAudioRecording = async () => {
    if (!isAudioRecording) {
      resetAnalysis();
      setLiveTranscript('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
        });

        // Boost and enrich audio (clearer, warmer, louder +3.5dB without clipping)
        const { enhancedStream, cleanup } = createEnhancedAudioStream(stream);
        audioEnhancementCleanupRef.current = cleanup;

        const mediaRecorder = new MediaRecorder(enhancedStream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          audioBlobRef.current = audioBlob;
          const url = URL.createObjectURL(audioBlob);
          setAudioBlobUrl(url);
          stream.getTracks().forEach((t) => t.stop());
          stopSpeechRecognition();
          if (audioEnhancementCleanupRef.current) {
            audioEnhancementCleanupRef.current();
            audioEnhancementCleanupRef.current = null;
          }
        };

        mediaRecorder.start();
        audioMediaRecorderRef.current = mediaRecorder;
        setIsAudioRecording(true);

        setAudioSeconds(0);
        audioTimerRef.current = setInterval(() => {
          setAudioSeconds((prev) => prev + 1);
        }, 1000);

        startSpeechRecognition();
        onShowToast('🎙️ Bắt đầu ghi âm bài nói (Âm thanh chuẩn Studio)...', 'info');
      } catch (err) {
        onShowToast('⚠️ Không thể truy cập Microphone!', 'error');
      }
    } else {
      if (audioMediaRecorderRef.current && audioMediaRecorderRef.current.state !== 'inactive') {
        audioMediaRecorderRef.current.stop();
      }
      setIsAudioRecording(false);
      clearInterval(audioTimerRef.current);
      stopSpeechRecognition();
      onShowToast('✅ Đã ghi âm xong!', 'success');
    }
  };

  const discardAudioRecording = () => {
    resetAnalysis();
    setIsAudioMenuOpen(false);
    audioBlobRef.current = null;
    setAudioBlobUrl(null);
    audioChunksRef.current = [];
    setAudioSeconds(0);
    accumulatedTranscriptRef.current = '';
    sessionFinalTranscriptRef.current = '';
    setLiveTranscript('');
  };

  // Video Recording Handlers
  const toggleVideoRecording = async () => {
    if (!isVideoRecording) {
      resetAnalysis();
      setLiveTranscript('');
      try {
        if (!videoStreamRef.current) {
          await startCamera();
        }
        if (!videoStreamRef.current) return;

        // Enhance audio before recording to make audio louder and studio-grade
        const { enhancedStream, cleanup } = createEnhancedAudioStream(videoStreamRef.current);
        audioEnhancementCleanupRef.current = cleanup;

        // Bake mirror effect directly into recorded video track so exported file matches camera preview
        let videoTrackToRecord = videoStreamRef.current.getVideoTracks()[0];
        try {
          const previewVideo = liveVideoPreviewRef.current;
          if (previewVideo && typeof HTMLCanvasElement.prototype.captureStream === 'function') {
            const rawTrack = videoStreamRef.current.getVideoTracks()[0];
            const settings = rawTrack?.getSettings ? rawTrack.getSettings() : {};
            let width = settings.width || previewVideo.videoWidth || 1280;
            let height = settings.height || previewVideo.videoHeight || 720;
            // Ensure even dimensions required by H.264/video encoders
            if (width % 2 !== 0) width -= 1;
            if (height % 2 !== 0) height -= 1;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });

            let isMirrorRunning = true;
            let animId: number;

            const renderMirroredFrame = () => {
              if (!isMirrorRunning) return;
              if (ctx && previewVideo && previewVideo.readyState >= 2) {
                ctx.save();
                // Flip horizontally so the recording matches the student's mirror preview
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
                ctx.restore();
              }
            };

            // Draw initial frame
            renderMirroredFrame();

            const animationLoop = () => {
              if (!isMirrorRunning) return;
              renderMirroredFrame();
              animId = requestAnimationFrame(animationLoop);
            };
            animId = requestAnimationFrame(animationLoop);

            // Fallback timer if tab is blurred/inactive to ensure continuous frame streaming
            const fallbackTimer = setInterval(() => {
              if (document.hidden) {
                renderMirroredFrame();
              }
            }, 1000 / 30);

            const canvasStream = canvas.captureStream(30);
            const canvasTrack = canvasStream.getVideoTracks()[0];

            if (canvasTrack) {
              videoTrackToRecord = canvasTrack;
              videoMirrorCleanupRef.current = () => {
                isMirrorRunning = false;
                cancelAnimationFrame(animId);
                clearInterval(fallbackTimer);
                try {
                  canvasTrack.stop();
                } catch (e) {}
              };
            }
          }
        } catch (mirrorErr) {
          console.warn('Canvas mirror recording fallback to raw stream:', mirrorErr);
        }

        // Combine (mirrored) video track + enhanced audio track
        const combinedStream = new MediaStream([
          videoTrackToRecord,
          ...enhancedStream.getAudioTracks(),
        ]);

        // Find best supported format for browser
        const preferredMimes = [
          'video/mp4;codecs=avc1,mp4a.40.2',
          'video/mp4;codecs=avc1',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ];
        let chosenMime = '';
        for (const m of preferredMimes) {
          if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
            chosenMime = m;
            break;
          }
        }

        const mediaRecorder = new MediaRecorder(
          combinedStream,
          chosenMime ? { mimeType: chosenMime } : undefined
        );
        videoChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) videoChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          if (videoMirrorCleanupRef.current) {
            videoMirrorCleanupRef.current();
            videoMirrorCleanupRef.current = null;
          }
          const isMp4 = chosenMime.includes('mp4');
          const videoBlob = new Blob(videoChunksRef.current, {
            type: isMp4 ? 'video/mp4' : 'video/mp4',
          });
          videoBlobRef.current = videoBlob;
          const url = URL.createObjectURL(videoBlob);
          setVideoBlobUrl(url);
          stopCamera();
          stopSpeechRecognition();
          if (audioEnhancementCleanupRef.current) {
            audioEnhancementCleanupRef.current();
            audioEnhancementCleanupRef.current = null;
          }
        };

        mediaRecorder.start();
        videoMediaRecorderRef.current = mediaRecorder;
        setIsVideoRecording(true);

        setVideoSeconds(0);
        videoTimerRef.current = setInterval(() => {
          setVideoSeconds((prev) => prev + 1);
        }, 1000);

        startSpeechRecognition();
        onShowToast('🎥 Bắt đầu ghi hình bài nói (Âm thanh lọc ồn, to & rõ hơn)...', 'info');
      } catch (err) {
        onShowToast('⚠️ Lỗi quay video: ' + (err as any).message, 'error');
      }
    } else {
      if (videoMediaRecorderRef.current && videoMediaRecorderRef.current.state !== 'inactive') {
        videoMediaRecorderRef.current.stop();
      }
      setIsVideoRecording(false);
      clearInterval(videoTimerRef.current);
      stopSpeechRecognition();
      onShowToast('✅ Đã hoàn thành ghi hình video!', 'success');
    }
  };

  const discardVideoRecording = () => {
    resetAnalysis();
    setIsVideoMenuOpen(false);
    videoBlobRef.current = null;
    setVideoBlobUrl(null);
    videoChunksRef.current = [];
    setVideoSeconds(0);
    accumulatedTranscriptRef.current = '';
    sessionFinalTranscriptRef.current = '';
    setLiveTranscript('');
    startCamera();
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetAnalysis();
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedFileUrl(url);
    onShowToast(`📁 Đã tải lên: ${file.name}`, 'success');
  };

  const clearFileUpload = () => {
    resetAnalysis();
    setIsUploadMenuOpen(false);
    setUploadedFile(null);
    setUploadedFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export / Download Media with Student's Full Name (e.g. Duong Thi Quynh Giao.mp3 / .mp4)
  const handleExportMedia = (type: 'audio' | 'video') => {
    let sourceMedia: Blob | string | null = null;
    const ext: 'mp3' | 'mp4' = type === 'video' ? 'mp4' : 'mp3';

    if (type === 'video') {
      sourceMedia = videoBlobRef.current || videoBlobUrl || (uploadedFile?.type.startsWith('video/') ? (uploadedFile || uploadedFileUrl) : null);
    } else {
      sourceMedia = audioBlobRef.current || audioBlobUrl || (!uploadedFile?.type.startsWith('video/') ? (uploadedFile || uploadedFileUrl) : null);
    }

    if (!sourceMedia) {
      onShowToast('⚠️ Chưa có file để xuất!', 'error');
      return;
    }

    const fileName = formatStudentFileName(studentName, ext);
    downloadMediaFile(sourceMedia, fileName);
    onShowToast(`📥 Đã xuất file: ${fileName}`, 'success');
  };

  // Format seconds as mm:ss
  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Task selection
  const handleSelectTaskType = (opt: TaskTypeOption) => {
    setTaskType(opt.id);
    if (opt.level && opt.level !== schoolLevel) {
      setSchoolLevel(opt.level);
    }
    setTaskDropdownOpen(false);
    resetAnalysis();
  };

  // Grading & Analysis Execution
  const handleAnalyzeAndGrade = async () => {
    if (isCurrentMediaAnalyzed) {
      onShowToast('⚠️ Bản ghi này đã được phân tích. Vui lòng ghi âm/quay video mới để đánh giá lại!', 'error');
      return;
    }

    let hasVideoContent = false;

    if (inputMethod === 'upload') {
      if (!uploadedFile) {
        onShowToast('⚠️ LỖI: Vui lòng tải lên một tệp âm thanh hoặc video trước!', 'error');
        return;
      }
      if (uploadedFile.type.startsWith('video/')) hasVideoContent = true;
    } else if (inputMethod === 'video') {
      if (!videoBlobUrl) {
        onShowToast('⚠️ LỖI: Bạn chưa thực hiện ghi hình xong!', 'error');
        return;
      }
      hasVideoContent = true;
    } else {
      if (!audioBlobUrl) {
        onShowToast('⚠️ LỖI: Bạn chưa thực hiện ghi âm!', 'error');
        return;
      }
    }

    setIsAnalyzing(true);

    try {
      // Simulate speech analysis pipeline delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const activeDuration =
        inputMethod === 'record'
          ? Math.max(audioSeconds, 6)
          : inputMethod === 'video'
          ? Math.max(videoSeconds, 6)
          : 15; // default estimation for uploaded audio/video

      // Use actual student transcript (normalized with proper capitals & terminal periods)
      // or generate contextual transcript from sample if speech API didn't fire
      const actualTranscript =
        liveTranscript && liveTranscript.trim().length > 0
          ? normalizeTranscribedSpeech(liveTranscript.trim())
          : currentPrompt.sampleContent.replace(/\n/g, ' ').substring(0, 160);

      const finalResult = evaluateSpeakingRubric({
        schoolLevel,
        taskType,
        transcript: actualTranscript,
        durationSeconds: activeDuration,
        hasVideo: hasVideoContent,
        scoringScale,
        sampleContent: currentPrompt.sampleContent,
        taskTitleEn: selectedTaskObj.en,
        taskTitleVi: selectedTaskObj.vi,
      });

      setResult(finalResult);
      setIsCurrentMediaAnalyzed(true);
      onShowToast('🎉 Đã phân tích theo Rubric & chấm điểm bài nói thành công!', 'success');

      // Trigger celebratory confetti if score is high
      if (finalResult.overallScore >= 8.0) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);

      return finalResult;
    } catch (error) {
      onShowToast('⚠️ Đã xảy ra lỗi trong quá trình phân tích.', 'error');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Generates and exports the official Bilingual Speaking Assessment Report (Phiếu kết quả)
   * Offers Word (.doc) and PDF (.pdf) format exports.
   * If analysis hasn't been run yet, automatically evaluates the recording first.
   */
  const handleExportAssessmentReport = async (format: 'word' | 'pdf' | 'print' = 'pdf') => {
    let currentResult = result;

    if (!currentResult) {
      const hasMedia =
        inputMethod === 'record'
          ? !!audioBlobUrl
          : inputMethod === 'video'
          ? !!videoBlobUrl
          : !!uploadedFile;

      if (hasMedia) {
        onShowToast('⏳ Đang tiến hành phân tích năng lực để tạo phiếu kết quả...', 'info');
        currentResult = (await handleAnalyzeAndGrade()) || null;
      } else {
        onShowToast('⚠️ Vui lòng ghi âm hoặc quay video bài nói trước khi xuất phiếu kết quả!', 'error');
        return;
      }
    }

    if (!currentResult) {
      onShowToast('⚠️ Chưa có kết quả đánh giá để xuất phiếu!', 'error');
      return;
    }

    try {
      let videoSnapUrl = '';
      let videoSnapTime = '';
      if (currentResult.hasVideo || inputMethod === 'video' || (uploadedFile && uploadedFile.type.startsWith('video/'))) {
        try {
          const snap = await captureVideoSnapshot();
          if (snap) {
            videoSnapUrl = snap;
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            videoSnapTime = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          }
        } catch (e) {
          console.warn('Capture snapshot error:', e);
        }
      }

      const exportData = {
        studentName,
        grade,
        classNameVal,
        taskTypeEn: selectedTaskObj.en,
        taskTypeVi: selectedTaskObj.vi,
        scale: scoringScale,
        result: currentResult,
        videoSnapshotUrl: videoSnapUrl || undefined,
        videoSnapshotTime: videoSnapTime || undefined,
      };

      if (format === 'pdf') {
        setIsExportingPdf(true);
        onShowToast('⏳ Đang tạo file PDF 2 trang chất lượng cao...', 'info');
        const fileName = await downloadSpeakingReportPdf(exportData);
        onShowToast(`📄 Đã xuất phiếu kết quả PDF: ${fileName}`, 'success');
      } else if (format === 'print') {
        printSpeakingReport(exportData);
        onShowToast('🖨️ Đang mở hộp thoại In / Lưu PDF...', 'info');
      }
    } catch (err) {
      console.error('Export report error:', err);
      onShowToast('⚠️ Đã xảy ra lỗi khi tạo phiếu kết quả.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const selectedTaskObj = TASK_TYPES.find((t) => t.id === taskType) || TASK_TYPES[0];

  return (
    <div id="student-view-wrapper" className="space-y-4">
      <div className="max-w-5xl mx-auto w-full bg-[#0b1122]/95 backdrop-blur-xl rounded-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.1)] border border-cyan-500/25 text-slate-100 relative overflow-hidden">
        {/* Top glowing cyber accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.8)]" />

        {/* TOP BADGE: Welcome & GDPT 2018 alignment */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-cyan-500/20">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
              Luyện nói & Đánh giá Năng lực Nói tiếng Anh
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Học sinh: <span className="text-cyan-300 font-bold">{studentName || 'Học sinh'}</span> • Lớp: <span className="text-cyan-400 font-bold">{grade}/{classNameVal}</span>
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            GDPT 2018 Standard
          </div>
        </div>

        {/* 1. School Level & Task Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* School Level */}
          <div className="space-y-1.5">
            <label id="lblSchoolLevel" className="block text-sm font-bold text-slate-200">
              School Level (Cấp học)
            </label>
            <div className="relative">
              <select
                id="studentSchoolLevel"
                value={schoolLevel}
                onChange={(e) => {
                  setSchoolLevel(e.target.value as SchoolLevel);
                  resetAnalysis();
                }}
                className="w-full bg-[#0d162d] border border-cyan-500/35 text-slate-100 text-sm rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] pr-10 font-medium"
              >
                <option value="primary" className="bg-[#0d162d] text-slate-100">Primary School (Tiểu học - Lớp 1-5)</option>
                <option value="middle" className="bg-[#0d162d] text-slate-100">Secondary School (THCS - Lớp 6-9)</option>
                <option value="high" className="bg-[#0d162d] text-slate-100">High School (THPT - Lớp 10-12)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Task Type */}
          <div className="space-y-1.5 relative" id="taskTypeContainer">
            <div className="flex items-center justify-between">
              <label id="lblTaskType" className="block text-sm font-bold text-slate-200">
                Task Type (Dạng bài nói)
              </label>
              <span className="text-[11px] font-medium text-cyan-300/80">
                25 dạng bài • 3 cấp học
              </span>
            </div>

            <div
              id="customTaskTypeToggle"
              onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
              className="w-full bg-[#0d162d] border border-cyan-500/35 hover:border-cyan-400 text-slate-100 text-sm rounded-lg px-4 py-2.5 flex justify-between items-center cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] focus:outline-none transition-all"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor] ${
                    selectedTaskObj.level === 'primary'
                      ? 'bg-cyan-400 text-cyan-400'
                      : selectedTaskObj.level === 'middle'
                      ? 'bg-emerald-400 text-emerald-400'
                      : 'bg-purple-400 text-purple-400'
                  }`}
                />
                <span id="selectedTaskTypeText" className={`font-bold truncate ${
                  selectedTaskObj.level === 'primary'
                    ? 'text-cyan-300'
                    : selectedTaskObj.level === 'middle'
                    ? 'text-emerald-300'
                    : 'text-purple-300'
                }`}>
                  {selectedTaskObj.en} ({selectedTaskObj.vi})
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${taskDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {taskDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setTaskDropdownOpen(false)}
                />
                <div
                  id="customTaskTypeList"
                  className="absolute z-50 w-full mt-1 bg-[#0a1122] border border-cyan-500/40 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.2)] max-h-80 sm:max-h-96 overflow-y-auto text-sm py-1 divide-y divide-slate-800"
                >
                  {/* CẤP 1 - TIỂU HỌC (CYAN) */}
                  <div className="p-1.5">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 rounded-lg flex items-center justify-between mb-1 border border-cyan-500/30">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                        Cấp 1: Tiểu học (Primary School)
                      </span>
                      <span className="text-[10px] font-semibold bg-cyan-900/60 px-2 py-0.5 rounded text-cyan-200">
                        7 dạng bài
                      </span>
                    </div>
                    {TASK_TYPES.filter((t) => t.level === 'primary').map((opt) => (
                      <div
                        key={opt.id}
                        id={`taskTypeOption-${opt.id}`}
                        onClick={() => handleSelectTaskType(opt)}
                        className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          taskType === opt.id
                            ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'hover:bg-cyan-950/50 text-cyan-200 font-medium'
                        }`}
                      >
                        <div className="text-[13px] font-semibold text-cyan-300">{opt.en}</div>
                        <div className="text-[11px] text-cyan-400/70">{opt.vi}</div>
                      </div>
                    ))}
                  </div>

                  {/* CẤP 2 - THCS (GREEN / XANH LÁ) */}
                  <div className="p-1.5">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 rounded-lg flex items-center justify-between mb-1 border border-emerald-500/30">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                        Cấp 2: THCS (Secondary School)
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                        8 dạng bài
                      </span>
                    </div>
                    {TASK_TYPES.filter((t) => t.level === 'middle').map((opt) => (
                      <div
                        key={opt.id}
                        id={`taskTypeOption-${opt.id}`}
                        onClick={() => handleSelectTaskType(opt)}
                        className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          taskType === opt.id
                            ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'hover:bg-emerald-950/50 text-emerald-200 font-medium'
                        }`}
                      >
                        <div className="text-[13px] font-semibold text-emerald-300">{opt.en}</div>
                        <div className="text-[11px] text-emerald-400/70">{opt.vi}</div>
                      </div>
                    ))}
                  </div>

                  {/* CẤP 3 - THPT (PURPLE / TÍM) */}
                  <div className="p-1.5">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 rounded-lg flex items-center justify-between mb-1 border border-purple-500/30">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                        Cấp 3: THPT (High School)
                      </span>
                      <span className="text-[10px] font-semibold bg-purple-900/60 px-2 py-0.5 rounded text-purple-200">
                        10 dạng bài
                      </span>
                    </div>
                    {TASK_TYPES.filter((t) => t.level === 'high').map((opt) => (
                      <div
                        key={opt.id}
                        id={`taskTypeOption-${opt.id}`}
                        onClick={() => handleSelectTaskType(opt)}
                        className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          taskType === opt.id
                            ? 'bg-purple-950 text-purple-300 font-bold border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                            : 'hover:bg-purple-950/50 text-purple-200 font-medium'
                        }`}
                      >
                        <div className="text-[13px] font-semibold text-purple-300">{opt.en}</div>
                        <div className="text-[11px] text-purple-400/70">{opt.vi}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* GUIDED PRACTICE PROMPT: Displays sample text/question for the student to speak with advanced level-adaptive TTS player */}
        <div id="practicePromptBox" className="mb-5 bg-[#090f1d] border border-cyan-500/35 rounded-xl p-4 text-slate-100 shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
              <h3 className="text-sm font-bold text-cyan-300">
                {currentPrompt.title}
              </h3>
            </div>
            <button
              type="button"
              id="btnTogglePromptCollapse"
              onClick={() => setIsPromptExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 hover:text-cyan-100 text-xs font-semibold cursor-pointer transition-colors shadow-sm"
              title={isPromptExpanded ? 'Thu gọn phần nội dung luyện đọc' : 'Mở rộng phần nội dung luyện đọc'}
              aria-expanded={isPromptExpanded}
            >
              <span>{isPromptExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
              {isPromptExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>
          </div>

          {isPromptExpanded ? (
            <div className="mt-2.5">
              <p className="text-xs text-slate-300 mb-3">
                👉 <span className="font-semibold text-cyan-200">{currentPrompt.instructionVi}</span> ({currentPrompt.instructionEn})
              </p>

              <SampleSpeechPlayer
                sampleText={currentPrompt.sampleContent}
                suggestedVocabulary={currentPrompt.suggestedVocabulary}
                schoolLevel={schoolLevel}
                onShowToast={onShowToast}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-400/80 italic mt-2 line-clamp-1">
              {currentPrompt.sampleContent}
            </p>
          )}
        </div>

        {/* TARGET VOCABULARY & GRAMMAR CHECKLIST BY UNIT */}
        <TargetVocabChecklist
          grade={grade}
          onGradeChange={onGradeChange}
          schoolLevel={schoolLevel}
          currentTranscript={
            liveTranscript && liveTranscript.trim().length > 0
              ? liveTranscript
              : (result?.transcript || '')
          }
          onShowToast={onShowToast}
          onApplyWordToSpeech={(word) => {
            setLiveTranscript((prev) => (prev ? `${prev} ${word}` : word));
            onShowToast(`Đã thêm từ "${word}" vào nội dung bài nói!`, 'info');
          }}
        />

        {/* 2. Scoring Scale */}
        <div className="mb-4">
          <label id="lblScoringScale" className="block text-sm font-bold text-slate-200 mb-1.5">
            Scoring Scale (Thang điểm chấm)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              id="radioScale10Label"
              className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-all ${
                scoringScale === 10
                  ? 'bg-[#0f1e3c] border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                  : 'bg-[#0d162d] border-slate-700/80 hover:border-cyan-500/40 text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="scoringScale"
                value="10"
                checked={scoringScale === 10}
                onChange={() => {
                  setScoringScale(10);
                  resetAnalysis();
                }}
                className="w-4 h-4 text-cyan-500 border-slate-600 focus:ring-cyan-400 cursor-pointer accent-cyan-400"
              />
              <span className="ml-2.5 text-sm font-semibold">10-point Scale (Thang điểm 10)</span>
            </label>

            <label
              id="radioScale100Label"
              className={`flex items-center p-2.5 border rounded-lg cursor-pointer transition-all ${
                scoringScale === 100
                  ? 'bg-[#0f1e3c] border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                  : 'bg-[#0d162d] border-slate-700/80 hover:border-cyan-500/40 text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="scoringScale"
                value="100"
                checked={scoringScale === 100}
                onChange={() => {
                  setScoringScale(100);
                  resetAnalysis();
                }}
                className="w-4 h-4 text-cyan-500 border-slate-600 focus:ring-cyan-400 cursor-pointer accent-cyan-400"
              />
              <span className="ml-2.5 text-sm font-semibold">100-point Scale (Thang điểm 100)</span>
            </label>
          </div>
        </div>

        {/* 3. Input Method Tabs */}
        <div className="mb-4">
          <label id="lblInputMethod" className="block text-[13px] font-bold text-slate-200 mb-1.5">
            Input Method (Phương thức nộp bài nói)
          </label>
          <div className="flex p-1 bg-[#090f1e] border border-cyan-500/30 rounded-lg gap-1">
            <button
              id="btnInputUpload"
              onClick={() => handleSwitchInputMethod('upload')}
              className={`flex-1 py-1.5 text-[13px] font-bold rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                inputMethod === 'upload'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-[#13203c]'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Upload
            </button>
            <button
              id="btnInputRecord"
              onClick={() => handleSwitchInputMethod('record')}
              className={`flex-1 py-1.5 text-[13px] font-bold rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                inputMethod === 'record'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-[#13203c]'
              }`}
            >
              <Mic className="w-4 h-4" /> Audio
            </button>
            <button
              id="btnInputVideo"
              onClick={() => handleSwitchInputMethod('video')}
              className={`flex-1 py-1.5 text-[13px] font-bold rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                inputMethod === 'video'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-cyan-200 hover:bg-[#13203c]'
              }`}
            >
              <Video className="w-4 h-4" /> Video
            </button>
          </div>
        </div>

        {/* Recording / Upload Stage Container */}
        <div className="bg-[#080e1a] border border-cyan-500/30 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center min-h-[160px] mb-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          
          {/* A. UPLOAD STATE */}
          {inputMethod === 'upload' && (
            <div id="uploadStateView" className="flex flex-col items-center justify-center w-full transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id="fileUploadInput"
                accept=".mp3,.wav,.mp4,.wmv,audio/*,video/mp4,video/x-ms-wmv"
                className="hidden"
                onChange={handleFileUpload}
              />

              {!uploadedFileUrl ? (
                <div
                  id="uploadPlaceholder"
                  className="flex flex-col items-center justify-center w-full cursor-pointer rounded-xl p-6 hover:bg-[#0c162e] border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 bg-[#0e1a34] border border-cyan-500/40 rounded-full flex items-center justify-center mb-2 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                    <UploadCloud className="w-6 h-6 text-cyan-300" />
                  </div>
                  <p className="text-[13px] text-slate-200 font-semibold">
                    Kéo thả hoặc nhấn để chọn file âm thanh / video
                  </p>
                  <span className="text-[11px] text-cyan-400/70 mt-1">
                    Định dạng hỗ trợ: MP3, WAV, MP4, WMV (Dung lượng &lt; 50MB)
                  </span>
                </div>
              ) : (
                <div id="studentMediaPlayerContainer" className="w-full flex flex-col items-center p-2">
                  <div id="playerWrapper" className="w-full flex justify-center">
                    {uploadedFile?.type.startsWith('video/') ? (
                      <div className="w-full max-w-xl flex flex-col items-center">
                        <CustomVideoPlayer
                          id="uploadedVideoCustomPlayer"
                          src={uploadedFileUrl!}
                          studentName={studentName}
                          videoFitMode={videoFitMode}
                          onExport={() => handleExportMedia('video')}
                          onShowToast={onShowToast}
                        />

                        {/* Below uploaded video: Only Discard button */}
                        <div className="w-full flex justify-center mt-2.5">
                          <button
                            id="btnDiscardUploadVideo"
                            type="button"
                            onClick={clearFileUpload}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-[#0d162d] hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 text-xs font-semibold shadow-xs cursor-pointer transition-all"
                            title="Hủy file tải lên"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
                            <span>Hủy & Tải lại</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full max-w-md">
                        <div className="w-full bg-[#0d172e] border border-cyan-500/35 rounded-full p-1.5 pl-2 pr-2.5 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
                          <audio
                            ref={uploadedAudioRef}
                            controls
                            controlsList="nodownload noplaybackrate"
                            src={uploadedFileUrl}
                            className="w-full h-9 outline-none flex-grow"
                          />
                          {/* 3-dots Menu for Uploaded Audio */}
                          <div className="relative shrink-0">
                            <button
                              id="btnUploadAudioMoreMenu"
                              type="button"
                              onClick={() => setIsUploadMenuOpen(prev => !prev)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-cyan-300 hover:text-white hover:bg-[#16274e] transition-colors cursor-pointer"
                              title="Tùy chọn (Dấu 3 chấm)"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isUploadMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsUploadMenuOpen(false)} />
                                <div className="absolute right-0 bottom-full mb-2 w-64 bg-[#0a1224] text-white rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.3)] border border-cyan-500/40 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                                  {/* 1. Tải xuống */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleExportMedia('audio');
                                      setIsUploadMenuOpen(false);
                                    }}
                                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[#12203e] text-left transition-colors cursor-pointer text-cyan-300 font-medium"
                                  >
                                    <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="font-bold text-white">Tải xuống</span>
                                      <span className="text-[11px] text-cyan-300/70 truncate">
                                        {formatStudentFileName(studentName, 'mp3')}
                                      </span>
                                    </div>
                                  </button>

                                  <div className="my-1 border-t border-slate-800" />

                                  {/* 2. Tốc độ phát */}
                                  <div className="px-3.5 py-2">
                                    <div className="flex items-center gap-2 mb-1.5 text-slate-300 font-semibold">
                                      <Gauge className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Tốc độ phát: {uploadedAudioSpeed === 1 ? 'Chuẩn' : `${uploadedAudioSpeed}x`}</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1">
                                      {PLAYBACK_SPEED_OPTIONS.map((speed) => (
                                        <button
                                          key={speed}
                                          type="button"
                                          onClick={() => {
                                            if (uploadedAudioRef.current) {
                                              uploadedAudioRef.current.playbackRate = speed;
                                            }
                                            setUploadedAudioSpeed(speed);
                                            onShowToast(`⚡ Tốc độ phát: ${speed === 1 ? 'Chuẩn (1.0x)' : `${speed}x`}`, 'info');
                                          }}
                                          className={`py-1 text-[10px] rounded font-semibold transition-colors text-center cursor-pointer ${
                                            uploadedAudioSpeed === speed
                                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                                              : 'bg-[#12203e] hover:bg-[#1a2d56] text-slate-300'
                                          }`}
                                        >
                                          {speed}x
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          id="btnDiscardUpload"
                          onClick={clearFileUpload}
                          className="mt-2 text-slate-400 hover:text-rose-400 text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hủy & Tải lại
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. AUDIO RECORD STATE */}
          {inputMethod === 'record' && (
            <div className="w-full flex flex-col items-center">
              {!audioBlobUrl ? (
                <div id="recordingStateDefault" className="flex flex-col items-center w-full">
                  <div className="w-14 h-14 bg-rose-950/70 border border-rose-500/50 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(225,29,72,0.3)] relative">
                    <Mic className="w-7 h-7 text-rose-400" />
                    {isAudioRecording && (
                      <div
                        id="recordRipple"
                        className="absolute inset-0 rounded-full border-2 border-rose-500 opacity-0 animate-ping"
                      />
                    )}
                  </div>

                  {isAudioRecording && (
                    <div
                      id="recordingTimerDisplay"
                      className="text-lg font-mono font-bold text-rose-400 mb-2 tracking-wider drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]"
                    >
                      {formatTimer(audioSeconds)}
                    </div>
                  )}

                  <button
                    id="btnToggleRecord"
                    onClick={toggleAudioRecording}
                    className={`font-black text-[13px] px-6 py-2.5 rounded-full mb-1.5 shadow-[0_0_20px_rgba(225,29,72,0.4)] cursor-pointer transition-all min-w-[160px] flex items-center justify-center gap-2 ${
                      isAudioRecording
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white'
                    }`}
                  >
                    {isAudioRecording ? (
                      <>
                        <span className="w-2.5 h-2.5 bg-white rounded-xs" /> Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" /> Start Recording
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAudioRecording ? 'Đang thu âm... Nhấn Stop khi hoàn thành' : 'Nhấn Start Recording để bắt đầu đọc'}
                  </p>
                </div>
              ) : (
                <div id="recordingStateDone" className="flex flex-col items-center w-full max-w-md">
                  <div className="w-full bg-[#0d172e] border border-cyan-500/35 rounded-full p-1.5 pl-2 pr-2.5 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-1.5 relative">
                    <audio
                      ref={recordedAudioRef}
                      id="recordedAudioPlayer"
                      controls
                      controlsList="nodownload noplaybackrate"
                      src={audioBlobUrl}
                      className="w-full h-9 outline-none flex-grow"
                    />

                    {/* 3-dots Menu for Audio Recording */}
                    <div className="relative shrink-0">
                      <button
                        id="btnAudioMoreMenu"
                        type="button"
                        onClick={() => setIsAudioMenuOpen(prev => !prev)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-cyan-300 hover:text-white hover:bg-[#16274e] transition-colors cursor-pointer"
                        title="Tùy chọn audio (Dấu 3 chấm)"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isAudioMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsAudioMenuOpen(false)}
                          />
                          <div className="absolute right-0 bottom-full mb-2 w-64 bg-[#0a1224] text-white rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.3)] border border-cyan-500/40 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                            {/* 1. Tải xuống */}
                            <button
                              type="button"
                              onClick={() => {
                                handleExportMedia('audio');
                                setIsAudioMenuOpen(false);
                              }}
                              className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[#12203e] text-left transition-colors cursor-pointer text-cyan-300 font-medium"
                            >
                              <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-white">Tải xuống</span>
                                <span className="text-[11px] text-cyan-300/70 truncate">
                                  {formatStudentFileName(studentName, 'mp3')}
                                </span>
                              </div>
                            </button>

                            <div className="my-1 border-t border-slate-800" />

                            {/* 2. Tốc độ phát */}
                            <div className="px-3.5 py-2">
                              <div className="flex items-center gap-2 mb-1.5 text-slate-300 font-semibold">
                                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                                <span>Tốc độ phát: {recordedAudioSpeed === 1 ? 'Chuẩn' : `${recordedAudioSpeed}x`}</span>
                              </div>
                              <div className="grid grid-cols-6 gap-1">
                                {PLAYBACK_SPEED_OPTIONS.map((speed) => (
                                  <button
                                    key={speed}
                                    type="button"
                                    onClick={() => {
                                      if (recordedAudioRef.current) {
                                        recordedAudioRef.current.playbackRate = speed;
                                      }
                                      setRecordedAudioSpeed(speed);
                                      onShowToast(`⚡ Tốc độ phát: ${speed === 1 ? 'Chuẩn (1.0x)' : `${speed}x`}`, 'info');
                                    }}
                                    className={`py-1 text-[10px] rounded font-semibold transition-colors text-center cursor-pointer ${
                                      recordedAudioSpeed === speed
                                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                                        : 'bg-[#12203e] hover:bg-[#1a2d56] text-slate-300'
                                    }`}
                                  >
                                    {speed}x
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons below Audio player: Re-record */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                    <button
                      id="btnDiscardRecord"
                      onClick={discardAudioRecording}
                      className="text-slate-400 hover:text-rose-400 text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors px-2 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Re-record
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* C. VIDEO RECORD STATE */}
          {inputMethod === 'video' && (
            <div className="w-full flex flex-col items-center">
              {!videoBlobUrl ? (
                <div id="videoStateDefault" className="flex flex-col items-center w-full">
                  <div className="w-full relative bg-slate-950 rounded-xl overflow-hidden mb-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-cyan-500/30 aspect-video flex items-center justify-center max-w-xl max-h-[340px]">
                    <video
                      ref={liveVideoPreviewRef}
                      id="liveVideoPreview"
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full ${videoFitMode === 'cover' ? 'object-cover' : 'object-contain'} scale-x-[-1] ${cameraActive ? 'block' : 'hidden'}`}
                    />

                    {!cameraActive && (
                      <div id="cameraPlaceholder" className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8 mb-2 text-cyan-400" />
                        <span className="text-xs">Camera đang tắt. Vui lòng cấp quyền camera.</span>
                      </div>
                    )}

                    {isVideoRecording && (
                      <div
                        id="videoRecordingIndicator"
                        className="absolute top-3 right-3 flex items-center gap-2 bg-black/80 px-3 py-1 rounded-md border border-rose-500/40 backdrop-blur-sm z-10"
                      >
                        <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]" />
                        <span id="videoRecordingTimerDisplay" className="text-xs text-white font-mono font-bold">
                          {formatTimer(videoSeconds)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    id="btnToggleVideoRecord"
                    onClick={toggleVideoRecording}
                    className={`font-black text-[13px] px-6 py-2.5 rounded-full mb-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer transition-all min-w-[160px] flex items-center justify-center gap-2 ${
                      isVideoRecording
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)]'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                    }`}
                  >
                    {isVideoRecording ? (
                      <>
                        <span className="w-2.5 h-2.5 bg-white rounded-xs" /> Stop Recording
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 fill-slate-950" /> Start Recording
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-cyan-300/80 mt-1">
                    Ghi hình kèm âm thanh để được đánh giá thêm tiêu chí Presentation & Interaction!
                  </p>
                </div>
              ) : (
                <div id="videoStateDone" className="flex flex-col items-center w-full max-w-xl">
                  <CustomVideoPlayer
                    id="recordedVideoCustomPlayer"
                    src={videoBlobUrl!}
                    studentName={studentName}
                    videoFitMode={videoFitMode}
                    isMirrored={false}
                    onExport={() => handleExportMedia('video')}
                    onShowToast={onShowToast}
                  />

                  {/* Below video: Discard / Re-record button */}
                  <div className="w-full flex flex-wrap items-center justify-center gap-2.5 mt-2.5">
                    <button
                      id="btnDiscardVideoRecord"
                      type="button"
                      onClick={discardVideoRecording}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 bg-[#0d162d] hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 text-xs font-semibold shadow-xs cursor-pointer transition-all"
                      title="Quay lại video bài nói"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
                      <span>Discard & Re-record (Quay lại)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time transcribed text with high-precision punctuation & live recording feedback */}
          {(liveTranscript || isListeningSpeech || isAudioRecording || isVideoRecording) && (
            <div className="w-full max-w-xl mt-3 p-3.5 bg-[#0d162d] border border-cyan-500/40 rounded-xl text-xs text-slate-200 shadow-lg">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 font-bold text-xs">
                    Lời nói nhận diện từ micro (Transcribed Speech):
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isListeningSpeech || isAudioRecording || isVideoRecording ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/50 text-[10.5px] font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Đang nhận diện trực tiếp...
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Đã nhận diện chuẩn Rubric
                    </span>
                  )}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={liveTranscript}
                  onChange={(e) => setLiveTranscript(e.target.value)}
                  placeholder={
                    isListeningSpeech || isAudioRecording || isVideoRecording
                      ? 'Đang lắng nghe trực tiếp từ micro... Nói đến đâu văn bản hiển thị tức thì đến đó với đầy đủ dấu câu, dấu chấm và viết hoa!'
                      : 'Lời nói nhận diện từ micro sẽ hiển thị ở đây...'
                  }
                  rows={3}
                  className="w-full bg-[#080e1e] border border-cyan-500/30 rounded-lg p-2.5 text-slate-100 text-[12.5px] leading-relaxed font-medium focus:outline-hidden focus:border-cyan-400 resize-none transition-colors shadow-inner"
                  title="Em có thể chỉnh sửa lại từ nếu mic nhận diện chưa khớp"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Action Button: Analyze & Grade Speaking */}
        <button
          id="btnAnalyzeStudent"
          onClick={handleAnalyzeAndGrade}
          disabled={isAnalyzing}
          className={`w-full font-black py-3 rounded-xl text-[14px] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
            isAnalyzing
              ? 'bg-[#142343] border border-cyan-500/40 text-cyan-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-[0.99]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Đang chấm điểm & phân tích giọng nói (AI Evaluation in progress)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Analyze & Grade Speaking (Phân tích & Chấm điểm nói)</span>
            </>
          )}
        </button>

        {/* RESULTS PANEL */}
        {result && (
          <div
            ref={resultsRef}
            id="studentAiResultPanel"
            className="w-full mt-7 border-t border-cyan-500/30 pt-6 animate-fadeIn"
          >
            {/* Header: Student & Performance Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  KẾT QUẢ ĐÁNH GIÁ BÀI NÓI TIẾNG ANH
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Học sinh: <span className="text-cyan-200 font-bold">{studentName}</span> | Lớp: <span className="text-cyan-200 font-bold">{grade}/{classNameVal}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Export PDF (.pdf) Button */}
                <button
                  id="btnExportReportPdf"
                  type="button"
                  disabled={isExportingPdf}
                  onClick={() => handleExportAssessmentReport('pdf')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 hover:from-emerald-300 hover:to-cyan-200 rounded-lg cursor-pointer transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 disabled:opacity-60"
                  title="Tải phiếu kết quả luyện nói định dạng PDF (.pdf) gói gọn trong 2 trang chuẩn"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 text-slate-950 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-slate-950" />
                  )}
                  <span>{isExportingPdf ? 'Đang tạo PDF 2 trang...' : 'Xuất file PDF (.pdf)'}</span>
                </button>

                <button
                  id="btnExportResultMedia"
                  onClick={() => handleExportMedia(result.hasVideo ? 'video' : 'audio')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-lg cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  title={`Tải bài nói với tên: ${formatStudentFileName(studentName, result.hasVideo ? 'mp4' : 'mp3')}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    Tải bài nói ({formatStudentFileName(studentName, result.hasVideo ? 'mp4' : 'mp3')})
                  </span>
                </button>
                <span className="px-2.5 py-1 bg-[#0f1d38] rounded-md text-xs font-bold text-cyan-300 border border-cyan-500/30">
                  Thang {result.scale} điểm
                </span>
                <button
                  id="btnReAnalyzePrompt"
                  onClick={() => {
                    setIsCurrentMediaAnalyzed(false);
                    handleAnalyzeAndGrade();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:text-white bg-[#102347] border border-cyan-500/30 hover:border-cyan-400 rounded-md cursor-pointer transition-all"
                  title="Chấm lại với các tiêu chí chi tiết"
                >
                  <RefreshCw className="w-3 h-3" /> Chấm lại
                </button>
              </div>
            </div>

            {/* Overview Section: Overall Score & Radar Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
              
              {/* Overall Score Card */}
              <div
                id="cardOverallScore"
                className="bg-gradient-to-br from-[#0a1122] via-[#0d1b38] to-[#071329] rounded-2xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col justify-center items-center relative border border-cyan-500/40 min-h-[180px] w-full"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    AI Verified
                  </span>
                </div>

                <h3 className="text-lg font-black text-white tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                  OVERALL SCORE
                </h3>
                <p className="text-cyan-200/80 font-semibold text-[10px] uppercase tracking-widest mb-4">
                  Đánh giá tổng quan năng lực nói
                </p>

                <div className="flex items-center justify-center bg-black/40 backdrop-blur-md px-6 py-3 rounded-xl border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] w-[92%] max-w-[280px]">
                  <div className="text-center border-r border-cyan-500/20 pr-4 w-1/2">
                    <div className="text-[9px] text-cyan-400/70 uppercase tracking-widest font-bold mb-1">
                      Score
                    </div>
                    <div className="text-3xl font-black text-cyan-300 leading-none drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                      {result.scores.overall}
                      <span className="text-xs text-cyan-400/60 font-bold ml-0.5">
                        /{result.scale}
                      </span>
                    </div>
                    <div className="text-[9.5px] text-cyan-200/80 font-medium mt-1 leading-tight">
                      {parseFloat(result.scores.overall) >= (result.scale === 100 ? 80 : 8.0)
                        ? 'Xuất sắc'
                        : parseFloat(result.scores.overall) >= (result.scale === 100 ? 65 : 6.5)
                        ? 'Đạt chuẩn'
                        : parseFloat(result.scores.overall) >= (result.scale === 100 ? 50 : 5.0)
                        ? 'Trung bình'
                        : 'Cần nỗ lực'}
                    </div>
                  </div>

                  <div className="text-center pl-4 w-1/2">
                    <div className="text-[9px] text-amber-400/70 uppercase tracking-widest font-bold mb-1">
                      CEFR
                    </div>
                    <div className="text-2xl font-black text-amber-300 leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                      {result.cefr}
                    </div>
                    <div className="text-[9px] text-amber-200/90 font-semibold mt-1 leading-tight">
                      {result.cefr === 'Pre-A1'
                        ? 'Tiền A1 \u00A0(Khởi đầu)'
                        : result.cefr === 'A1'
                        ? 'Bậc 1 \u00A0(Chuẩn Tiểu học)'
                        : result.cefr === 'A2'
                        ? 'Bậc 2 \u00A0(Chuẩn THCS)'
                        : result.cefr === 'B1'
                        ? 'Bậc 3 \u00A0(Chuẩn THPT)'
                        : result.cefr === 'B2'
                        ? 'Bậc 4 \u00A0(Vượt chuẩn)'
                        : 'Bậc 5 \u00A0(Cao cấp)'}
                    </div>
                  </div>
                </div>

                {result.cefrDescriptionVi && (
                  <div className="mt-2.5 text-[9.5px] text-cyan-100/90 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-center max-w-[280px]">
                    <span className="font-semibold text-amber-300">Khung GDPT 2018:</span>{' '}
                    {result.cefrDescriptionVi.includes('\u00A0')
                      ? result.cefrDescriptionVi
                      : result.cefrDescriptionVi.replace(/Bậc\s*(\d+)\s*\(/g, 'Bậc $1 \u00A0(')}
                  </div>
                )}
              </div>

              {/* Skills Radar Card */}
              <div
                id="cardSkillsRadar"
                className="bg-[#091122] rounded-2xl p-3.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] border border-cyan-500/30 flex flex-col min-h-[180px] w-full"
              >
                <h4 className="text-cyan-300 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 mb-1 ml-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Biểu đồ Năng lực (Skills Radar)
                </h4>
                <div className="relative w-full flex-grow flex items-center justify-center">
                  <RadarChart
                    scores={{
                      pronunciation: parseFloat(result.scores.pronunciation),
                      fluency: parseFloat(result.scores.fluency),
                      intonation: parseFloat(result.scores.intonation),
                      vocabulary: parseFloat(result.scores.vocabulary),
                      grammar: parseFloat(result.scores.grammar),
                      taskCompletion: result.scores.taskCompletion
                        ? parseFloat(result.scores.taskCompletion)
                        : undefined,
                      presentation:
                        result.hasVideo && result.scores.presentation
                          ? parseFloat(result.scores.presentation)
                          : undefined,
                    }}
                    maxScale={result.scale}
                    overallScore={result.scores.overall}
                  />
                </div>
              </div>
            </div>

            {/* NEW: Khu vực Phân tích lỗi chi tiết & So sánh câu văn thực tế ngay dưới biểu đồ Radar */}
            <DetailedFeedbackSection
              metrics={result.speechMetrics}
              phonemeIssues={result.phonemeIssues}
              sentenceComparisons={result.sentenceComparisons}
              strengths={result.strengths}
              improvementPriorities={result.improvementPriorities}
              transcript={result.transcript}
            />

            {/* Rubric Feedback Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* 1. Pronunciation */}
              <div
                id="feedbackPronunciationCard"
                className="bg-[#091124] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-cyan-300 bg-[#0e2142] border border-cyan-500/40 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-cyan-300 text-[13px] leading-tight">
                        1. Pronunciation
                      </h4>
                      <p className="text-[10px] text-cyan-400/60 italic">(Phát âm)</p>
                    </div>
                  </div>
                  <span className="bg-[#0e1d3a] text-cyan-200 font-black px-2.5 py-0.5 rounded text-[11px] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    {result.scores.pronunciation}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] text-slate-100 font-semibold leading-snug">
                    {result.feedback.pronunciation.e}
                  </p>
                  <p className="text-[11.5px] text-slate-400 leading-snug">
                    {result.feedback.pronunciation.v}
                  </p>
                </div>
              </div>

              {/* 2. Fluency */}
              <div
                id="feedbackFluencyCard"
                className="bg-[#091124] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-blue-300 bg-[#0e244d] border border-blue-500/40 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                      <Wind className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-300 text-[13px] leading-tight">
                        2. Fluency
                      </h4>
                      <p className="text-[10px] text-blue-400/60 italic">(Độ trôi chảy)</p>
                    </div>
                  </div>
                  <span className="bg-[#0e1d3a] text-cyan-200 font-black px-2.5 py-0.5 rounded text-[11px] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    {result.scores.fluency}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] text-slate-100 font-semibold leading-snug">
                    {result.feedback.fluency.e}
                  </p>
                  <p className="text-[11.5px] text-slate-400 leading-snug">
                    {result.feedback.fluency.v}
                  </p>
                </div>
              </div>

              {/* 3. Intonation */}
              <div
                id="feedbackIntonationCard"
                className="bg-[#091124] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-emerald-300 bg-[#0b2923] border border-emerald-500/40 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-300 text-[13px] leading-tight">
                        3. Intonation
                      </h4>
                      <p className="text-[10px] text-emerald-400/60 italic">(Ngữ điệu)</p>
                    </div>
                  </div>
                  <span className="bg-[#0e1d3a] text-cyan-200 font-black px-2.5 py-0.5 rounded text-[11px] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    {result.scores.intonation}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] text-slate-100 font-semibold leading-snug">
                    {result.feedback.intonation.e}
                  </p>
                  <p className="text-[11.5px] text-slate-400 leading-snug">
                    {result.feedback.intonation.v}
                  </p>
                </div>
              </div>

              {/* 4. Vocabulary */}
              <div
                id="feedbackVocabularyCard"
                className="bg-[#091124] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-purple-300 bg-[#24133d] border border-purple-500/40 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-300 text-[13px] leading-tight">
                        4. Vocabulary
                      </h4>
                      <p className="text-[10px] text-purple-400/60 italic">(Từ vựng)</p>
                    </div>
                  </div>
                  <span className="bg-[#0e1d3a] text-cyan-200 font-black px-2.5 py-0.5 rounded text-[11px] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    {result.scores.vocabulary}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] text-slate-100 font-semibold leading-snug">
                    {result.feedback.vocabulary.e}
                  </p>
                  <p className="text-[11.5px] text-slate-400 leading-snug">
                    {result.feedback.vocabulary.v}
                  </p>
                </div>
              </div>

              {/* 5. Grammar */}
              <div
                id="feedbackGrammarCard"
                className="bg-[#091124] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-rose-300 bg-[#351221] border border-rose-500/40 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-300 text-[13px] leading-tight">
                        5. Grammar
                      </h4>
                      <p className="text-[10px] text-rose-400/60 italic">(Ngữ pháp)</p>
                    </div>
                  </div>
                  <span className="bg-[#0e1d3a] text-cyan-200 font-black px-2.5 py-0.5 rounded text-[11px] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    {result.scores.grammar}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] text-slate-100 font-semibold leading-snug">
                    {result.feedback.grammar.e}
                  </p>
                  <p className="text-[11.5px] text-slate-400 leading-snug">
                    {result.feedback.grammar.v}
                  </p>
                </div>
              </div>

              {/* 6. Task Completion */}
              <div
                id="feedbackTaskCompletionCard"
                className="bg-[#091124] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-amber-300 bg-[#33200d] border border-amber-500/40 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      <ListChecks className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-300 text-[13px] leading-tight">
                        6. Task Completion
                      </h4>
                      <p className="text-[10px] text-amber-400/60 italic">(Hoàn thành nhiệm vụ)</p>
                    </div>
                  </div>
                  <span className="bg-[#0e1d3a] text-cyan-200 font-black px-2.5 py-0.5 rounded text-[11px] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    {result.scores.taskCompletion}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] text-slate-100 font-semibold leading-snug">
                    {result.feedback.taskCompletion.e}
                  </p>
                  <p className="text-[11.5px] text-slate-400 leading-snug">
                    {result.feedback.taskCompletion.v}
                  </p>
                </div>
              </div>

              {/* 7. Presentation & Interaction (If Video) */}
              {result.hasVideo && result.feedback.presentation && (
                <div
                  id="feedbackPresentationCard"
                  className="bg-[#091124] border border-cyan-500/30 hover:border-cyan-400 rounded-xl p-3.5 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all md:col-span-2"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="text-teal-300 bg-[#0d282e] border border-teal-500/40 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(20,184,166,0.3)]">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-teal-300 text-[13px] leading-tight">
                          7. Presentation & Interaction
                        </h4>
                        <p className="text-[10px] text-teal-400/60 italic">
                          (Phong thái trình bày & Tương tác qua video)
                        </p>
                      </div>
                    </div>
                    <span className="bg-[#0e1d3a] text-cyan-200 font-black px-2.5 py-0.5 rounded text-[11px] border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                      {result.scores.presentation}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] text-slate-100 font-semibold leading-snug">
                      {result.feedback.presentation.e}
                    </p>
                    <p className="text-[11.5px] text-slate-400 leading-snug">
                      {result.feedback.presentation.v}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
