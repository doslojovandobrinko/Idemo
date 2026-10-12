/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, RotateCcw, Sparkles, Compass } from 'lucide-react';
import { QuizQuestion, sampleRandomQuizQuestions } from '../data/culturalQuizData';
import { Recommendation } from '../types';
import { LazyImage } from './LazyImage';

interface CulturalQuizProps {
  language: 'en' | 'sr' | 'zh';
  allRecommendations: Recommendation[];
  onSelectRec: (recId: string) => void;
  triggerHaptic?: (pattern?: any) => void;
}

export default function CulturalQuiz({
  language,
  allRecommendations,
  onSelectRec,
  triggerHaptic
}: CulturalQuizProps) {
  const quizContainerRef = React.useRef<HTMLDivElement>(null);
  // Monte Carlo sampled 6 questions from the 30 pool
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => sampleRandomQuizQuestions(6));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({}); // questionIndex -> array of attempted option indices
  const [correctlyAnswered, setCorrectlyAnswered] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const safeHaptic = useCallback((pattern: number | number[] = 10) => {
    try {
      if (typeof triggerHaptic === 'function') {
        triggerHaptic(pattern);
      }
    } catch {}
  }, [triggerHaptic]);

  // Robust scrolling to align quiz container cleanly in view when advancing questions
  const scrollToQuiz = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!quizContainerRef.current) return;
    const container = quizContainerRef.current;
    
    // Find the scrolling ancestor (e.g. HomeScreen overflow-y-auto container)
    let scrollParent: HTMLElement | null = container.parentElement;
    while (scrollParent) {
      const style = window.getComputedStyle(scrollParent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }

    if (scrollParent) {
      const containerRect = container.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      const relativeTop = containerRect.top - parentRect.top;
      // Position the quiz container 12px below the top of the scroll container
      const targetScrollTop = scrollParent.scrollTop + relativeTop - 12;
      
      try {
        scrollParent.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior
        });
      } catch {
        scrollParent.scrollTop = Math.max(0, targetScrollTop);
      }
    } else {
      try {
        container.scrollIntoView({
          behavior,
          block: 'start'
        });
      } catch {
        container.scrollIntoView();
      }
    }
  }, []);

  // When advancing to the next question, smoothly re-align the quiz card into clear view
  // to prevent layout collapse from displacing the card above the viewport
  React.useEffect(() => {
    if (currentIndex > 0) {
      scrollToQuiz('smooth');
      const timer1 = setTimeout(() => scrollToQuiz('smooth'), 50);
      const timer2 = setTimeout(() => scrollToQuiz('smooth'), 180);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [currentIndex, scrollToQuiz]);

  const currentQuestion = questions[currentIndex];
  const attemptedForCurrent = selectedAnswers[currentIndex] || [];
  const isCurrentSolved = !!correctlyAnswered[currentIndex];

  const handleOptionClick = (optionIndex: number) => {
    if (isCurrentSolved) return; // already solved this question

    const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
    const newAttempted = Array.from(new Set([...attemptedForCurrent, optionIndex]));

    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: newAttempted
    }));

    if (isCorrect) {
      safeHaptic([15, 30]);
      setCorrectlyAnswered(prev => ({
        ...prev,
        [currentIndex]: true
      }));
    } else {
      safeHaptic(30);
    }
  };

  const handleNextQuestion = () => {
    safeHaptic(10);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
    scrollToQuiz('smooth');
  };

  const handleRestartQuiz = () => {
    safeHaptic([10, 20]);
    // Reshuffle 6 new questions from the 30-question pool (Monte Carlo)
    setQuestions(sampleRandomQuizQuestions(6));
    setCurrentIndex(0);
    setSelectedAnswers({});
    setCorrectlyAnswered({});
    setIsCompleted(false);
    scrollToQuiz('smooth');
  };

  // Find linked recommendations for the current question
  const linkedRecommendations = useMemo(() => {
    if (!currentQuestion) return [];
    const recMap = new Map<string, Recommendation>();
    allRecommendations.forEach(r => recMap.set(r.id, r));

    return currentQuestion.recommendedRecIds
      .map(id => recMap.get(id))
      .filter((r): r is Recommendation => !!r)
      .slice(0, 2); // maximum 2 related recommendations per specification
  }, [currentQuestion, allRecommendations]);

  // Total correct score on first try or completed
  const score = Object.keys(correctlyAnswered).length;

  const t = {
    badge: language === 'sr' ? 'KULTURNI KVIZ' : language === 'zh' ? '文化问答' : 'CULTURAL QUIZ',
    subtitle: language === 'sr' 
      ? 'Otkrijte skrivene dragulje Srbije kroz 6 brzih pitanja' 
      : language === 'zh' 
      ? '通过6道精选问答探访塞尔维亚风土与隐秘胜地' 
      : 'Test your discernment & unlock curated destinations across Serbia',
    questionLabel: language === 'sr' ? 'Pitanje' : language === 'zh' ? '第' : 'Question',
    ofLabel: language === 'sr' ? 'od' : language === 'zh' ? '题 / 共' : 'of',
    correctBadge: language === 'sr' ? 'Tačno!' : language === 'zh' ? '回答正确！' : 'Correct!',
    recommendationPrompt: language === 'sr' 
      ? 'Možda vas zanima da istražite:' 
      : language === 'zh' 
      ? '您可能感兴趣的探索目的地：' 
      : 'You may be interested in exploring:',
    nextButton: language === 'sr' ? 'Sledeće pitanje' : language === 'zh' ? '下一题' : 'Next Question',
    finishButton: language === 'sr' ? 'Pogledaj rezultate' : language === 'zh' ? '查看测试结果' : 'View Results',
    completedTitle: language === 'sr' ? 'Kviz završen!' : language === 'zh' ? '问答挑战完成！' : 'Quiz Completed!',
    scoreLabel: language === 'sr' ? 'Tačnih odgovora' : language === 'zh' ? '总得分' : 'Score',
    restartButton: language === 'sr' ? 'Novi kviz (6 novih pitanja)' : language === 'zh' ? '换一批新题重新测试' : 'Play Another Round (6 New Questions)',
    connoisseurBadge: language === 'sr' ? 'Poznavalac srpske kulture' : language === 'zh' ? '塞尔维亚风情鉴赏家' : 'Serbian Cultural Connoisseur',
    exploreButton: language === 'sr' ? 'Istraži' : language === 'zh' ? '探索' : 'Explore'
  };

  return (
    <div 
      ref={quizContainerRef}
      className="w-full bg-[#FAF9F5] border border-border-main/70 rounded-[28px] p-5 sm:p-6 shadow-sm space-y-5 scroll-mt-6"
    >
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-main/40 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#800020]/10 text-[#800020] border border-[#800020]/20">
              <Sparkles size={11} className="text-[#800020]" />
              {t.badge}
            </span>
            <span className="text-[11px] font-mono text-[#5C5A4D] font-bold">
              {t.questionLabel} {currentIndex + 1} {t.ofLabel} {questions.length}
            </span>
          </div>
          <p className="text-[12px] text-brand-charcoal/70 leading-relaxed font-sans">
            {t.subtitle}
          </p>
        </div>

        {/* 6-step Progress Segment Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          {questions.map((_, idx) => {
            const isAnswered = !!correctlyAnswered[idx];
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isAnswered
                    ? 'w-6 bg-emerald-700'
                    : isCurrent
                    ? 'w-6 bg-[#800020]'
                    : 'w-2 bg-[#DED9CE]'
                }`}
              />
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isCompleted ? (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 min-h-[280px]"
          >
            {/* Category tag & Question statement */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#5C5A4D] font-extrabold">
                {currentQuestion.category}
              </span>
              <h4 className="text-[18px] sm:text-[20px] font-serif font-bold text-brand-charcoal leading-snug">
                {currentQuestion.question[language] || currentQuestion.question.en}
              </h4>
            </div>

            {/* 4 Offered Answers */}
            <div className="space-y-2.5 pt-1">
              {(currentQuestion.options[language] || currentQuestion.options.en).map((optionText, optIdx) => {
                const isSelected = attemptedForCurrent.includes(optIdx);
                const isCorrect = optIdx === currentQuestion.correctAnswerIndex;
                const isWrong = isSelected && !isCorrect;
                const isRightSelected = isSelected && isCorrect;

                let buttonClass = 'bg-white border-border-main text-brand-charcoal hover:bg-[#F4F3ED] hover:border-brand-charcoal/30';
                let textClass = 'text-brand-charcoal font-medium';

                if (isWrong) {
                  // Per user instruction: "When clicink the wrong answer they just turn red font"
                  buttonClass = 'bg-[#FFF5F5] border-red-300 shadow-xs';
                  textClass = 'text-[#8A1F1F] font-bold';
                } else if (isRightSelected || (isCurrentSolved && isCorrect)) {
                  // Per user instruction: "When you hit 17 ( right answer) the font turns green with a Correct text appearing under it"
                  buttonClass = 'bg-[#F2F8F5] border-emerald-400 shadow-xs';
                  textClass = 'text-emerald-800 font-bold';
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleOptionClick(optIdx)}
                    disabled={isCurrentSolved}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 active:scale-[0.99] cursor-pointer ${buttonClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isRightSelected || (isCurrentSolved && isCorrect)
                          ? 'bg-emerald-700 text-white'
                          : isWrong
                          ? 'bg-[#8A1F1F] text-white'
                          : 'bg-[#EDEAE1] text-[#5C5A4D]'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className={`text-[14px] leading-snug ${textClass}`}>
                        {optionText}
                      </span>
                    </div>

                    {/* Indicator icon */}
                    {isRightSelected || (isCurrentSolved && isCorrect) ? (
                      <CheckCircle2 size={18} className="text-emerald-700 shrink-0 ml-2" />
                    ) : isWrong ? (
                      <span className="text-[11px] font-mono font-black text-[#8A1F1F] shrink-0 ml-2 uppercase tracking-wider">
                        ✕
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Revealed Outcome when Right Answer is Clicked */}
            <AnimatePresence>
              {isCurrentSolved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 pt-3 border-t border-border-main/40 overflow-hidden"
                >
                  {/* Correct badge & editorial explanation */}
                  <div className="space-y-1.5 p-3.5 bg-[#F2F8F5] border border-emerald-300/80 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[13px]">
                      <CheckCircle2 size={16} className="text-emerald-700" />
                      <span>{t.correctBadge}</span>
                    </div>
                    <p className="text-[13px] text-emerald-950/85 leading-relaxed font-sans">
                      {currentQuestion.explanation[language] || currentQuestion.explanation.en}
                    </p>
                  </div>

                  {/* Under CORRECT text: "you may be interested in exploring" + linked recommendations */}
                  {linkedRecommendations.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-1.5 text-[#5C5A4D]">
                        <Compass size={14} className="text-[#800020]" />
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#5C5A4D]">
                          {t.recommendationPrompt}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {linkedRecommendations.map(rec => {
                          const localizedTitle = rec.translations?.[language]?.title || rec.title;
                          const localizedLocation = rec.translations?.[language]?.location || rec.location;

                          return (
                            <div
                              key={rec.id}
                              onClick={() => {
                                safeHaptic(10);
                                onSelectRec(rec.id);
                              }}
                              className="bg-white border border-border-main hover:border-[#800020]/40 rounded-2xl p-2.5 shadow-xs hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group active:scale-[0.98]"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-black/5 bg-[#EDEAE1]">
                                <LazyImage
                                  src={rec.image}
                                  alt={localizedTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>

                              <div className="flex-1 min-w-0 pr-1">
                                <span className="block text-[9.5px] uppercase tracking-wider font-bold text-accent-red truncate">
                                  {rec.category}
                                </span>
                                <h5 className="font-serif font-bold text-[13.5px] text-brand-charcoal truncate group-hover:text-[#800020] transition-colors leading-snug">
                                  {localizedTitle}
                                </h5>
                                <span className="block text-[11px] text-[#5C5A4D] truncate">
                                  {localizedLocation}
                                </span>
                              </div>

                              <ChevronRight size={16} className="text-[#800020] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mr-1" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Advance to Next Question */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 bg-[#800020] hover:bg-[#660019] text-white rounded-xl text-[12px] font-sans font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs border border-[#800020]/20 active:translate-y-[1px] cursor-pointer min-h-[44px]"
                    >
                      <span>
                        {currentIndex < questions.length - 1 ? t.nextButton : t.finishButton}
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Completion Summary */
          <motion.div
            key="completion-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 px-4 space-y-4"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Sparkles size={24} />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest font-black text-[#800020]">
                {t.connoisseurBadge}
              </span>
              <h4 className="text-2xl font-serif font-bold text-brand-charcoal">
                {t.completedTitle}
              </h4>
              <p className="text-[14px] text-brand-charcoal/70">
                {t.scoreLabel}: <strong className="text-brand-charcoal font-mono text-[16px]">{score} / {questions.length}</strong>
              </p>
            </div>

            <p className="text-xs text-[#5C5A4D] max-w-sm mx-auto leading-relaxed">
              {language === 'sr'
                ? 'Vaše interesovanje za kulturno nasleđe Srbije otvara vrata najautentičnijim pričama i lokacijama.'
                : language === 'zh'
                ? '您对塞尔维亚深厚文化底蕴的敏锐洞察，将开启更具文化沉浸感的专属探索旅程。'
                : 'Your cultural curiosity unlocks the most captivating historical, artistic, and natural sanctuaries across Serbia.'}
            </p>

            <div className="pt-3">
              <button
                onClick={handleRestartQuiz}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#800020] hover:bg-[#660019] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:translate-y-[1px] cursor-pointer min-h-[44px]"
              >
                <RotateCcw size={14} />
                <span>{t.restartButton}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
