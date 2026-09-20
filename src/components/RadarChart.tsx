import React, { useState } from 'react';

interface RadarChartProps {
  scores: {
    pronunciation: number;
    fluency: number;
    intonation: number;
    vocabulary: number;
    grammar: number;
    taskCompletion?: number;
    presentation?: number;
  };
  maxScale: number;
  overallScore?: string | number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores, maxScale }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const center = 150;
  const radius = 95;

  // Build categories array with all available criteria (6 standard, 7 if video presentation evaluated)
  const categories: Array<{
    key: string;
    en: string;
    vi: string;
    val: number;
    color: string;
  }> = [
    { key: 'pronunciation', en: 'Pronunciation', vi: 'Phát âm', val: scores.pronunciation, color: '#38bdf8' },
    { key: 'fluency', en: 'Fluency', vi: 'Trôi chảy', val: scores.fluency, color: '#60a5fa' },
    { key: 'intonation', en: 'Intonation', vi: 'Ngữ điệu', val: scores.intonation, color: '#34d399' },
    { key: 'vocabulary', en: 'Vocabulary', vi: 'Từ vựng', val: scores.vocabulary, color: '#c084fc' },
    { key: 'grammar', en: 'Grammar', vi: 'Ngữ pháp', val: scores.grammar, color: '#fb7185' },
    ...(scores.taskCompletion !== undefined
      ? [{ key: 'taskCompletion', en: 'Task Comp.', vi: 'Nhiệm vụ', val: scores.taskCompletion, color: '#f59e0b' }]
      : []),
    ...(scores.presentation !== undefined
      ? [{ key: 'presentation', en: 'Presentation', vi: 'Trình bày', val: scores.presentation, color: '#2dd4bf' }]
      : []),
  ];

  const totalAxes = categories.length;
  const angleStep = (Math.PI * 2) / totalAxes;
  const startAngle = -Math.PI / 2; // start from top

  // 5 concentric grid circles (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Calculate polygon points for grid rings
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

  // Calculate polygon points for user scores
  const scoreCoords = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep;
    const ratio = Math.min(Math.max(cat.val / maxScale, 0.05), 1);
    const x = center + radius * ratio * Math.cos(angle);
    const y = center + radius * ratio * Math.sin(angle);
    return { x, y, val: cat.val, cat };
  });

  const scorePolygon = scoreCoords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none py-1">
      <svg
        viewBox="-50 5 400 300"
        className="w-full max-w-[340px] md:max-w-[370px] h-auto overflow-visible"
        aria-label="Skills Radar Chart"
      >
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
          </radialGradient>
          <filter id="radarGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#d946ef" floodOpacity="0.65" />
          </filter>
        </defs>

        {/* Background Grid Rings */}
        {levels.map((lvl, idx) => (
          <polygon
            key={idx}
            points={getPolygonCoords(lvl)}
            fill={idx === 4 ? 'rgba(6, 182, 212, 0.03)' : 'none'}
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth={lvl === 1 ? '1.4' : '0.8'}
            strokeDasharray={lvl === 1 ? 'none' : '3 3'}
          />
        ))}

        {/* Scale Ticks along the vertical axis (top spoke) */}
        {levels.map((lvl, idx) => {
          const tickVal = Math.round(lvl * maxScale * 10) / 10;
          const ty = center - radius * lvl;
          return (
            <text
              key={`tick-${idx}`}
              x={center + 5}
              y={ty + 3}
              className="fill-slate-500 text-[8.5px] font-mono font-medium select-none pointer-events-none"
            >
              {tickVal}
            </text>
          );
        })}

        {/* Axis Spokes */}
        {categories.map((cat, i) => {
          const angle = startAngle + i * angleStep;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          const isHovered = hoveredIndex === i;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke={isHovered ? cat.color : 'rgba(255, 255, 255, 0.22)'}
              strokeWidth={isHovered ? '2' : '0.9'}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Score Polygon Area */}
        <polygon
          points={scorePolygon}
          fill="url(#radarFill)"
          stroke="#e879f9"
          strokeWidth="2.4"
          filter="url(#radarGlow)"
          className="transition-all duration-500 ease-out"
        />

        {/* Score Data Points */}
        {scoreCoords.map((pt, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Outer pulsing ring on hover */}
              {isHovered && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="10"
                  fill="none"
                  stroke={pt.cat.color}
                  strokeWidth="1.8"
                  opacity="0.8"
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 4.5}
                fill="#ffffff"
                stroke={pt.cat.color}
                strokeWidth={isHovered ? 3 : 2}
                className="drop-shadow-md transition-all duration-200"
              />
            </g>
          );
        })}

        {/* Labels at outer perimeter */}
        {categories.map((cat, i) => {
          const angle = startAngle + i * angleStep;
          const labelDist = radius + 28;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);
          const isHovered = hoveredIndex === i;

          // Text anchors based on angular position
          let textAnchor = 'middle';
          if (Math.cos(angle) > 0.28) textAnchor = 'start';
          else if (Math.cos(angle) < -0.28) textAnchor = 'end';

          return (
            <g
              key={cat.key}
              transform={`translate(${lx}, ${ly})`}
              className="cursor-pointer select-none"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Skill English name */}
              <text
                textAnchor={textAnchor}
                className={`text-[10.5px] tracking-tight font-bold transition-colors ${
                  isHovered ? 'fill-white' : 'fill-slate-200'
                }`}
                dy="-4"
              >
                {cat.en}
              </text>
              {/* Skill Vietnamese sublabel & Exact Score Badge */}
              <text
                textAnchor={textAnchor}
                className="text-[9.5px] font-semibold"
                dy="8"
              >
                <tspan className="fill-slate-400 italic">({cat.vi}) </tspan>
                <tspan fill={cat.color} className="font-bold">
                  {cat.val}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
