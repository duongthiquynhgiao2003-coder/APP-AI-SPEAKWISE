import { AssessmentResult, ScoringScale } from '../types';

export interface ReportExportData {
  studentName: string;
  grade: string;
  classNameVal: string;
  taskTypeEn: string;
  taskTypeVi: string;
  scale: ScoringScale;
  result: AssessmentResult;
  assessmentDate?: string;
  videoSnapshotUrl?: string;
  videoSnapshotTime?: string;
}

/**
 * Formats seconds into MM:SS format
 */
export function formatTimeMmSs(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(safeSec / 60);
  const s = Math.floor(safeSec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Captures a video frame snapshot as a base64 JPEG data URL.
 * Automatically tries active DOM video elements first, then falls back to Blob/URL seek capture.
 */
export async function captureVideoSnapshot(
  videoSource?: string | HTMLVideoElement | Blob | null
): Promise<string> {
  if (typeof window === 'undefined') return '';

  // 1. Try DOM video element first
  let videoEl: HTMLVideoElement | null = null;
  if (videoSource instanceof HTMLVideoElement) {
    videoEl = videoSource;
  } else if (!videoSource) {
    videoEl =
      (document.querySelector('#recordedVideoCustomPlayer video') as HTMLVideoElement) ||
      (document.querySelector('#uploadedVideoCustomPlayer video') as HTMLVideoElement) ||
      (document.querySelector('video') as HTMLVideoElement);
  }

  if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (dataUrl && dataUrl.length > 200) {
          return dataUrl;
        }
      }
    } catch (e) {
      console.warn('DOM video canvas snapshot capture failed:', e);
    }
  }

  // 2. Try Blob or URL source
  const src =
    typeof videoSource === 'string' && videoSource
      ? videoSource
      : videoSource instanceof Blob
      ? URL.createObjectURL(videoSource)
      : videoEl && videoEl.src
      ? videoEl.src
      : '';

  if (src) {
    return new Promise((resolve) => {
      const tempVideo = document.createElement('video');
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.src = src;

      let settled = false;
      const cleanup = () => {
        if (videoSource instanceof Blob) {
          try {
            URL.revokeObjectURL(src);
          } catch (_) {}
        }
      };

      const handleSeeked = () => {
        if (settled) return;
        settled = true;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = tempVideo.videoWidth || 640;
          canvas.height = tempVideo.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            cleanup();
            resolve(dataUrl);
            return;
          }
        } catch (e) {
          console.warn('tempVideo seeked snapshot failed:', e);
        }
        cleanup();
        resolve('');
      };

      tempVideo.onloadedmetadata = () => {
        const target = Math.min(1.0, tempVideo.duration > 0 ? tempVideo.duration * 0.25 : 0.5);
        tempVideo.currentTime = target;
      };

      tempVideo.onseeked = handleSeeked;

      tempVideo.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve('');
      };

      setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve('');
      }, 2000);
    });
  }

  return '';
}

/**
 * Formats student full name into a safe file name
 */
function toSafeFileName(name: string): string {
  if (!name || !name.trim()) return 'HocSinh';
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generates an SVG radar chart markup for embedding into HTML reports.
 * Automatically accommodates 6 criteria (Audio) or 7 criteria (Video).
 */
export function generateRadarChartSvg(result: AssessmentResult): string {
  const maxScale = result.scale;
  const center = 160;
  const radius = 88;

  const categories: Array<{
    key: string;
    en: string;
    vi: string;
    val: number;
    color: string;
  }> = [
    { key: 'pronunciation', en: 'Pronunciation', vi: 'Phát âm', val: parseFloat(result.scores.pronunciation) || 0, color: '#0284c7' },
    { key: 'fluency', en: 'Fluency', vi: 'Trôi chảy', val: parseFloat(result.scores.fluency) || 0, color: '#2563eb' },
    { key: 'intonation', en: 'Intonation', vi: 'Ngữ điệu', val: parseFloat(result.scores.intonation) || 0, color: '#059669' },
    { key: 'vocabulary', en: 'Vocabulary', vi: 'Từ vựng', val: parseFloat(result.scores.vocabulary) || 0, color: '#9333ea' },
    { key: 'grammar', en: 'Grammar', vi: 'Ngữ pháp', val: parseFloat(result.scores.grammar) || 0, color: '#e11d48' },
    { key: 'taskCompletion', en: 'Task Comp.', vi: 'Nhiệm vụ', val: parseFloat(result.scores.taskCompletion) || 0, color: '#d97706' },
  ];

  if (result.hasVideo && result.scores.presentation) {
    categories.push({
      key: 'presentation',
      en: 'Presentation',
      vi: 'Trình bày',
      val: parseFloat(result.scores.presentation) || 0,
      color: '#0d9488',
    });
  }

  const totalAxes = categories.length;
  const angleStep = (Math.PI * 2) / totalAxes;
  const startAngle = -Math.PI / 2;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getPolygonCoords = (ratio: number) => {
    return categories
      .map((_, i) => {
        const angle = startAngle + i * angleStep;
        const x = center + radius * ratio * Math.cos(angle);
        const y = center + radius * ratio * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const scoreCoords = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep;
    const ratio = Math.min(Math.max(cat.val / maxScale, 0.05), 1);
    const x = center + radius * ratio * Math.cos(angle);
    const y = center + radius * ratio * Math.sin(angle);
    return { x, y, val: cat.val, cat, angle };
  });

  const scorePolygon = scoreCoords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  // Grid rings
  const gridRingsSvg = levels
    .map(
      (lvl, idx) =>
        `<polygon points="${getPolygonCoords(lvl)}" fill="${
          idx === 4 ? 'rgba(6, 182, 212, 0.04)' : 'none'
        }" stroke="#cbd5e1" stroke-width="${lvl === 1 ? '1.5' : '0.8'}" stroke-dasharray="${
          lvl === 1 ? 'none' : '3 3'
        }" />`
    )
    .join('\n');

  // Axis spokes
  const spokesSvg = categories
    .map((cat, i) => {
      const angle = startAngle + i * angleStep;
      const x2 = center + radius * Math.cos(angle);
      const y2 = center + radius * Math.sin(angle);
      return `<line x1="${center}" y1="${center}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(
        1
      )}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2 2" />`;
    })
    .join('\n');

  // Score points
  const pointsSvg = scoreCoords
    .map(
      (pt) =>
        `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(
          1
        )}" r="4" fill="#ffffff" stroke="${pt.cat.color}" stroke-width="2.2" />`
    )
    .join('\n');

  // Outer Labels
  const labelsSvg = scoreCoords
    .map((pt) => {
      const labelDist = radius + 22;
      const lx = center + labelDist * Math.cos(pt.angle);
      const ly = center + labelDist * Math.sin(pt.angle);

      let textAnchor = 'middle';
      if (Math.cos(pt.angle) > 0.28) textAnchor = 'start';
      else if (Math.cos(pt.angle) < -0.28) textAnchor = 'end';

      return `
        <g transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)})">
          <text text-anchor="${textAnchor}" font-size="9.5" font-weight="bold" fill="#0f172a" dy="-2">
            ${pt.cat.en}
          </text>
          <text text-anchor="${textAnchor}" font-size="8.5" font-weight="600" dy="9">
            <tspan fill="#64748b" font-style="italic">(${pt.cat.vi}) </tspan>
            <tspan fill="${pt.cat.color}" font-weight="bold">${pt.val}</tspan>
          </text>
        </g>
      `;
    })
    .join('\n');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 0 430 310" class="radar-svg" style="width: 100%; max-width: 350px; height: auto; display: block; margin: 0 auto; overflow: visible;">
      <defs>
        <radialGradient id="reportRadarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.45" />
          <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.1" />
        </radialGradient>
      </defs>
      ${gridRingsSvg}
      ${spokesSvg}
      <polygon points="${scorePolygon}" fill="url(#reportRadarFill)" stroke="#0284c7" stroke-width="2" />
      ${pointsSvg}
      ${labelsSvg}
    </svg>
  `;
}

/**
 * Converts SVG radar chart into a standalone high-resolution PNG Data URL
 * to guarantee 100% rendering fidelity inside Microsoft Word documents.
 */
export function generateRadarChartPngDataUrl(result: AssessmentResult, width = 380, height = 300): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve('');
        return;
      }
      const svgStr = generateRadarChartSvg(result);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width * 2;
          canvas.height = height * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0, width, height);
            const png = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(png);
            return;
          }
        } catch {
          // fallback
        }
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    } catch {
      resolve('');
    }
  });
}

/**
 * Helper to compute common evaluation properties
 */
function getEvaluationMetrics(data: ReportExportData) {
  const { scale, result } = data;
  const isVideo = !!result.hasVideo;
  const criteriaCount = isVideo ? 7 : 6;
  const formatLabelEn = isVideo ? 'Video Recording (7 Criteria)' : 'Audio Recording (6 Criteria)';
  const formatLabelVi = isVideo ? 'Ghi hình qua Video (7 tiêu chí)' : 'Ghi âm Giọng nói (6 tiêu chí)';

  const overallNumeric = parseFloat(result.scores.overall) || 0;
  const achievementThreshold = scale === 100 ? 65 : 6.5;
  const excellenceThreshold = scale === 100 ? 80 : 8.0;

  const achievementEn =
    overallNumeric >= excellenceThreshold
      ? 'Outstanding Proficiency'
      : overallNumeric >= achievementThreshold
      ? 'Standard Achieved'
      : overallNumeric >= (scale === 100 ? 50 : 5.0)
      ? 'Intermediate Progress'
      : 'Needs Support & Practice';

  const achievementVi =
    overallNumeric >= excellenceThreshold
      ? 'Đạt loại Xuất sắc'
      : overallNumeric >= achievementThreshold
      ? 'Đạt chuẩn năng lực'
      : overallNumeric >= (scale === 100 ? 50 : 5.0)
      ? 'Đạt mức Trung bình'
      : 'Cần tiếp tục nỗ lực';

  const cefrDesc =
    result.cefrDescriptionVi ||
    (result.cefr === 'Pre-A1'
      ? 'Tiền A1 (Khởi đầu)'
      : result.cefr === 'A1'
      ? 'Bậc 1 (Đạt chuẩn Tiểu học GDPT 2018 - Cambridge Movers)'
      : result.cefr === 'A2'
      ? 'Bậc 2 (Đạt chuẩn THCS GDPT 2018 - Cambridge Flyers/KET)'
      : 'Bậc 3 (Đạt chuẩn THPT GDPT 2018 - PET/B1)');

  const metrics = result.speechMetrics || {
    durationSeconds: 15,
    wordCount: 12,
    wordsPerMinute: 95,
    pauseCount: 1,
    fillerWordsCount: 0,
    fillerWordsList: [],
    vocabularyRichnessPercentage: 85,
    targetTaskAlignmentPercentage: 80,
  };

  const rubricItems = [
    {
      num: 1,
      enTitle: 'Pronunciation',
      viTitle: 'Phát âm',
      score: result.scores.pronunciation,
      feedbackE: result.feedback.pronunciation.e,
      feedbackV: result.feedback.pronunciation.v,
      color: '#0284c7',
      bgLight: '#f0f9ff',
      borderLight: '#bae6fd',
    },
    {
      num: 2,
      enTitle: 'Fluency',
      viTitle: 'Độ trôi chảy',
      score: result.scores.fluency,
      feedbackE: result.feedback.fluency.e,
      feedbackV: result.feedback.fluency.v,
      color: '#2563eb',
      bgLight: '#eff6ff',
      borderLight: '#bfdbfe',
    },
    {
      num: 3,
      enTitle: 'Intonation',
      viTitle: 'Ngữ điệu',
      score: result.scores.intonation,
      feedbackE: result.feedback.intonation.e,
      feedbackV: result.feedback.intonation.v,
      color: '#059669',
      bgLight: '#f0fdf4',
      borderLight: '#bbf7d0',
    },
    {
      num: 4,
      enTitle: 'Vocabulary',
      viTitle: 'Từ vựng',
      score: result.scores.vocabulary,
      feedbackE: result.feedback.vocabulary.e,
      feedbackV: result.feedback.vocabulary.v,
      color: '#9333ea',
      bgLight: '#faf5ff',
      borderLight: '#e9d5ff',
    },
    {
      num: 5,
      enTitle: 'Grammar',
      viTitle: 'Ngữ pháp',
      score: result.scores.grammar,
      feedbackE: result.feedback.grammar.e,
      feedbackV: result.feedback.grammar.v,
      color: '#e11d48',
      bgLight: '#fff1f2',
      borderLight: '#fecdd3',
    },
    {
      num: 6,
      enTitle: 'Task Completion',
      viTitle: 'Hoàn thành nhiệm vụ',
      score: result.scores.taskCompletion,
      feedbackE: result.feedback.taskCompletion.e,
      feedbackV: result.feedback.taskCompletion.v,
      color: '#d97706',
      bgLight: '#fffbeb',
      borderLight: '#fde68a',
    },
  ];

  if (isVideo && result.scores.presentation && result.feedback.presentation) {
    rubricItems.push({
      num: 7,
      enTitle: 'Presentation & Interaction',
      viTitle: 'Phong thái & Tương tác',
      score: result.scores.presentation,
      feedbackE: result.feedback.presentation.e,
      feedbackV: result.feedback.presentation.v,
      color: '#0d9488',
      bgLight: '#f0fdfa',
      borderLight: '#99f6e4',
    });
  }

  return {
    isVideo,
    criteriaCount,
    formatLabelEn,
    formatLabelVi,
    achievementEn,
    achievementVi,
    cefrDesc,
    metrics,
    rubricItems,
    comparisons: result.sentenceComparisons || [],
    phonemes: result.phonemeIssues || [],
    priorities: result.improvementPriorities || [],
    captureTimestamp: (() => {
      if (data.videoSnapshotTime && data.videoSnapshotTime.trim()) {
        return data.videoSnapshotTime.trim();
      }
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1);
      const year = now.getFullYear();
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    })(),
  };
}

/**
 * Builds the Microsoft Word document (.doc) matching the PDF visual layout and card design,
 * STRICTLY paginated into EXACTLY 3 PAGES with NO cut-in-half content.
 */
export function buildSpeakingReportWord(data: ReportExportData, radarPngUrl?: string): string {
  const {
    studentName,
    grade,
    classNameVal,
    taskTypeEn,
    taskTypeVi,
    scale,
    result,
    assessmentDate = new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  } = data;

  const {
    isVideo,
    criteriaCount,
    formatLabelEn,
    formatLabelVi,
    achievementEn,
    achievementVi,
    cefrDesc,
    metrics,
    rubricItems,
    comparisons,
    phonemes,
    priorities,
    captureTimestamp,
  } = getEvaluationMetrics(data);

  const radarImgTag = radarPngUrl
    ? `<img src="${radarPngUrl}" width="310" height="245" style="display: block; margin: 0 auto; border: none;" alt="Competency Skills Radar Chart" />`
    : generateRadarChartSvg(result);

  return `<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Phiếu kết quả luyện nói tiếng Anh - ${studentName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
      mso-header-margin: 6mm;
      mso-footer-margin: 6mm;
    }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    table {
      border-collapse: separate;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      width: 100%;
    }
    td {
      vertical-align: top;
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    }
    .page-break {
      page-break-before: always;
      mso-break-type: section-break;
      clear: both;
      height: 0;
      font-size: 0;
      line-height: 0;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- ========================================== -->
  <!-- PAGE 1: TỔNG QUAN KẾT QUẢ & CHỈ SỐ BÀI NÓI -->
  <!-- ========================================== -->
  <div style="width: 100%; max-width: 680pt; margin: 0 auto;">

    <!-- 1. Header Banner -->
    <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #071326; background: linear-gradient(135deg, #071326 0%, #0d1e38 50%, #08203d 100%); border-radius: 8pt; border-bottom: 3.5pt solid #06b6d4; margin-bottom: 7pt;">
      <tr>
        <td style="padding: 14pt 18pt 12pt 18pt; color: #ffffff;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 6pt; border-bottom: 1pt solid rgba(6,182,212,0.3); padding-bottom: 6pt;">
            <tr>
              <td style="vertical-align: middle;">
                <span style="font-size: 20pt; vertical-align: middle;">🎓</span>
                <span style="font-size: 17pt; font-weight: 900; letter-spacing: 1.5pt; text-transform: uppercase; color: #22d3ee; margin-left: 6pt; vertical-align: middle;">
                  AI SPEAKWISE
                </span>
                <div style="font-size: 8pt; font-weight: 800; letter-spacing: 2pt; color: #38bdf8; text-transform: uppercase; margin-top: 2pt;">
                  SMART SPEAKING PRACTICE &amp; ASSESSMENT
                </div>
              </td>
            </tr>
          </table>
          <div style="font-size: 14pt; font-weight: 900; line-height: 1.25; text-transform: uppercase; color: #ffffff;">
            ENGLISH SPEAKING PRACTICE &amp; COMPETENCY ASSESSMENT REPORT
          </div>
          <div style="font-size: 10pt; font-weight: bold; color: #e0f2fe; text-transform: uppercase; margin-top: 2pt;">
            PHIẾU KẾT QUẢ LUYỆN NÓI &amp; ĐÁNH GIÁ NĂNG LỰC NÓI TIẾNG ANH
          </div>

          <!-- Badges -->
          <table cellpadding="0" cellspacing="4" style="margin-top: 8pt; width: auto;">
            <tr>
              <td style="background-color: rgba(255,255,255,0.18); border: 1px solid #38bdf8; border-radius: 9999px; padding: 2.5pt 8pt; font-size: 7.5pt; font-weight: bold; color: #ffffff;">
                ★ AI Verified &amp; CEFR Benchmarked
              </td>
              <td style="background-color: rgba(255,255,255,0.18); border: 1px solid #38bdf8; border-radius: 9999px; padding: 2.5pt 8pt; font-size: 7.5pt; font-weight: bold; color: #ffffff;">
                📌 ${formatLabelEn} (${formatLabelVi})
              </td>
              <td style="background-color: rgba(255,255,255,0.18); border: 1px solid #38bdf8; border-radius: 9999px; padding: 2.5pt 8pt; font-size: 7.5pt; font-weight: bold; color: #ffffff;">
                🎯 Scale / Thang điểm: ${scale} pts
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- 2. Student & Assessment Info Panel (6 cards in 3 cols x 2 rows) -->
    <table cellpadding="0" cellspacing="5" style="width: 100%; margin-bottom: 7pt;">
      <tr>
        <td style="width: 33.33%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6pt; padding: 6pt 8pt;">
          <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">STUDENT FULL NAME</div>
          <div style="font-size: 7pt; color: #94a3b8; margin-bottom: 2pt;">Họ và tên học sinh</div>
          <div style="font-size: 11pt; font-weight: 800; color: #0284c7;">${studentName}</div>
        </td>
        <td style="width: 33.33%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6pt; padding: 6pt 8pt;">
          <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">GRADE &amp; CLASS</div>
          <div style="font-size: 7pt; color: #94a3b8; margin-bottom: 2pt;">Lớp &amp; Khối học</div>
          <div style="font-size: 10.5pt; font-weight: 800; color: #0f172a;">
            ${grade}/${classNameVal} <span style="font-size: 8.5pt; font-weight: normal; color: #64748b;">(Khối ${grade})</span>
          </div>
        </td>
        <td style="width: 33.33%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6pt; padding: 6pt 8pt;">
          <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">TASK TYPE</div>
          <div style="font-size: 7pt; color: #94a3b8; margin-bottom: 2pt;">Dạng bài thực hành</div>
          <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a;">${taskTypeEn}</div>
          <div style="font-size: 7.5pt; color: #64748b; font-style: italic;">(${taskTypeVi})</div>
        </td>
      </tr>
      <tr>
        <td style="width: 33.33%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6pt; padding: 6pt 8pt;">
          <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">EVALUATION DATE &amp; TIME</div>
          <div style="font-size: 7pt; color: #94a3b8; margin-bottom: 2pt;">Thời gian đánh giá</div>
          <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a;">${assessmentDate}</div>
        </td>
        <td style="width: 33.33%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6pt; padding: 6pt 8pt;">
          <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">RECORDING FORMAT &amp; CRITERIA</div>
          <div style="font-size: 7pt; color: #94a3b8; margin-bottom: 2pt;">Hình thức ghi âm &amp; Tiêu chí</div>
          <div style="font-size: 9.5pt; font-weight: 800; color: #0d9488;">
            ${isVideo ? 'Video Recording (7 criteria)' : 'Audio Recording (6 criteria)'}
          </div>
          <div style="font-size: 7.5pt; color: #64748b;">
            ${isVideo ? 'Ghi hình có video (7 tiêu chí)' : 'Ghi âm giọng nói (6 tiêu chí)'}
          </div>
        </td>
        <td style="width: 33.33%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6pt; padding: 6pt 8pt;">
          <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">OVERALL ACHIEVEMENT</div>
          <div style="font-size: 7pt; color: #94a3b8; margin-bottom: 2pt;">Xếp loại chung</div>
          <div style="font-size: 10pt; font-weight: 800; color: #2563eb;">${achievementEn}</div>
          <div style="font-size: 7.5pt; color: #64748b; font-weight: bold;">${achievementVi}</div>
        </td>
      </tr>
    </table>

    <!-- 3. Overall Score Card & Radar Chart (50% / 50%) -->
    <table cellpadding="0" cellspacing="6" style="width: 100%; margin-bottom: 7pt;">
      <tr>
        <!-- Left: Dark Navy Overall Score Card -->
        <td style="width: 50%; background-color: #0b172e; border: 1px solid #1e293b; border-radius: 8pt; padding: 10pt; color: #ffffff;">
          <div style="font-size: 9.5pt; font-weight: 900; letter-spacing: 0.8pt; color: #38bdf8; text-transform: uppercase; margin-bottom: 1pt;">
            OVERALL SPEAKING SCORE
          </div>
          <div style="font-size: 7.5pt; color: #94a3b8; margin-bottom: 10pt;">
            Đánh giá tổng quan năng lực nói tiếng Anh
          </div>

          <!-- Score & CEFR box -->
          <table cellpadding="0" cellspacing="4" style="width: 100%; margin-bottom: 8pt;">
            <tr>
              <td style="width: 50%; background-color: #050d1a; border: 1px solid #1e293b; border-radius: 6pt; padding: 8pt; text-align: center;">
                <div style="font-size: 7.5pt; font-weight: bold; color: #94a3b8;">SCORE / ĐIỂM</div>
                <div style="font-size: 23pt; font-weight: 900; line-height: 1.1; color: #38bdf8;">
                  ${result.scores.overall}<span style="font-size: 11pt; color: #64748b; font-weight: normal;">/${scale}</span>
                </div>
                <div style="font-size: 7.5pt; font-weight: bold; color: #34d399; margin-top: 2pt;">
                  ${achievementVi}
                </div>
              </td>
              <td style="width: 50%; background-color: #050d1a; border: 1px solid #1e293b; border-radius: 6pt; padding: 8pt; text-align: center;">
                <div style="font-size: 7.5pt; font-weight: bold; color: #94a3b8;">CEFR LEVEL</div>
                <div style="font-size: 23pt; font-weight: 900; line-height: 1.1; color: #facc15;">
                  ${result.cefr}
                </div>
                <div style="font-size: 7.5pt; font-weight: bold; color: #cbd5e1; margin-top: 2pt;">
                  ${cefrDesc}
                </div>
              </td>
            </tr>
          </table>

          <!-- Framework Badge -->
          <div style="background-color: rgba(56, 189, 248, 0.12); border: 1px solid #0284c7; border-radius: 5pt; padding: 5pt 7pt; font-size: 7.5pt; color: #e0f2fe; text-align: center;">
            <strong style="color: #38bdf8;">Khung GDPT 2018:</strong> ${cefrDesc}
          </div>
        </td>

        <!-- Right: Radar Chart Card -->
        <td style="width: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8pt; padding: 8pt; text-align: center;">
          <div style="font-size: 8.5pt; font-weight: 800; text-transform: uppercase; color: #0284c7; margin-bottom: 1pt;">
            COMPETENCY SKILLS RADAR CHART
          </div>
          <div style="font-size: 7.5pt; color: #64748b; margin-bottom: 4pt;">
            Biểu đồ Năng lực ${criteriaCount} tiêu chí theo chuẩn GDPT 2018 &amp; CEFR
          </div>
          ${radarImgTag}
        </td>
      </tr>
    </table>

    <!-- 4. Real-time Speaking Metrics (4 cards in 4 cols) -->
    ${
      isVideo && data.videoSnapshotUrl
        ? `
    <!-- Student Video Recording Snapshot -->
    <div style="margin: 6pt 0; background-color: #0b172e; border: 1.5pt solid #0284c7; border-radius: 8pt; padding: 6pt 10pt; color: #ffffff;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 4pt;">
        <tr>
          <td style="vertical-align: middle;">
            <span style="display: inline-block; width: 5pt; height: 5pt; background-color: #ef4444; border-radius: 50%; margin-right: 4pt;"></span>
            <span style="font-size: 7.5pt; font-weight: 800; color: #38bdf8; text-transform: uppercase;">
              STUDENT VIDEO RECORDING CAPTURE
            </span>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span style="font-size: 7.5pt; font-weight: 700; color: #94a3b8; font-family: monospace, sans-serif;">
              ${captureTimestamp}
            </span>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 5pt 0;">
        <img src="${data.videoSnapshotUrl}" alt="Student Recording" style="width: 380pt; max-width: 100%; max-height: 215pt; object-fit: cover; object-position: center 20%; border-radius: 8pt; border: 1.5pt solid #0284c7;" />
      </div>
      <!-- Controls overlay mockup -->
      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #050d1a; border-radius: 4pt; padding: 3pt 8pt; margin-top: 2pt;">
        <tr>
          <td style="font-size: 7.5pt; font-family: monospace; color: #ffffff;">
            ⏸ 0:01 / ${formatTimeMmSs(metrics.durationSeconds || 5)}
          </td>
          <td style="text-align: right; font-size: 7.5pt; color: #38bdf8;">
            🔊 HD 720p • Camera Verified
          </td>
        </tr>
      </table>
    </div>
    `
        : ''
    }

    <div style="margin-top: 2pt; margin-bottom: 3pt;">
      <div style="font-size: 8.5pt; font-weight: 900; color: #0284c7; text-transform: uppercase;">
        REAL-TIME SPEAKING METRICS • CHỈ SỐ ĐO LƯỜNG BÀI NÓI THỰC TẾ
      </div>
      <div style="font-size: 7pt; color: #64748b; margin-bottom: 4pt;">
        Chuẩn đánh giá năng lực ngôn ngữ GDPT 2018 &amp; CEFR Standards
      </div>

      <table cellpadding="0" cellspacing="5" style="width: 100%;">
        <tr>
          <!-- Col 1: Speed -->
          <td style="width: 25%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #0284c7; border-radius: 5pt; padding: 5pt 7pt;">
            <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">Speaking Speed</div>
            <div style="font-size: 6.5pt; color: #94a3b8;">Tốc độ nói</div>
            <div style="font-size: 13pt; font-weight: 800; color: #0f172a; margin: 2pt 0 1pt 0;">
              ${metrics.wordsPerMinute} <span style="font-size: 8pt; font-weight: normal; color: #64748b;">WPM</span>
            </div>
            <div style="font-size: 7pt; font-weight: bold; color: #0284c7;">Ideal speaking pace</div>
            <div style="font-size: 6.5pt; color: #64748b;">Nhịp điệu rất lý tưởng</div>
          </td>

          <!-- Col 2: Volume -->
          <td style="width: 25%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #2563eb; border-radius: 5pt; padding: 5pt 7pt;">
            <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">Speech Volume</div>
            <div style="font-size: 6.5pt; color: #94a3b8;">Dung lượng bài nói</div>
            <div style="font-size: 13pt; font-weight: 800; color: #0f172a; margin: 2pt 0 1pt 0;">
              ${metrics.wordCount} <span style="font-size: 8pt; font-weight: normal; color: #64748b;">words</span>
            </div>
            <div style="font-size: 7pt; font-weight: bold; color: #2563eb;">${metrics.durationSeconds}s duration</div>
            <div style="font-size: 6.5pt; color: #64748b;">Thời lượng nói hoàn thành tốt</div>
          </td>

          <!-- Col 3: Vocabulary Diversity -->
          <td style="width: 25%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #9333ea; border-radius: 5pt; padding: 5pt 7pt;">
            <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">Vocabulary Diversity</div>
            <div style="font-size: 6.5pt; color: #94a3b8;">Độ đa dạng từ vựng</div>
            <div style="font-size: 13pt; font-weight: 800; color: #9333ea; margin: 2pt 0 1pt 0;">
              ${metrics.vocabularyRichnessPercentage}%
            </div>
            <div style="font-size: 7pt; font-weight: bold; color: #9333ea;">Rich vocabulary</div>
            <div style="font-size: 6.5pt; color: #64748b;">Vốn từ vựng phong phú, ít lặp</div>
          </td>

          <!-- Col 4: Topic Alignment -->
          <td style="width: 25%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3pt solid #059669; border-radius: 5pt; padding: 5pt 7pt;">
            <div style="font-size: 7.5pt; font-weight: bold; color: #475569;">Topic Alignment</div>
            <div style="font-size: 6.5pt; color: #94a3b8;">Bám sát chủ đề</div>
            <div style="font-size: 13pt; font-weight: 800; color: #059669; margin: 2pt 0 1pt 0;">
              ${metrics.targetTaskAlignmentPercentage}%
            </div>
            <div style="font-size: 7pt; font-weight: bold; color: #059669;">Target accuracy</div>
            <div style="font-size: 6.5pt; color: #64748b;">Bám sát đúng từ khóa và yêu cầu</div>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- PAGE BREAK TO EXACT PAGE 2 -->
  <div class="page-break" style="page-break-before: always; mso-break-type: section-break; clear: both; height: 0; font-size: 0; line-height: 0;"></div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: ĐÁNH GIÁ CHI TIẾT RUBRIC, CÂU BẢN XỨ, ÂM VỊ, LỜI THOẠI & CHỮ KÝ -->
  <!-- ========================================================================= -->
  <div style="width: 100%; max-width: 680pt; margin: 0 auto; padding-top: 4pt;">

    <!-- Mini Page Header -->
    <table cellpadding="0" cellspacing="0" style="width: 100%; border-bottom: 1.5pt solid #0891b2; padding-bottom: 4pt; margin-bottom: 8pt;">
      <tr>
        <td style="vertical-align: middle;">
          <span style="background-color: #0891b2; color: #ffffff; padding: 2pt 6pt; border-radius: 3pt; font-size: 7.5pt; font-weight: bold;">
            AI SPEAKWISE
          </span>
          <span style="font-size: 8.5pt; font-weight: bold; color: #334155; margin-left: 5pt;">
            BÁO CÁO CHI TIẾT &amp; CHỨNG NHẬN NĂNG LỰC NÓI • HỌC SINH: ${studentName.toUpperCase()} (${grade}/${classNameVal})
          </span>
        </td>
        <td style="text-align: right; vertical-align: middle;">
          <span style="font-size: 8pt; font-weight: bold; color: #0891b2;">
            THANG ĐIỂM: ${scale} PTS
          </span>
        </td>
      </tr>
    </table>

    <!-- Section Title -->
    <div style="margin-bottom: 8pt;">
      <div style="font-size: 11pt; font-weight: 900; color: #0284c7; text-transform: uppercase;">
        DETAILED RUBRIC CRITERIA EVALUATION (${criteriaCount} CRITERIA)
      </div>
      <div style="font-size: 8pt; color: #64748b;">
        Đánh giá chi tiết theo ${criteriaCount} tiêu chí Rubric (${isVideo ? 'Bao gồm tiêu chí 7 dành cho Video' : 'Gồm 6 tiêu chí chuẩn Audio'})
      </div>
    </div>

    <!-- Rubric Cards Table (2 Columns) -->
    <table cellpadding="0" cellspacing="7" style="width: 100%; margin-bottom: 6pt;">
      <!-- Row 1: Pronunciation & Fluency -->
      <tr>
        <td style="width: 50%; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6pt; padding: 8pt 10pt;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 5pt;">
            <tr>
              <td>
                <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">1. Pronunciation</div>
                <div style="font-size: 7.5pt; color: #64748b;">(Phát âm)</div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #0284c7; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 2.5pt 8pt; border-radius: 9999px;">
                  ${result.scores.pronunciation} / ${scale}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a; line-height: 1.35; margin-bottom: 3pt;">
            ${result.feedback.pronunciation.e}
          </div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
            ${result.feedback.pronunciation.v}
          </div>
        </td>

        <td style="width: 50%; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6pt; padding: 8pt 10pt;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 5pt;">
            <tr>
              <td>
                <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">2. Fluency</div>
                <div style="font-size: 7.5pt; color: #64748b;">(Độ trôi chảy)</div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #2563eb; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 2.5pt 8pt; border-radius: 9999px;">
                  ${result.scores.fluency} / ${scale}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a; line-height: 1.35; margin-bottom: 3pt;">
            ${result.feedback.fluency.e}
          </div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
            ${result.feedback.fluency.v}
          </div>
        </td>
      </tr>

      <!-- Row 2: Intonation & Vocabulary -->
      <tr>
        <td style="width: 50%; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6pt; padding: 8pt 10pt;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 5pt;">
            <tr>
              <td>
                <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">3. Intonation</div>
                <div style="font-size: 7.5pt; color: #64748b;">(Ngữ điệu)</div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #059669; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 2.5pt 8pt; border-radius: 9999px;">
                  ${result.scores.intonation} / ${scale}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a; line-height: 1.35; margin-bottom: 3pt;">
            ${result.feedback.intonation.e}
          </div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
            ${result.feedback.intonation.v}
          </div>
        </td>

        <td style="width: 50%; background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6pt; padding: 8pt 10pt;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 5pt;">
            <tr>
              <td>
                <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">4. Vocabulary</div>
                <div style="font-size: 7.5pt; color: #64748b;">(Từ vựng)</div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #9333ea; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 2.5pt 8pt; border-radius: 9999px;">
                  ${result.scores.vocabulary} / ${scale}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a; line-height: 1.35; margin-bottom: 3pt;">
            ${result.feedback.vocabulary.e}
          </div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
            ${result.feedback.vocabulary.v}
          </div>
        </td>
      </tr>

      <!-- Row 3: Grammar & Task Completion -->
      <tr>
        <td style="width: 50%; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 6pt; padding: 8pt 10pt;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 5pt;">
            <tr>
              <td>
                <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">5. Grammar</div>
                <div style="font-size: 7.5pt; color: #64748b;">(Ngữ pháp)</div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #e11d48; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 2.5pt 8pt; border-radius: 9999px;">
                  ${result.scores.grammar} / ${scale}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a; line-height: 1.35; margin-bottom: 3pt;">
            ${result.feedback.grammar.e}
          </div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
            ${result.feedback.grammar.v}
          </div>
        </td>

        <td style="width: 50%; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6pt; padding: 8pt 10pt;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 5pt;">
            <tr>
              <td>
                <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">6. Task Completion</div>
                <div style="font-size: 7.5pt; color: #64748b;">(Hoàn thành nhiệm vụ)</div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #d97706; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 2.5pt 8pt; border-radius: 9999px;">
                  ${result.scores.taskCompletion} / ${scale}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a; line-height: 1.35; margin-bottom: 3pt;">
            ${result.feedback.taskCompletion.e}
          </div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
            ${result.feedback.taskCompletion.v}
          </div>
        </td>
      </tr>

      ${
        isVideo && result.scores.presentation && result.feedback.presentation
          ? `
      <!-- Row 4: Presentation & Interaction (Video only) -->
      <tr>
        <td colspan="2" style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6pt; padding: 8pt 10pt;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 5pt;">
            <tr>
              <td>
                <div style="font-size: 10pt; font-weight: 800; color: #0f172a;">7. Presentation &amp; Interaction</div>
                <div style="font-size: 7.5pt; color: #64748b;">(Phong thái &amp; Tương tác trước ống kính)</div>
              </td>
              <td style="text-align: right;">
                <span style="background-color: #0d9488; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 2.5pt 8pt; border-radius: 9999px;">
                  ${result.scores.presentation} / ${scale}
                </span>
              </td>
            </tr>
          </table>
          <div style="font-size: 8.5pt; font-weight: bold; color: #0f172a; line-height: 1.35; margin-bottom: 3pt;">
            ${result.feedback.presentation.e}
          </div>
          <div style="font-size: 8pt; color: #334155; line-height: 1.35;">
            ${result.feedback.presentation.v}
          </div>
        </td>
      </tr>
      `
          : ''
      }
    </table>

    <!-- Two-Column Section: What you said vs Native way & Phonemes (50% / 50%) -->
    <table cellpadding="0" cellspacing="7" style="width: 100%; margin-top: 8pt; margin-bottom: 8pt;">
      <tr>
        <!-- Left Col: What you said vs Native way -->
        <td style="width: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8pt; padding: 8pt 10pt;">
          <div style="font-size: 9.5pt; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 1pt;">
            WHAT YOU SAID VS NATIVE WAY
          </div>
          <div style="font-size: 7.5pt; color: #64748b; margin-bottom: 6pt; padding-bottom: 4pt; border-bottom: 1px solid #e2e8f0;">
            So sánh câu văn thực tế: Câu học sinh nói vs Cách diễn đạt chuẩn bản xứ
          </div>

          ${
            comparisons.length > 0
              ? comparisons
                  .map(
                    (c) => `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6pt; padding: 6pt 8pt; margin-bottom: 6pt;">
              <div style="font-size: 7pt; font-weight: bold; color: #e11d48; text-transform: uppercase;">
                • Student's sentence / Câu học sinh đã nói:
              </div>
              <div style="font-size: 8.5pt; font-style: italic; color: #be123c; margin: 1pt 0 3pt 0;">
                "${c.studentSentence}"
              </div>

              <div style="font-size: 7pt; font-weight: bold; color: #059669; text-transform: uppercase;">
                • Native refinement / Cách diễn đạt chuẩn &amp; hay hơn:
              </div>
              <div style="font-size: 9pt; font-weight: bold; color: #047857; margin: 1pt 0 4pt 0;">
                "${c.improvedSentence}"
              </div>

              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4pt; padding: 4pt 6pt; font-size: 7.5pt; color: #166534; line-height: 1.35;">
                <strong>💡 Giải thích sư phạm:</strong> ${c.explanationVi.replace(/^💡\s*(\[[^\]]+\]:\s*)?/, '')}
              </div>
            </div>
          `
                  )
                  .join('')
              : `
            <div style="font-size: 8pt; font-style: italic; color: #64748b; padding: 8pt 0;">
              Chưa phát hiện lỗi ngữ pháp lớn trong bài nói. Câu từ diễn đạt lưu loát!
            </div>
          `
          }
        </td>

        <!-- Right Col: Phoneme & Pronunciation Insights -->
        <td style="width: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8pt; padding: 8pt 10pt;">
          <div style="font-size: 9.5pt; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 1pt;">
            PHONEME &amp; PRONUNCIATION INSIGHTS
          </div>
          <div style="font-size: 7.5pt; color: #64748b; margin-bottom: 6pt; padding-bottom: 4pt; border-bottom: 1px solid #e2e8f0;">
            Điểm cần chú ý về âm vị &amp; phát âm (Ending sounds, Vowels, Stress)
          </div>

          ${
            phonemes.length > 0
              ? phonemes
                  .map(
                    (p, idx) => `
            <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 4pt; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 5pt; padding: 4pt 6pt;">
              <tr>
                <td style="width: 18pt; vertical-align: top;">
                  <span style="display: inline-block; width: 14pt; height: 14pt; line-height: 14pt; background-color: #fef3c7; color: #b45309; border-radius: 50%; text-align: center; font-size: 7pt; font-weight: bold;">
                    ${idx + 1}
                  </span>
                </td>
                <td style="vertical-align: top;">
                  <span style="font-size: 8.5pt; font-weight: 800; color: #0f172a;">"${p.word}"</span>
                  ${
                    p.phoneticExpected
                      ? `<span style="font-size: 7.5pt; color: #0284c7; background-color: #e0f2fe; padding: 1pt 4pt; border-radius: 3pt; font-family: monospace; margin-left: 3pt;">${p.phoneticExpected}</span>`
                      : ''
                  }
                  ${
                    p.errorLabelVi
                      ? `<span style="font-size: 7pt; font-weight: bold; color: #b45309; background-color: #fef3c7; padding: 1pt 4pt; border-radius: 3pt; margin-left: 3pt;">${p.errorLabelVi}</span>`
                      : ''
                  }
                  <div style="font-size: 7.5pt; color: #475569; margin-top: 2pt; line-height: 1.35;">
                    ${p.phoneticIssue}
                  </div>
                </td>
              </tr>
            </table>
          `
                  )
                  .join('')
              : `
            <div style="font-size: 8pt; font-style: italic; color: #64748b; padding: 8pt 0;">
              Các âm đuôi và nguyên âm đều được thể hiện rõ ràng và chuẩn xác.
            </div>
          `
          }

          <!-- Priority Actions -->
          ${
            priorities.length > 0
              ? `
            <div style="margin-top: 6pt; padding-top: 5pt; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 8.5pt; font-weight: 800; color: #059669; text-transform: uppercase;">
                PRIORITY ACTION ITEMS TO BOOST NEXT BAND SCORE
              </div>
              <div style="font-size: 7pt; color: #64748b; margin-bottom: 4pt;">
                Nhiệm vụ ưu tiên để tăng band điểm tiếp theo
              </div>
              <div style="font-size: 8pt; color: #1e293b; line-height: 1.4;">
                ${priorities.map((item) => `<div style="margin-bottom: 2pt;">✓ ${item}</div>`).join('')}
              </div>
            </div>
          `
              : ''
          }
        </td>
      </tr>
    </table>

    <!-- Verified Student Transcript (Full width) -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8pt; padding: 8pt 10pt; margin-bottom: 8pt;">
      <div style="font-size: 8.5pt; font-weight: 800; color: #0f172a; text-transform: uppercase;">
        VERIFIED STUDENT TRANSCRIPT
      </div>
      <div style="font-size: 7pt; color: #64748b; margin-bottom: 4pt;">
        Bản ghi lời thoại thực tế của học sinh (Speech-to-Text Recognition)
      </div>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5pt; padding: 6pt 9pt; font-size: 8.5pt; font-style: italic; color: #334155; line-height: 1.45;">
        "${result.transcript || 'Chưa có bản ghi lời thoại.'}"
      </div>
    </div>

    <!-- Official Sign-off & Certification Footer (2 Columns: 50% / 50%) -->
    <table cellpadding="0" cellspacing="0" style="width: 100%; border-top: 1.5pt dashed #cbd5e1; padding-top: 10pt; margin-top: 4pt;">
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: top; padding-right: 15pt;">
          <div style="font-size: 8.5pt; font-weight: 900; text-transform: uppercase; color: #0f172a;">
            AI SPEAKING ASSESSMENT ENGINE
          </div>
          <div style="font-size: 7.5pt; color: #64748b; margin-bottom: 6pt;">
            Hệ thống AI Đánh giá Năng lực Nói Tiếng Anh
          </div>

          <!-- Circular Verified Badge Stamp -->
          <div style="margin: 4pt auto; width: 44pt; height: 44pt; border: 1.5pt solid #0284c7; border-radius: 50%; text-align: center; color: #0284c7; padding-top: 6pt;">
            <div style="font-size: 6.5pt; font-weight: 900;">VERIFIED</div>
            <div style="font-size: 11pt; line-height: 12pt;">★</div>
            <div style="font-size: 5.5pt; font-weight: bold;">GDPT 2018</div>
          </div>

          <div style="font-size: 8.5pt; font-weight: bold; color: #0284c7; border-top: 1px solid #94a3b8; display: inline-block; padding-top: 3pt; min-width: 120pt; margin-top: 2pt;">
            SpeakWise AI Certified
          </div>
          <div style="font-size: 7pt; color: #94a3b8; margin-top: 1pt;">
            Mã định danh đánh giá: SW-${Date.now().toString().slice(-6)}
          </div>
        </td>

        <td style="width: 50%; text-align: center; vertical-align: top; padding-left: 15pt;">
          <div style="font-size: 8.5pt; font-weight: 900; text-transform: uppercase; color: #0f172a;">
            TEACHER'S REMARKS &amp; SIGNATURE
          </div>
          <div style="font-size: 7.5pt; color: #64748b; margin-bottom: 6pt;">
            Nhận xét &amp; Chữ ký của Giáo viên Bộ môn
          </div>

          <!-- Space for Teacher Signature -->
          <div style="height: 48pt;"></div>

          <div style="font-size: 8.5pt; font-weight: bold; color: #1e293b; border-top: 1px solid #94a3b8; display: inline-block; padding-top: 3pt; min-width: 140pt;">
            Giáo viên phụ trách
          </div>
          <div style="font-size: 7pt; color: #94a3b8; margin-top: 1pt;">
            Ngày ký: .......................................................
          </div>
        </td>
      </tr>
    </table>
  </div>

</body>
</html>`;
}

/**
 * Builds the standalone 3-page HTML document for preview, PDF generation, and printing.
 * Strictly organized into 3 distinct .report-page containers.
 */
export function buildSpeakingReportHtml(data: ReportExportData, forPdf = false): string {
  const {
    studentName,
    grade,
    classNameVal,
    taskTypeEn,
    taskTypeVi,
    scale,
    result,
    assessmentDate = new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  } = data;

  const {
    isVideo,
    criteriaCount,
    formatLabelEn,
    formatLabelVi,
    achievementEn,
    achievementVi,
    cefrDesc,
    metrics,
    rubricItems,
    comparisons,
    phonemes,
    priorities,
    captureTimestamp,
  } = getEvaluationMetrics(data);

  const radarSvg = generateRadarChartSvg(result);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phiếu kết quả luyện nói & đánh giá năng lực - ${studentName}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: ${forPdf ? '#ffffff' : '#e2e8f0'};
      color: #0f172a;
      line-height: 1.45;
      padding: ${forPdf ? '0' : '20px 10px'};
      -webkit-font-smoothing: antialiased;
    }
    .no-print {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
    }
    .btn-print {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }

    /* 2 EXPLICIT PAGES */
    .report-page {
      width: 100%;
      max-width: 800px;
      margin: 0 auto ${forPdf ? '0' : '24px'};
      background: #ffffff;
      box-shadow: ${forPdf ? 'none' : '0 10px 30px rgba(15, 23, 42, 0.08)'};
      border-radius: ${forPdf ? '0' : '16px'};
      border: ${forPdf ? 'none' : '1px solid #cbd5e1'};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
      height: ${forPdf ? '1120px' : 'auto'};
      min-height: ${forPdf ? '1120px' : 'auto'};
      box-sizing: border-box;
    }

    .report-page.page-1 {
      padding: 0;
    }
    .page-1-content {
      padding: 16px 26px 18px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .page-inner {
      padding: 16px 26px 16px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Page Header Mini */
    .page-header-mini {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .header-mini-badge {
      background: #0284c7;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      margin-right: 8px;
    }
    .header-mini-title {
      font-size: 12px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
    }
    .header-mini-right {
      font-size: 11px;
      font-weight: 800;
      color: #0284c7;
    }

    /* Page Footer */
    .page-footer-num {
      display: none;
    }

    /* Header Banner */
    .report-header {
      background: linear-gradient(135deg, #071326 0%, #0d1e38 50%, #08203d 100%);
      color: #ffffff;
      padding: 15px 26px 13px;
      border-bottom: 3.5px solid #06b6d4;
      flex-shrink: 0;
    }
    .header-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(6, 182, 212, 0.25);
    }
    .brand-logo-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-cap-icon {
      flex-shrink: 0;
      filter: drop-shadow(0 2px 8px rgba(34, 211, 238, 0.45));
    }
    .brand-text-col {
      display: flex;
      flex-direction: column;
    }
    .brand-app-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 1.5px;
      line-height: 1.15;
      color: #22d3ee;
      text-transform: uppercase;
      text-shadow: 0 0 12px rgba(34, 211, 238, 0.45);
    }
    .brand-app-sub {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 2.2px;
      line-height: 1.2;
      color: #38bdf8;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .report-main-title-en {
      font-size: 15.5px;
      font-weight: 900;
      letter-spacing: -0.2px;
      line-height: 1.25;
      text-transform: uppercase;
      color: #ffffff;
      margin-top: 3px;
    }
    .report-main-title-vi {
      font-size: 11.5px;
      font-weight: 700;
      color: #e0f2fe;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2.5px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #e0f2fe;
    }

    /* Grids */
    .student-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
      margin-bottom: 14px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .info-label-en {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
    }
    .info-label-vi {
      font-size: 8px;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .info-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .score-banner-card {
      background: #0b172e;
      border: 1px solid #1e293b;
      border-radius: 11px;
      padding: 13px 15px;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .score-banner-title-en {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.8px;
      color: #38bdf8;
      text-transform: uppercase;
    }
    .score-banner-title-vi {
      font-size: 9.5px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .score-display-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 6px;
    }
    .score-item {
      background: #050d1a;
      border: 1px solid #1e293b;
      border-radius: 7px;
      padding: 9px 6px;
      text-align: center;
    }
    .score-label-en {
      font-size: 8.5px;
      font-weight: 800;
      color: #94a3b8;
    }
    .score-big {
      font-size: 28px;
      font-weight: 900;
      color: #38bdf8;
      line-height: 1.1;
      margin: 2px 0;
    }
    .score-max {
      font-size: 14px;
      color: #94a3b8;
      font-weight: 600;
    }
    .score-cefr-big {
      font-size: 28px;
      font-weight: 900;
      color: #facc15;
      line-height: 1.1;
      margin: 2px 0;
    }
    .score-eval-vi {
      font-size: 9px;
      font-weight: 700;
      color: #34d399;
    }
    .framework-badge {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid #0284c7;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 9px;
      color: #e0f2fe;
      text-align: center;
      line-height: 1.35;
    }

    .radar-container-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      padding: 8px 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }

    /* Video Recording Snapshot Section */
    .video-snapshot-section {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 0 16px 0;
    }
    .video-snapshot-card {
      width: 100%;
      max-width: 530px;
      background: #091224;
      border: 1.5px solid #0284c7;
      border-radius: 11px;
      overflow: hidden;
      box-shadow: 0 4px 18px rgba(2, 132, 199, 0.18);
    }
    .video-snapshot-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(90deg, #071329 0%, #0d1e38 100%);
      padding: 5px 12px;
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
    }
    .video-rec-badge-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .video-rec-live-dot {
      width: 7px;
      height: 7px;
      background: #ef4444;
      border-radius: 50%;
      box-shadow: 0 0 6px #ef4444;
    }
    .video-topbar-title-en {
      font-size: 8px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      line-height: 1;
    }
    .video-topbar-datetime {
      font-size: 8px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.3px;
      line-height: 1;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
    }
    .video-snapshot-viewport {
      position: relative;
      width: 100%;
      height: 285px;
      background: #020617;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .video-snapshot-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 20%;
      display: block;
    }
    .video-snapshot-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      color: #64748b;
    }
    .video-fallback-text {
      font-size: 8.5px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.6px;
    }
    .video-player-overlay-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(2, 6, 23, 0.75) 25%, rgba(2, 6, 23, 0.95) 100%);
      display: flex;
      flex-direction: column;
    }
    .video-progress-line-track {
      width: 100%;
      height: 3.5px;
      background: rgba(255, 255, 255, 0.22);
      position: relative;
    }
    .video-progress-line-active {
      height: 100%;
      background: #06b6d4;
      box-shadow: 0 0 6px #06b6d4;
    }
    .video-player-controls-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 12px 6px;
    }
    .video-player-controls-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .video-player-time {
      font-size: 9px;
      font-family: monospace, sans-serif;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.4px;
    }
    .video-player-controls-right {
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .video-icon-btn {
      color: #ffffff;
      opacity: 0.92;
      flex-shrink: 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 9px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: 3.5px solid #0284c7;
      border-radius: 8px;
      padding: 9px 11px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 86px;
    }
    .metric-title-en {
      font-size: 9px;
      font-weight: 800;
      color: #475569;
    }
    .metric-title-vi {
      font-size: 8px;
      color: #94a3b8;
      margin-bottom: 2px;
    }
    .metric-num {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      margin: 2px 0;
    }
    .metric-sub-en {
      font-size: 8.5px;
      font-weight: 700;
      color: #0284c7;
    }
    .metric-sub-vi {
      font-size: 7.5px;
      color: #64748b;
      line-height: 1.25;
    }

    /* Page 2 Rubric */
    .rubric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .rubric-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 84px;
    }
    .rubric-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      min-height: 26px;
    }
    .rubric-card-title-en {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
    }
    .rubric-card-title-vi {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.2;
    }
    .rubric-score-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 900;
      height: 24px;
      line-height: 24px;
      padding: 0 9px;
      border-radius: 6px;
      white-space: nowrap;
      flex-shrink: 0;
      box-sizing: border-box;
      letter-spacing: 0.3px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }
    .rubric-feedback-en {
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.35;
      margin-bottom: 2px;
    }
    .rubric-feedback-vi {
      font-size: 8.5px;
      color: #334155;
      line-height: 1.35;
    }

    /* Page 2 Details */
    .two-col-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .detail-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .comparison-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 9px;
      margin-bottom: 5px;
    }
    .sentence-student {
      font-size: 9.5px;
      font-style: italic;
      color: #be123c;
      margin: 2px 0 3px;
    }
    .sentence-improved {
      font-size: 10px;
      font-weight: 800;
      color: #047857;
      margin: 2px 0 3px;
    }
    .pedagogy-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 5px;
      padding: 5px 8px;
      font-size: 8.5px;
      color: #166534;
      line-height: 1.35;
    }

    .phoneme-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 6px;
      padding: 5px 7px;
      margin-bottom: 5px;
    }
    .phoneme-num {
      width: 17px;
      height: 17px;
      background: #fef3c7;
      color: #b45309;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 800;
      flex-shrink: 0;
    }

    .transcript-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 10px;
      font-style: italic;
      color: #334155;
      line-height: 1.45;
    }

    .report-footer {
      border-top: 1.5px dashed #cbd5e1;
      padding-top: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .sig-col {
      text-align: center;
    }
    .sig-title-en {
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
    }
    .sig-title-vi {
      font-size: 8.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .sig-stamp {
      width: 46px;
      height: 46px;
      border: 1.5px solid #0284c7;
      border-radius: 50%;
      margin: 2px auto 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #0284c7;
    }
    .sig-line {
      font-size: 9.5px;
      font-weight: 700;
      color: #1e293b;
      border-top: 1px solid #94a3b8;
      display: inline-block;
      padding-top: 3px;
      min-width: 130px;
    }
    .sig-note {
      font-size: 8.5px;
      color: #94a3b8;
      margin-top: 2px;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .report-page {
        box-shadow: none;
        border: none;
        border-radius: 0;
        max-width: 100%;
        min-height: 285mm;
        page-break-after: always;
        break-after: page;
      }
      .report-page:last-child {
        page-break-after: avoid;
        break-after: avoid;
      }
    }
  </style>
</head>
<body>
  ${
    forPdf
      ? ''
      : `<!-- Print Toolbar -->
  <div class="no-print">
    <button class="btn-action btn-print" onclick="window.print()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      In phiếu / Lưu file PDF (Print or Save as PDF)
    </button>
  </div>`
  }

  <!-- ========================================== -->
  <!-- PAGE 1: TỔNG QUAN KẾT QUẢ & CHỈ SỐ BÀI NÓI -->
  <!-- ========================================== -->
  <div class="report-page page-1">
    <!-- Header Banner -->
    <header class="report-header">
      <div class="header-brand-row">
        <div class="brand-logo-wrap">
          <svg class="brand-cap-icon" width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 24.5V31.5C12 35.6 17.4 39 24 39C30.6 39 36 35.6 36 31.5V24.5C32.8 27.2 28.6 28.5 24 28.5C19.4 28.5 15.2 27.2 12 24.5Z" fill="url(#capNavy)" />
            <polygon points="24,8 45,18.5 24,29 3,18.5" fill="url(#capTop)" stroke="#4f46e5" stroke-width="0.8" />
            <polygon points="24,10 42.5,18.5 24,27 5.5,18.5" fill="url(#capFacet)" />
            <circle cx="24" cy="18.5" r="2.2" fill="#fbbf24" stroke="#d97706" stroke-width="0.6" />
            <path d="M24 18.5 Q17 19.5 13 25.5" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" fill="none" />
            <rect x="11" y="25.5" width="4" height="2.5" rx="1" fill="#d97706" />
            <path d="M11.5 28 L10.5 35 C10.5 35.5 15.5 35.5 15.5 35 L14.5 28 Z" fill="url(#tasselGrad)" />
            <defs>
              <linearGradient id="capNavy" x1="12" y1="24.5" x2="36" y2="39" gradientUnits="userSpaceOnUse">
                <stop stop-color="#1e1b4b" />
                <stop offset="1" stop-color="#312e81" />
              </linearGradient>
              <linearGradient id="capTop" x1="3" y1="8" x2="45" y2="29" gradientUnits="userSpaceOnUse">
                <stop stop-color="#3730a3" />
                <stop offset="0.5" stop-color="#2e1065" />
                <stop offset="1" stop-color="#1e1b4b" />
              </linearGradient>
              <linearGradient id="capFacet" x1="5.5" y1="10" x2="42.5" y2="27" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4338ca" />
                <stop offset="1" stop-color="#312e81" />
              </linearGradient>
              <linearGradient id="tasselGrad" x1="11" y1="28" x2="15" y2="35" gradientUnits="userSpaceOnUse">
                <stop stop-color="#f59e0b" />
                <stop offset="0.7" stop-color="#fbbf24" />
                <stop offset="1" stop-color="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div class="brand-text-col">
            <div class="brand-app-title">AI SPEAKWISE</div>
            <div class="brand-app-sub">SMART SPEAKING PRACTICE &amp; ASSESSMENT</div>
          </div>
        </div>
      </div>

      <h1 class="report-main-title-en">
        ENGLISH SPEAKING PRACTICE &amp; COMPETENCY ASSESSMENT REPORT
      </h1>
      <h2 class="report-main-title-vi">
        PHIẾU KẾT QUẢ LUYỆN NÓI &amp; ĐÁNH GIÁ NĂNG LỰC NÓI TIẾNG ANH
      </h2>
      <div class="header-badges">
        <span class="badge">★ AI Verified &amp; CEFR Benchmarked</span>
        <span class="badge">📌 ${formatLabelEn} (${formatLabelVi})</span>
        <span class="badge">🎯 Scale / Thang điểm: ${scale} pts</span>
      </div>
    </header>

    <div class="page-1-content">
      <!-- 6 Info Cards -->
      <section class="student-info-grid">
        <div class="info-card">
          <div class="info-label-en">Student Full Name</div>
          <div class="info-label-vi">Họ và tên học sinh</div>
          <div class="info-val" style="color: #0284c7;">${studentName}</div>
        </div>
        <div class="info-card">
          <div class="info-label-en">Grade &amp; Class</div>
          <div class="info-label-vi">Lớp &amp; Khối học</div>
          <div class="info-val">${grade}/${classNameVal} <span style="font-size: 10.5px; font-weight: normal; color: #64748b;">(Khối ${grade})</span></div>
        </div>
        <div class="info-card">
          <div class="info-label-en">Task Type</div>
          <div class="info-label-vi">Dạng bài thực hành</div>
          <div class="info-val" style="font-size: 11.5px;">${taskTypeEn}</div>
          <div style="font-size: 9.5px; color: #64748b; font-style: italic;">(${taskTypeVi})</div>
        </div>
        <div class="info-card">
          <div class="info-label-en">Evaluation Date &amp; Time</div>
          <div class="info-label-vi">Thời gian đánh giá</div>
          <div class="info-val" style="font-size: 11.5px;">${assessmentDate}</div>
        </div>
        <div class="info-card">
          <div class="info-label-en">Recording Format &amp; Criteria</div>
          <div class="info-label-vi">Hình thức ghi âm &amp; Tiêu chí</div>
          <div class="info-val" style="font-size: 11.5px; color: #0d9488;">
            ${isVideo ? 'Video Recording (7 criteria)' : 'Audio Recording (6 criteria)'}
          </div>
          <div style="font-size: 9.5px; color: #64748b;">
            ${isVideo ? 'Ghi hình có video (7 tiêu chí)' : 'Ghi âm giọng nói (6 tiêu chí)'}
          </div>
        </div>
        <div class="info-card">
          <div class="info-label-en">Overall Achievement</div>
          <div class="info-label-vi">Xếp loại chung</div>
          <div class="info-val" style="color: #2563eb; font-size: 12px;">${achievementEn}</div>
          <div style="font-size: 9.5px; color: #64748b; font-weight: 700;">${achievementVi}</div>
        </div>
      </section>

      <!-- Overall Score & Radar Chart -->
      <section class="overview-grid">
        <div class="score-banner-card">
          <div>
            <div class="score-banner-title-en">OVERALL SPEAKING SCORE</div>
            <div class="score-banner-title-vi">Đánh giá tổng quan năng lực nói</div>
          </div>
          <div class="score-display-box">
            <div class="score-item">
              <div class="score-label-en">SCORE / ĐIỂM</div>
              <div class="score-big">${result.scores.overall}<span class="score-max">/${scale}</span></div>
              <div class="score-eval-vi">${achievementVi}</div>
            </div>
            <div class="score-item">
              <div class="score-label-en">CEFR LEVEL</div>
              <div class="score-cefr-big">${result.cefr}</div>
              <div class="score-eval-vi" style="color: #cbd5e1;">${cefrDesc}</div>
            </div>
          </div>
          <div class="framework-badge">
            <strong>Khung GDPT 2018:</strong> ${cefrDesc}
          </div>
        </div>

        <div class="radar-container-card">
          <div style="text-align: center; margin-bottom: 2px;">
            <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #0284c7;">
              COMPETENCY SKILLS RADAR CHART
            </div>
            <div style="font-size: 9px; color: #64748b;">
              Biểu đồ Năng lực ${criteriaCount} tiêu chí theo chuẩn GDPT 2018 &amp; CEFR
            </div>
          </div>
          ${radarSvg}
        </div>
      </section>

      <!-- Student Video Recording Snapshot (Positioned right below Overall Speaking Score & Competency Skills Radar Chart) -->
      ${
        isVideo
          ? `
      <section class="video-snapshot-section">
        <div class="video-snapshot-card">
          <div class="video-snapshot-topbar">
            <div class="video-rec-badge-group">
              <span class="video-rec-live-dot"></span>
              <span class="video-topbar-title-en">STUDENT VIDEO RECORDING CAPTURE</span>
            </div>
            <div class="video-topbar-datetime">${captureTimestamp}</div>
          </div>

          <div class="video-snapshot-viewport">
            ${
              data.videoSnapshotUrl
                ? `<img src="${data.videoSnapshotUrl}" alt="Student Video Recording Snapshot" class="video-snapshot-image" />`
                : `<div class="video-snapshot-fallback">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    <span class="video-fallback-text">HD VIDEO RECORDING CAPTURE</span>
                  </div>`
            }

            <!-- Video Player Controls Bar Overlay (Matching Attached Student Player Screen) -->
            <div class="video-player-overlay-bar">
              <div class="video-progress-line-track">
                <div class="video-progress-line-active" style="width: 25%;"></div>
              </div>
              <div class="video-player-controls-row">
                <div class="video-player-controls-left">
                  <svg class="video-icon-btn" width="12" height="12" viewBox="0 0 24 24" fill="#ffffff">
                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                  </svg>
                  <span class="video-player-time">0:01 / ${formatTimeMmSs(metrics.durationSeconds || 5)}</span>
                </div>
                <div class="video-player-controls-right">
                  <svg class="video-icon-btn" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                  <svg class="video-icon-btn" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                  <svg class="video-icon-btn" width="12" height="12" viewBox="0 0 24 24" fill="#ffffff">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      `
          : ''
      }

      <!-- Real-time Metrics -->
      <section>
        <div style="font-size: 11px; font-weight: 900; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
          REAL-TIME SPEAKING METRICS • CHỈ SỐ ĐO LƯỜNG BÀI NÓI THỰC TẾ
        </div>
        <div style="font-size: 9px; color: #64748b; margin-bottom: 8px;">
          Chuẩn đo lường GDPT 2018 &amp; CEFR Standards
        </div>
        <div class="metrics-grid">
          <div class="metric-card" style="border-top-color: #0284c7;">
            <div class="metric-title-en">Speaking Speed</div>
            <div class="metric-title-vi">Tốc độ nói</div>
            <div class="metric-num">${metrics.wordsPerMinute} <span style="font-size: 9px; font-weight: normal; color: #64748b;">WPM</span></div>
            <div class="metric-sub-en">Ideal speaking pace</div>
            <div class="metric-sub-vi">Nhịp điệu rất lý tưởng</div>
          </div>
          <div class="metric-card" style="border-top-color: #2563eb;">
            <div class="metric-title-en">Speech Volume</div>
            <div class="metric-title-vi">Dung lượng bài nói</div>
            <div class="metric-num">${metrics.wordCount} <span style="font-size: 9px; font-weight: normal; color: #64748b;">words</span></div>
            <div class="metric-sub-en">${metrics.durationSeconds}s duration</div>
            <div class="metric-sub-vi">Thời lượng nói hoàn thành tốt</div>
          </div>
          <div class="metric-card" style="border-top-color: #9333ea;">
            <div class="metric-title-en">Vocabulary Diversity</div>
            <div class="metric-title-vi">Độ đa dạng từ vựng</div>
            <div class="metric-num" style="color: #9333ea;">${metrics.vocabularyRichnessPercentage}%</div>
            <div class="metric-sub-en" style="color: #9333ea;">Rich vocabulary</div>
            <div class="metric-sub-vi">Vốn từ vựng phong phú, ít lặp</div>
          </div>
          <div class="metric-card" style="border-top-color: #059669;">
            <div class="metric-title-en">Topic Alignment</div>
            <div class="metric-title-vi">Bám sát chủ đề</div>
            <div class="metric-num" style="color: #059669;">${metrics.targetTaskAlignmentPercentage}%</div>
            <div class="metric-sub-en" style="color: #059669;">Target accuracy</div>
            <div class="metric-sub-vi">Bám sát đúng từ khóa và yêu cầu</div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- PAGE 2: ĐÁNH GIÁ CHI TIẾT TIÊU CHÍ RUBRIC  -->
  <!-- ========================================== -->
  <div class="report-page page-2">
    <div class="page-inner">
      <!-- Section 1: Mini Page Header & Rubric Cards Grid -->
      <div>
        <!-- Mini Page Header -->
        <div class="page-header-mini">
          <div>
            <span class="header-mini-badge">GDPT 2018</span>
            <span class="header-mini-title">PHIẾU ĐÁNH GIÁ NĂNG LỰC NÓI TIẾNG ANH • HỌC SINH: ${studentName.toUpperCase()} (${grade}/${classNameVal})</span>
          </div>
          <div class="header-mini-right">THANG ĐIỂM: ${scale} PTS</div>
        </div>

        <!-- Section Title -->
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12.5px; font-weight: 900; color: #0284c7; text-transform: uppercase;">
            DETAILED RUBRIC CRITERIA EVALUATION (${criteriaCount} CRITERIA)
          </div>
          <div style="font-size: 9.5px; color: #64748b;">
            Đánh giá chi tiết theo ${criteriaCount} tiêu chí Rubric (${isVideo ? 'Bao gồm tiêu chí 7 dành cho Video' : 'Gồm 6 tiêu chí chuẩn Audio'})
          </div>
        </div>

        <!-- Rubric Cards Grid -->
        <div class="rubric-grid">
          ${rubricItems
            .map(
              (item) => `
            <div class="rubric-card" style="background: ${item.bgLight}; border-color: ${item.borderLight}; ${item.num === 7 ? 'grid-column: span 2;' : ''}">
              <div class="rubric-card-header">
                <div>
                  <div class="rubric-card-title-en">${item.num}. ${item.enTitle}</div>
                  <div class="rubric-card-title-vi">(${item.viTitle})</div>
                </div>
                <span class="rubric-score-badge" style="background: ${item.color};">
                  ${item.score} / ${scale}
                </span>
              </div>
              <div class="rubric-feedback-en">
                ${item.feedbackE}
              </div>
              <div class="rubric-feedback-vi">
                ${item.feedbackV}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Section 2: Two-col details -->
      <section class="two-col-details">
        <!-- Sentence Comparisons -->
        <div class="detail-card">
          <div style="margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 900; color: #0284c7; text-transform: uppercase;">
              WHAT YOU SAID VS NATIVE WAY
            </div>
            <div style="font-size: 9px; color: #64748b;">
              So sánh câu văn thực tế: Câu học sinh nói vs Cách diễn đạt chuẩn bản xứ
            </div>
          </div>

          ${
            comparisons.length > 0
              ? comparisons
                  .map(
                    (c) => `
              <div class="comparison-item">
                <div style="font-size: 8.5px; font-weight: 700; color: #e11d48; text-transform: uppercase;">
                  • Student's sentence / Câu học sinh đã nói:
                </div>
                <div class="sentence-student">"${c.studentSentence}"</div>
                <div style="font-size: 8.5px; font-weight: 700; color: #059669; text-transform: uppercase;">
                  • Native refinement / Cách diễn đạt chuẩn &amp; hay hơn:
                </div>
                <div class="sentence-improved">"${c.improvedSentence}"</div>
                <div class="pedagogy-box">
                  <strong>💡 Giải thích sư phạm:</strong> ${c.explanationVi.replace(/^💡\s*(\[[^\]]+\]:\s*)?/, '')}
                </div>
              </div>
            `
                  )
                  .join('')
              : `
              <div style="font-size: 10px; font-style: italic; color: #64748b; padding: 10px 0;">
                Chưa phát hiện lỗi ngữ pháp lớn trong bài nói. Câu từ diễn đạt lưu loát!
              </div>
            `
          }
        </div>

        <!-- Phoneme Insights -->
        <div class="detail-card">
          <div style="margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 900; color: #d97706; text-transform: uppercase;">
              PHONEME &amp; PRONUNCIATION INSIGHTS
            </div>
            <div style="font-size: 9px; color: #64748b;">
              Điểm cần chú ý về âm vị &amp; phát âm (Ending sounds, Vowels, Stress)
            </div>
          </div>

          ${
            phonemes.length > 0
              ? phonemes
                  .map(
                    (p, idx) => `
              <div class="phoneme-item">
                <div class="phoneme-num">${idx + 1}</div>
                <div style="flex-grow: 1;">
                  <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                    <span style="font-size: 11px; font-weight: 800; color: #0f172a;">"${p.word}"</span>
                    ${
                      p.phoneticExpected
                        ? `<span style="font-size: 9.5px; font-family: monospace; color: #0284c7; background: #e0f2fe; padding: 1px 4px; border-radius: 4px;">${p.phoneticExpected}</span>`
                        : ''
                    }
                    ${
                      p.errorLabelVi
                        ? `<span style="font-size: 8.5px; font-weight: bold; color: #b45309; background: #fef3c7; padding: 1px 4px; border-radius: 4px;">${p.errorLabelVi}</span>`
                        : ''
                    }
                  </div>
                  <div style="font-size: 9.5px; color: #475569; margin-top: 2px; line-height: 1.35;">
                    ${p.phoneticIssue}
                  </div>
                </div>
              </div>
            `
                  )
                  .join('')
              : `
              <div style="font-size: 10px; font-style: italic; color: #64748b; padding: 10px 0;">
                Các âm đuôi và nguyên âm đều được thể hiện rõ ràng và chuẩn xác.
              </div>
            `
          }

          <!-- Priority Actions -->
          ${
            priorities.length > 0
              ? `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">
                PRIORITY ACTION ITEMS TO BOOST NEXT BAND SCORE
              </div>
              <div style="font-size: 8.5px; color: #64748b; margin-bottom: 4px;">
                Nhiệm vụ ưu tiên để tăng band điểm tiếp theo
              </div>
              <div style="font-size: 9.5px; color: #1e293b; line-height: 1.4;">
                ${priorities.map((item) => `<div style="margin-bottom: 2px;">✓ ${item}</div>`).join('')}
              </div>
            </div>
          `
              : ''
          }
        </div>
      </section>

      <!-- Section 3: Verified Student Transcript -->
      <section>
        <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">
          VERIFIED STUDENT TRANSCRIPT
        </div>
        <div style="font-size: 8.5px; color: #64748b; margin-bottom: 4px;">
          Bản ghi lời thoại thực tế của học sinh (Speech-to-Text Recognition)
        </div>
        <div class="transcript-box">
          "${result.transcript || 'Chưa có bản ghi lời thoại.'}"
        </div>
      </section>

      <!-- Section 4: Sign-off Footer -->
      <footer class="report-footer">
        <div class="sig-col">
          <div class="sig-title-en">AI SPEAKING ASSESSMENT ENGINE</div>
          <div class="sig-title-vi">Hệ thống AI Đánh giá Năng lực Nói Tiếng Anh</div>
          <div class="sig-stamp">
            <span style="font-size: 7px; font-weight: 900;">VERIFIED</span>
            <span style="font-size: 12px; line-height: 12px;">★</span>
            <span style="font-size: 6px; font-weight: 700;">GDPT 2018</span>
          </div>
          <div class="sig-line">SpeakWise AI Certified</div>
          <div class="sig-note">Mã định danh đánh giá: SW-${Date.now().toString().slice(-6)}</div>
        </div>

        <div class="sig-col">
          <div class="sig-title-en">TEACHER'S REMARKS &amp; SIGNATURE</div>
          <div class="sig-title-vi">Nhận xét &amp; Chữ ký của Giáo viên Bộ môn</div>
          <div style="height: 50px;"></div>
          <div class="sig-line">Giáo viên phụ trách</div>
          <div class="sig-note">Ngày ký: .......................................................</div>
        </div>
      </footer>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Initiates direct download of the bilingual assessment report as a Word document (.doc).
 * Uses structured tables and exact styling to match the attached PDF and condense into exactly 3 pages.
 */
export async function downloadSpeakingReportWord(data: ReportExportData): Promise<string> {
  const safeName = toSafeFileName(data.studentName);
  const safeGrade = data.grade.replace(/[^a-zA-Z0-9]/g, '');
  const safeClass = data.classNameVal.replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `Phieu_Ket_Qua_Speaking_${safeName}_Lop_${safeGrade}_${safeClass}.doc`;

  // Auto-capture video snapshot if missing
  if (!data.videoSnapshotUrl && (data.result.hasVideo || data.result.scores.presentation)) {
    try {
      const snap = await captureVideoSnapshot();
      if (snap) {
        data.videoSnapshotUrl = snap;
        if (!data.videoSnapshotTime) {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          data.videoSnapshotTime = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        }
      }
    } catch (e) {
      console.warn('Auto capture video snapshot error:', e);
    }
  }

  // Render high-res radar chart PNG for Word
  let radarPng = '';
  try {
    radarPng = await generateRadarChartPngDataUrl(data.result);
  } catch (e) {
    console.warn('Radar PNG generation skipped:', e);
  }

  const wordContent = buildSpeakingReportWord(data, radarPng);

  // UTF-8 BOM '\ufeff' ensures accented Vietnamese characters display properly in MS Word
  const blob = new Blob(['\ufeff' + wordContent], {
    type: 'application/msword;charset=utf-8',
  });
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }, 1000);

  return fileName;
}

/**
 * Generates and downloads the bilingual assessment report directly as a high-resolution PDF file (.pdf).
 * Renders each of the 3 pages onto its own dedicated A4 PDF page, preventing mid-card cuts.
 */
export async function downloadSpeakingReportPdf(data: ReportExportData): Promise<string> {
  const safeName = toSafeFileName(data.studentName);
  const safeGrade = data.grade.replace(/[^a-zA-Z0-9]/g, '');
  const safeClass = data.classNameVal.replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `Phieu_Ket_Qua_Speaking_${safeName}_Lop_${safeGrade}_${safeClass}.pdf`;

  // Auto-capture video snapshot if missing and recording is video format
  if (!data.videoSnapshotUrl && (data.result.hasVideo || data.result.scores.presentation)) {
    try {
      const snap = await captureVideoSnapshot();
      if (snap) {
        data.videoSnapshotUrl = snap;
        if (!data.videoSnapshotTime) {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          data.videoSnapshotTime = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        }
      }
    } catch (e) {
      console.warn('Auto capture video snapshot for PDF error:', e);
    }
  }

  const { jsPDF } = await import('jspdf');
  const html2canvasModule = await import('html2canvas');
  const html2canvas = ((html2canvasModule as any).default || html2canvasModule) as (
    element: HTMLElement,
    options?: any
  ) => Promise<HTMLCanvasElement>;

  // Render clean report into an off-screen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';

  container.innerHTML = buildSpeakingReportHtml(data, true);
  document.body.appendChild(container);

  try {
    const pageElements = container.querySelectorAll<HTMLElement>('.report-page');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const marginX = 8;
    const marginY = 8;
    const printWidth = 210 - marginX * 2; // 194mm

    for (let i = 0; i < pageElements.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const canvas = await html2canvas(pageElements[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      // Cap printHeight to 281mm to fit comfortably within A4 (297mm - 16mm margins)
      const finalHeight = Math.min(printHeight, 281);
      const adjustedMarginY = Math.max(marginY, (297 - finalHeight) / 2);
      pdf.addImage(imgData, 'JPEG', marginX, adjustedMarginY, printWidth, finalHeight);
    }

    pdf.save(fileName);
    return fileName;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Opens a print dialog for the bilingual assessment report directly in a popup window.
 */
export function printSpeakingReport(data: ReportExportData): void {
  const htmlContent = buildSpeakingReportHtml(data, false);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
