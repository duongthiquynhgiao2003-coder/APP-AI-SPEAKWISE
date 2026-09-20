import React from 'react';
import { Mic, User, Home, Sparkles } from 'lucide-react';

interface HeaderNavProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  grade: string;
  onGradeChange: (grade: string) => void;
  classNameVal: string;
  onClassNameChange: (cls: string) => void;
  onGoHome: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  studentName,
  onStudentNameChange,
  grade,
  onGradeChange,
  classNameVal,
  onClassNameChange,
  onGoHome,
}) => {
  return (
    <header
      id="headerNavbar"
      className="sticky top-0 z-40 bg-[#060b17]/95 backdrop-blur-md border-b border-cyan-500/25 px-3 sm:px-6 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Mic className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="flex items-center">
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200 text-sm sm:text-base drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              AI SPEAKWISE
            </span>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded ml-2 font-bold shadow-[0_0_8px_rgba(6,182,212,0.25)]">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> PRO
            </span>
          </div>
        </div>

        {/* Student metadata controls */}
        <div className="flex items-center gap-2">
          {/* Student Name */}
          <div className="relative flex items-center bg-[#091122] border border-cyan-500/30 rounded-lg overflow-hidden focus-within:border-cyan-400 focus-within:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all">
            <div className="pl-2.5 pr-1 py-1.5 flex items-center gap-1.5 text-slate-400 bg-[#070e1b]">
              <User className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-semibold select-none text-slate-300">Name:</span>
            </div>
            <input
              type="text"
              id="studentFullName"
              value={studentName}
              onChange={(e) => onStudentNameChange(e.target.value)}
              placeholder="Dương Thị Quỳnh Giao"
              className="bg-transparent text-cyan-100 placeholder:text-slate-500 text-xs font-semibold py-1.5 pr-3 focus:outline-none w-32 sm:w-48"
            />
          </div>

          {/* Grade & Class */}
          <div className="flex items-center bg-[#091122] border border-cyan-500/30 rounded-lg p-0.5 text-xs text-slate-300">
            <span className="pl-2 pr-1 text-slate-400 font-medium">Class:</span>
            <select
              id="headerGradeSelect"
              value={grade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="bg-[#0b162c] text-cyan-300 border-0 text-xs font-bold rounded px-1.5 py-1 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={String(g)}>
                  {g}
                </option>
              ))}
            </select>
            <span className="px-1 text-slate-600">|</span>
            <input
              type="text"
              id="headerClassNameInput"
              value={classNameVal}
              onChange={(e) => onClassNameChange(e.target.value)}
              placeholder="4/1"
              className="w-12 bg-[#0b162c] text-cyan-200 border-0 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-center font-bold"
            />
          </div>

          {/* Home button */}
          <button
            id="btnGoHome"
            onClick={onGoHome}
            title="Trở về trang chủ"
            className="flex items-center justify-center w-8 h-8 bg-[#091122] hover:bg-[#101f3f] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
