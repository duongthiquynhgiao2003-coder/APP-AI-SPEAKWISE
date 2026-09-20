import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onStart: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  return (
    <section
      id="view-landing"
      className="flex-grow flex flex-col items-center justify-center px-4 sm:px-8 py-4 sm:py-6 my-auto text-center relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-88 h-88 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto flex flex-col items-center justify-center space-y-7 sm:space-y-8 md:space-y-9 relative z-10 -mt-3 sm:-mt-5">
        
        {/* Main Title Badge - Shifted slightly up */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-1.5 sm:space-y-2"
        >
          <div className="inline-flex items-center gap-3 sm:gap-4">
            <span className="text-4xl sm:text-5xl select-none" role="img" aria-label="graduation cap">🎓</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 drop-shadow-[0_0_22px_rgba(6,182,212,0.48)]">
              AI SPEAKWISE
            </h1>
          </div>
          <p className="text-xs sm:text-sm md:text-sm font-bold tracking-widest text-cyan-400 uppercase mt-1 sm:mt-1.5">
            SMART SPEAKING PRACTICE & ASSESSMENT
          </p>
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="space-y-2 max-w-2xl mx-auto px-2"
        >
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_14px_rgba(232,121,249,0.5)]">
            WELCOME TO THE AI SPEAKWISE APP
          </h2>
          <p className="text-cyan-200/90 text-sm sm:text-base md:text-lg font-medium tracking-wide drop-shadow-md">
            Chào mừng bạn đến với ứng dụng AI SPEAKWISE
          </p>
        </motion.div>

        {/* Start Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex justify-center pt-1.5 sm:pt-2"
        >
          <button
            id="btnStartApp"
            onClick={onStart}
            className="btn-neon rounded-full py-3 sm:py-3.5 px-12 sm:px-16 flex items-center justify-center cursor-pointer group gap-3.5 shadow-[0_0_26px_rgba(6,182,212,0.42)]"
          >
            <span className="text-xl sm:text-2xl font-black tracking-[0.2em]">START</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </motion.div>

        {/* Footer Sub-Note - Single line containing Tiếng Anh Tiểu học, THCS & THPT */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.22 }}
          className="text-slate-400 text-xs sm:text-sm pt-2 sm:pt-3 font-medium tracking-wider uppercase max-w-3xl mx-auto px-4 whitespace-nowrap"
        >
          CHƯƠNG TRÌNH GDPT 2018 • TIẾNG ANH TIỂU HỌC, THCS & THPT
        </motion.div>
      </div>
    </section>
  );
};


