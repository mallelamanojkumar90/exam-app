"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Flag, RefreshCw, FileText, FileJson } from "lucide-react";
import Navbar from "@/components/Navbar";
import Timer from "@/components/Timer";
import { fetchQuestions, Question } from "@/lib/api";

function ExamContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const subject = searchParams.get("subject") || "General";
    const difficulty = searchParams.get("difficulty") || "Medium";
    const count = parseInt(searchParams.get("count") || "10");

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const data = await fetchQuestions(subject, difficulty, count);
                setQuestions(data);
            } catch (error) {
                console.error("Failed to load questions", error);
            } finally {
                setLoading(false);
            }
        };
        loadQuestions();
    }, [subject, difficulty, count]);

    const handleAnswer = (optionIndex: number) => {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    };

    const [user, setUser] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    const handleSubmit = async () => {
        let newScore = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                newScore++;
            }
        });
        setScore(newScore);
        setSubmitted(true);

        // Save result to backend
        if (user) {
            try {
                await fetch("http://localhost:8000/submit-exam", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: user,
                        subject: subject,
                        difficulty: difficulty,
                        score: newScore,
                        total_questions: questions.length,
                    }),
                });
            } catch (error) {
                console.error("Failed to save exam result", error);
            }
        }
    };

    const handleTimeUp = () => {
        if (!submitted) {
            handleSubmit();
            alert("Time is up! Your exam has been submitted.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Generating your exam...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400">Failed to load questions. Please try again.</p>
                    <button onClick={() => router.back()} className="btn btn-secondary mt-4">Go Back</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    if (submitted) {
        const correctCount = score;
        const incorrectCount = questions.length - score;
        const percentage = Math.round((score / questions.length) * 100);

        const downloadResults = async (format: 'pdf' | 'json') => {
            const timestamp = new Date().toLocaleString();

            if (format === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const doc = new jsPDF();

                let yPos = 20;
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 20;
                const maxWidth = pageWidth - 2 * margin;

                const checkNewPage = (requiredSpace: number) => {
                    if (yPos + requiredSpace > pageHeight - margin) {
                        doc.addPage();
                        yPos = margin;
                        return true;
                    }
                    return false;
                };

                // Header
                doc.setFontSize(24);
                doc.setTextColor(59, 130, 246);
                doc.text('EXAM RESULTS', pageWidth / 2, yPos, { align: 'center' });
                yPos += 15;

                // Exam Info
                doc.setFontSize(12);
                doc.setTextColor(100, 100, 100);
                doc.text(`Subject: ${subject}`, margin, yPos);
                yPos += 7;
                doc.text(`Difficulty: ${difficulty}`, margin, yPos);
                yPos += 7;
                doc.text(`Date: ${timestamp}`, margin, yPos);
                yPos += 15;

                // Score Summary
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, maxWidth, 30, 'F');

                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text(`Score: ${score}/${questions.length} (${percentage}%)`, margin + 5, yPos + 10);

                doc.setFontSize(12);
                doc.setTextColor(34, 197, 94);
                doc.text(`✓ Correct: ${correctCount}`, margin + 5, yPos + 20);

                doc.setTextColor(239, 68, 68);
                doc.text(`✗ Incorrect: ${incorrectCount}`, margin + 60, yPos + 20);

                yPos += 40;

                // Separator
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 10;

                // Questions
                questions.forEach((q, index) => {
                    const userAnswer = answers[index];
                    const isCorrect = userAnswer === q.correctAnswer;
                    const wasAnswered = userAnswer !== undefined;

                    checkNewPage(60);

                    // Question Header
                    doc.setFontSize(14);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`Question ${index + 1}`, margin, yPos);

                    doc.setFontSize(10);
                    if (isCorrect) {
                        doc.setTextColor(34, 197, 94);
                        doc.text('✓ CORRECT', pageWidth - margin - 30, yPos);
                    } else if (wasAnswered) {
                        doc.setTextColor(239, 68, 68);
                        doc.text('✗ INCORRECT', pageWidth - margin - 30, yPos);
                    } else {
                        doc.setTextColor(234, 179, 8);
                        doc.text('⚠ NOT ANSWERED', pageWidth - margin - 40, yPos);
                    }
                    yPos += 8;

                    // Question Text
                    doc.setFontSize(11);
                    doc.setTextColor(0, 0, 0);
                    const questionLines = doc.splitTextToSize(q.text, maxWidth);
                    questionLines.forEach((line: string) => {
                        checkNewPage(7);
                        doc.text(line, margin, yPos);
                        yPos += 6;
                    });
                    yPos += 5;

                    // Options
                    q.options.forEach((opt, optIdx) => {
                        checkNewPage(7);
                        const letter = String.fromCharCode(65 + optIdx);
                        const isUserAnswer = userAnswer === optIdx;
                        const isCorrectAnswer = q.correctAnswer === optIdx;

                        doc.setFontSize(10);

                        if (isCorrectAnswer) {
                            doc.setTextColor(34, 197, 94);
                            doc.text(`✓ ${letter}. ${opt}`, margin + 5, yPos);
                        } else if (isUserAnswer && !isCorrect) {
                            doc.setTextColor(239, 68, 68);
                            doc.text(`✗ ${letter}. ${opt}`, margin + 5, yPos);
                        } else {
                            doc.setTextColor(100, 100, 100);
                            doc.text(`  ${letter}. ${opt}`, margin + 5, yPos);
                        }
                        yPos += 6;
                    });
                    yPos += 5;

                    // Answer Summary
                    checkNewPage(15);
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Your Answer: `, margin + 5, yPos);

                    if (wasAnswered) {
                        doc.setTextColor(isCorrect ? 34 : 239, isCorrect ? 197 : 68, isCorrect ? 94 : 68);
                        doc.text(String.fromCharCode(65 + userAnswer), margin + 35, yPos);
                    } else {
                        doc.setTextColor(234, 179, 8);
                        doc.text('Not Answered', margin + 35, yPos);
                    }

                    doc.setTextColor(100, 100, 100);
                    doc.text(`Correct Answer: `, margin + 70, yPos);
                    doc.setTextColor(34, 197, 94);
                    doc.text(String.fromCharCode(65 + q.correctAnswer), margin + 110, yPos);
                    yPos += 8;

                    // Explanation
                    if (q.explanation) {
                        checkNewPage(20);
                        doc.setFontSize(9);
                        doc.setTextColor(59, 130, 246);
                        doc.text('💡 Explanation:', margin + 5, yPos);
                        yPos += 5;

                        doc.setTextColor(80, 80, 80);
                        const explanationLines = doc.splitTextToSize(q.explanation, maxWidth - 10);
                        explanationLines.forEach((line: string) => {
                            checkNewPage(5);
                            doc.text(line, margin + 5, yPos);
                            yPos += 5;
                        });
                    }

                    yPos += 5;
                    checkNewPage(5);
                    doc.setDrawColor(220, 220, 220);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 10;
                });

                doc.save(`exam-results-${subject}-${Date.now()}.pdf`);
            } else {
                const results = {
                    exam: {
                        subject,
                        difficulty,
                        date: timestamp,
                        totalQuestions: questions.length,
                        score,
                        percentage
                    },
                    questions: questions.map((q, index) => ({
                        questionNumber: index + 1,
                        question: q.text,
                        options: q.options,
                        userAnswer: answers[index],
                        correctAnswer: q.correctAnswer,
                        isCorrect: answers[index] === q.correctAnswer,
                        explanation: q.explanation
                    }))
                };
                const content = JSON.stringify(results, null, 2);

                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `exam-results-${subject}-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        };

        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-12">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="glass-panel p-8 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Exam Completed!</h1>
                                    <p className="text-slate-400">{subject} - {difficulty} Level</p>
                                </div>
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-slate-800 rounded-lg text-center">
                                    <div className="text-sm text-slate-400 mb-1">Score</div>
                                    <div className="text-3xl font-bold text-primary">{percentage}%</div>
                                    <div className="text-xs text-slate-500 mt-1">{score}/{questions.length}</div>
                                </div>
                                <div className="p-4 bg-slate-800 rounded-lg text-center">
                                    <div className="text-sm text-slate-400 mb-1">Correct</div>
                                    <div className="text-3xl font-bold text-green-400">{correctCount}</div>
                                    <div className="text-xs text-slate-500 mt-1">questions</div>
                                </div>
                                <div className="p-4 bg-slate-800 rounded-lg text-center">
                                    <div className="text-sm text-slate-400 mb-1">Incorrect</div>
                                    <div className="text-3xl font-bold text-red-400">{incorrectCount}</div>
                                    <div className="text-xs text-slate-500 mt-1">questions</div>
                                </div>
                            </div>

                            {/* Redesigned Action Buttons */}
                            <div className="space-y-3">
                                {/* Primary Actions Row */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => router.push("/dashboard")}
                                        className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={18} />
                                        <span>Back to Dashboard</span>
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={18} />
                                        <span>Retake Exam</span>
                                    </button>
                                </div>

                                {/* Download Options Row */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => downloadResults('pdf')}
                                        className="btn bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex-1 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                    >
                                        <FileText size={18} />
                                        <span>Download PDF</span>
                                    </button>
                                    <button
                                        onClick={() => downloadResults('json')}
                                        className="btn bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 flex-1 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                    >
                                        <FileJson size={18} />
                                        <span>Download JSON</span>
                                    </button>
                                </div>

                                {/* Helper Text */}
                                <p className="text-center text-xs text-slate-500">
                                    Download your results for offline review or data analysis
                                </p>
                            </div>
                        </div>

                        {/* Detailed Results */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-4">Detailed Review</h2>

                            {questions.map((question, index) => {
                                const userAnswer = answers[index];
                                const isCorrect = userAnswer === question.correctAnswer;
                                const wasAnswered = userAnswer !== undefined;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`glass-panel p-6 border-l-4 ${isCorrect
                                            ? 'border-green-500'
                                            : wasAnswered
                                                ? 'border-red-500'
                                                : 'border-yellow-500'
                                            }`}
                                    >
                                        {/* Question Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 rounded-full bg-slate-800 text-sm font-medium">
                                                    Question {index + 1}
                                                </span>
                                                {isCorrect ? (
                                                    <span className="flex items-center gap-1 text-green-400 text-sm">
                                                        <CheckCircle size={16} />
                                                        Correct
                                                    </span>
                                                ) : wasAnswered ? (
                                                    <span className="flex items-center gap-1 text-red-400 text-sm">
                                                        <AlertCircle size={16} />
                                                        Incorrect
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-yellow-400 text-sm">
                                                        <AlertCircle size={16} />
                                                        Not Answered
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <h3 className="text-lg font-medium mb-4 leading-relaxed">
                                            {question.text}
                                        </h3>

                                        {/* Options */}
                                        <div className="space-y-2 mb-4">
                                            {question.options.map((option, optIdx) => {
                                                const isUserAnswer = userAnswer === optIdx;
                                                const isCorrectAnswer = question.correctAnswer === optIdx;

                                                let bgClass = 'bg-slate-800/50 border-slate-700';
                                                let textClass = 'text-slate-300';

                                                if (isCorrectAnswer) {
                                                    bgClass = 'bg-green-500/10 border-green-500/30';
                                                    textClass = 'text-green-400';
                                                } else if (isUserAnswer && !isCorrect) {
                                                    bgClass = 'bg-red-500/10 border-red-500/30';
                                                    textClass = 'text-red-400';
                                                }

                                                return (
                                                    <div
                                                        key={optIdx}
                                                        className={`p-3 rounded-lg border ${bgClass} flex items-center justify-between`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${isCorrectAnswer
                                                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                                                : isUserAnswer && !isCorrect
                                                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                                                    : 'border-slate-600 text-slate-400'
                                                                }`}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </div>
                                                            <span className={textClass}>{option}</span>
                                                        </div>
                                                        {isCorrectAnswer && (
                                                            <CheckCircle size={18} className="text-green-400" />
                                                        )}
                                                        {isUserAnswer && !isCorrect && (
                                                            <AlertCircle size={18} className="text-red-400" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Answer Summary */}
                                        <div className="p-4 bg-slate-800/50 rounded-lg mb-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-400">Your Answer: </span>
                                                    <span className={wasAnswered ? (isCorrect ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}>
                                                        {wasAnswered ? String.fromCharCode(65 + userAnswer) : 'Not Answered'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Correct Answer: </span>
                                                    <span className="text-green-400">
                                                        {String.fromCharCode(65 + question.correctAnswer)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Explanation */}
                                        {question.explanation && (
                                            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <div className="text-blue-400 font-medium text-sm mt-0.5">💡 Explanation:</div>
                                                    <p className="text-slate-300 text-sm leading-relaxed flex-1">
                                                        {question.explanation}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-8 flex gap-4 justify-center">
                            <button onClick={() => router.push("/dashboard")} className="btn btn-secondary">
                                Back to Dashboard
                            </button>
                            <button onClick={() => window.location.reload()} className="btn btn-primary">
                                Retake Exam
                            </button>
                        </div>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-slate-400" />
                        </button>
                        <div>
                            <h1 className="font-semibold">{subject} Exam</h1>
                            <div className="text-xs text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</div>
                        </div>
                    </div>

                    <Timer durationInSeconds={count * 120} onTimeUp={handleTimeUp} />

                    <button
                        onClick={handleSubmit}
                        className="btn bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 py-1.5 px-3 text-sm"
                    >
                        Finish Exam
                    </button>
                </div>
                {/* Progress Bar */}
                <div className="h-1 bg-slate-800 w-full">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </header>

            <main className="flex-1 container py-8 max-w-4xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIndex}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel p-8"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                                {difficulty}
                            </span>
                            <button className="text-slate-400 hover:text-yellow-400 transition-colors">
                                <Flag size={18} />
                            </button>
                        </div>

                        <h2 className="text-xl font-medium mb-8 leading-relaxed">
                            {currentQuestion.text}
                        </h2>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between group ${answers[currentQuestionIndex] === idx
                                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                                        : "border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${answers[currentQuestionIndex] === idx
                                            ? "bg-primary border-primary text-white"
                                            : "border-slate-600 text-slate-400 group-hover:border-slate-500"
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={answers[currentQuestionIndex] === idx ? "text-white" : "text-slate-300"}>
                                            {option}
                                        </span>
                                    </div>
                                    {answers[currentQuestionIndex] === idx && (
                                        <CheckCircle size={20} className="text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-8">
                    <button
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft size={18} />
                        Previous
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary"
                        >
                            Submit Exam
                            <CheckCircle size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                            className="btn btn-primary"
                        >
                            Next Question
                            <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ExamPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ExamContent />
        </Suspense>
    );
}
