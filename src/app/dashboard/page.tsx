"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calculator, Atom, FlaskConical, Layers, Play, Clock, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const subjects = [
    { id: "maths", name: "Mathematics", icon: Calculator, color: "from-blue-500 to-cyan-500" },
    { id: "physics", name: "Physics", icon: Atom, color: "from-violet-500 to-purple-500" },
    { id: "chemistry", name: "Chemistry", icon: FlaskConical, color: "from-emerald-500 to-teal-500" },
];

const difficulties = ["Easy", "Medium", "Hard"];

export default function Dashboard() {
    const router = useRouter();
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState("Medium");
    const [questionCount, setQuestionCount] = useState(10);

    const startExam = () => {
        if (!selectedSubject) {
            alert("Please select a subject");
            return;
        }
        router.push(`/exam?subject=${selectedSubject}&difficulty=${difficulty}&count=${questionCount}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-12">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, Student</h1>
                    <p className="text-slate-400">Ready to challenge yourself? Configure your exam below.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Layers className="text-primary" size={20} />
                                Select Subject
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {subjects.map((subject) => (
                                    <motion.button
                                        key={subject.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedSubject(subject.id)}
                                        className={`relative p-6 rounded-xl border text-left transition-all overflow-hidden group ${selectedSubject === subject.id
                                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                                            }`}
                                    >
                                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${subject.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-opacity group-hover:opacity-20`} />
                                        <subject.icon className={`w-8 h-8 mb-4 ${selectedSubject === subject.id ? "text-primary" : "text-slate-400"}`} />
                                        <h3 className="font-semibold text-lg">{subject.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1">IIT/JEE Practice</p>

                                        {selectedSubject === subject.id && (
                                            <div className="absolute top-4 right-4 text-primary">
                                                <CheckCircle size={20} />
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Clock className="text-primary" size={20} />
                                Exam Settings
                            </h2>
                            <div className="glass-panel p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-3">Difficulty Level</label>
                                    <div className="flex gap-2">
                                        {difficulties.map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setDifficulty(level)}
                                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${difficulty === level
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-3">
                                        Number of Questions: <span className="text-white font-bold">{questionCount}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        step="5"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>5</span>
                                        <span>25</span>
                                        <span>50</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="glass-panel p-6 border-t-4 border-t-primary">
                                <h3 className="text-lg font-semibold mb-4">Exam Summary</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                                        <span className="text-slate-400">Subject</span>
                                        <span className="font-medium capitalize">{selectedSubject || "-"}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                                        <span className="text-slate-400">Difficulty</span>
                                        <span className={`font-medium px-2 py-0.5 rounded text-xs ${difficulty === "Easy" ? "bg-green-500/20 text-green-400" :
                                            difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                                                "bg-red-500/20 text-red-400"
                                            }`}>
                                            {difficulty}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                                        <span className="text-slate-400">Questions</span>
                                        <span className="font-medium">{questionCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Est. Time</span>
                                        <span className="font-medium">{questionCount * 2} mins</span>
                                    </div>
                                </div>

                                <button
                                    onClick={startExam}
                                    disabled={!selectedSubject}
                                    className={`w-full btn ${selectedSubject
                                        ? "btn-primary"
                                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                        }`}
                                >
                                    <Play size={18} />
                                    Start Exam
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
