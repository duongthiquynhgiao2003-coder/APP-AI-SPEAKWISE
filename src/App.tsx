/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LandingView } from './components/LandingView';
import { HeaderNav } from './components/HeaderNav';
import { StudentAssessment } from './components/StudentAssessment';
import { Toast, ToastData } from './components/Toast';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'main'>('landing');
  const [studentName, setStudentName] = useState<string>('Dương Thị Quỳnh Giao');
  const [grade, setGrade] = useState<string>('4');
  const [classNameVal, setClassNameVal] = useState<string>('4/1');
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  };

  return (
    <div
      className={`min-h-screen w-full bg-[#03060f] flex flex-col items-center justify-center ${
        currentView === 'landing' ? 'h-screen overflow-hidden' : ''
      } p-2 sm:p-3 md:p-4 antialiased selection:bg-cyan-500 selection:text-white`}
    >
      <div
        id="app"
        className={`w-full max-w-6xl ${
          currentView === 'landing'
            ? 'h-[calc(100vh-16px)] sm:h-[calc(100vh-24px)] md:h-[calc(100vh-32px)]'
            : 'min-h-[calc(100vh-32px)]'
        } rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-[#080c16] text-[#f8fafc] flex flex-col justify-between relative transition-all duration-300 my-auto`}
      >
        {/* Top glowing cyber accent line */}
        <div className="top-glow-bar w-full" />

        {/* VIEW SWITCHER */}
        {currentView === 'landing' ? (
          <LandingView onStart={() => setCurrentView('main')} />
        ) : (
          <main id="view-main" className="flex flex-col flex-grow">
            {/* Top navigation header */}
            <HeaderNav
              studentName={studentName}
              onStudentNameChange={setStudentName}
              grade={grade}
              onGradeChange={setGrade}
              classNameVal={classNameVal}
              onClassNameChange={setClassNameVal}
              onGoHome={() => setCurrentView('landing')}
            />

            {/* Main Content Workspace */}
            <div className="max-w-6xl w-full mx-auto p-3 sm:p-5 flex-grow">
              <StudentAssessment
                onShowToast={showToast}
                studentName={studentName}
                grade={grade}
                onGradeChange={setGrade}
                classNameVal={classNameVal}
              />
            </div>
          </main>
        )}

        {/* Global Application Footer */}
        <footer id="appFooter" className="bg-slate-950/90 border-t border-slate-800/80 py-2.5 sm:py-3 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-xs sm:text-sm font-semibold text-slate-400">
              <span className="text-cyan-400 font-bold tracking-wide">AI SPEAKWISE</span> • Luyện nói thông minh – Tự tin giao tiếp – Phát triển năng lực tiếng Anh
            </p>
          </div>
        </footer>
      </div>

      {/* Global Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
