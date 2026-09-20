import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MoreVertical,
  Download,
  FileDown,
  Gauge,
  PictureInPicture,
} from 'lucide-react';
import { formatStudentFileName } from '../utils';

interface CustomVideoPlayerProps {
  id?: string;
  src: string;
  studentName: string;
  videoFitMode?: 'cover' | 'contain';
  isMirrored?: boolean;
  onExport: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PLAYBACK_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  id = 'customVideoPlayer',
  src,
  studentName,
  videoFitMode = 'contain',
  isMirrored = false,
  onExport,
  onShowToast,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideControlsTimerRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  // Sync duration and metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setCurrentTime(videoRef.current.currentTime || 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Seek bar handler
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Mute / Unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      onShowToast('🔇 Đã tắt âm', 'info');
    } else {
      onShowToast('🔊 Đã bật âm', 'info');
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  // Speed change
  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
    setIsMenuOpen(false);
    onShowToast(`⚡ Tốc độ phát: ${speed === 1 ? 'Chuẩn (1.0x)' : `${speed}x`}`, 'info');
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  // Picture in Picture
  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    setIsMenuOpen(false);
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        onShowToast('Đã thoát chế độ Hình trong video', 'info');
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        onShowToast('Đang phát ở chế độ Hình trong video (PiP)', 'info');
      } else {
        onShowToast('Trình duyệt không hỗ trợ Hình trong video', 'error');
      }
    } catch (e) {
      console.warn('PiP error:', e);
      onShowToast('Không thể bật chế độ Hình trong video', 'error');
    }
  };

  // Auto-hide controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying && !isMenuOpen) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isMenuOpen) {
      setShowControls(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  // Format seconds as mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fileName = formatStudentFileName(studentName, 'mp4');

  return (
    <div
      ref={containerRef}
      id={id}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full relative aspect-video max-h-[340px] rounded-xl overflow-hidden bg-slate-950 shadow-md border border-slate-300 flex items-center justify-center select-none group"
    >
      {/* HTML5 Video Element (Custom Controls, native controls disabled) */}
      <video
        ref={videoRef}
        src={src}
        playsInline
        onClick={togglePlay}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className={`w-full h-full cursor-pointer ${
          videoFitMode === 'cover' ? 'object-cover' : 'object-contain'
        } ${isMirrored ? 'scale-x-[-1]' : ''} outline-none`}
      />

      {/* Central Play/Pause overlay button on click/hover if paused */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-950/70 hover:bg-cyan-600/90 text-white flex items-center justify-center shadow-xl border border-white/20 transition-all transform hover:scale-110 cursor-pointer z-20 backdrop-blur-xs"
          title="Phát video"
        >
          <Play className="w-7 h-7 fill-white translate-x-0.5" />
        </button>
      )}

      {/* Video Control Bar at the bottom */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-200 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-2 px-3 flex flex-col gap-1.5 ${
          showControls || !isPlaying || isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress seek bar */}
        <div className="relative w-full flex items-center h-3 cursor-pointer group/seek">
          <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden group-hover/seek:h-1.5 transition-all">
            <div
              className="h-full bg-cyan-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeekChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Thanh trượt thời gian video"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2 text-white">
          {/* Left: Play/Pause and Time */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Tạm dừng (Space)' : 'Phát video (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              )}
            </button>

            {/* Time display: 0:03 / 0:04 */}
            <div className="text-[11px] font-mono tracking-wide text-slate-200">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-slate-400">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume, Fullscreen, and 3-Dots Menu button */}
          <div className="flex items-center gap-1.5">
            {/* Volume control */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                type="button"
                onClick={toggleMute}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isMuted ? 'Bật âm' : 'Tắt âm'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>

              {showVolumeSlider && (
                <div className="absolute right-8 bottom-0 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg flex items-center shadow-lg animate-in fade-in duration-100">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 accent-cyan-400 cursor-pointer"
                    aria-label="Thanh trượt âm lượng"
                  />
                </div>
              )}
            </div>

            {/* Fullscreen button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ (Esc)' : 'Toàn màn hình (Phóng to)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>

            {/* 3-DOTS BUTTON (RIGHT NEXT TO FULLSCREEN ICON) */}
            <div className="relative">
              <button
                id="btnVideoThreeDotsMenu"
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  isMenuOpen
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'hover:bg-white/20 text-white'
                }`}
                title="Tùy chọn: Tải xuống, Tốc độ phát, Hình trong Video"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* 3-Dots Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    {/* 1. Tải xuống / Xuất file Video */}
                    <button
                      type="button"
                      onClick={() => {
                        onExport();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-800 text-left transition-colors cursor-pointer text-cyan-300 font-medium"
                    >
                      <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-white">Tải video bài nói</span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {fileName}
                        </span>
                      </div>
                    </button>

                    <div className="my-1 border-t border-slate-800" />

                    {/* 2. Tốc độ phát */}
                    <div className="px-3.5 py-2">
                      <div className="flex items-center gap-2 mb-1.5 text-slate-300 font-semibold">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tốc độ phát: {playbackSpeed}x</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {PLAYBACK_SPEED_OPTIONS.map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => handleSpeedChange(speed)}
                            className={`py-1 text-[10px] rounded font-semibold transition-colors text-center cursor-pointer ${
                              playbackSpeed === speed
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="my-1 border-t border-slate-800" />

                    {/* 3. Hình trong Video (Picture-in-Picture) */}
                    <button
                      type="button"
                      onClick={handleTogglePiP}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-800 text-left transition-colors cursor-pointer text-slate-200"
                    >
                      <PictureInPicture className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Hình trong Video</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
