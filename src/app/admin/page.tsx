"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Upload, Database, FileText, RefreshCw, CheckCircle, AlertCircle, Loader2, Server, User } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Document {
    id: number;
    filename: string;
    subject: string;
    upload_date: string;
}

interface VectorStats {
    total_vector_count: number;
    dimension: number;
    index_fullness: number;
    namespaces: Record<string, { vector_count: number }>;
}

export default function AdminDashboard() {
    const [files, setFiles] = useState<File[]>([]);
    const [subject, setSubject] = useState("Physics");
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
        type: null,
        message: "",
    });
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [vectorStats, setVectorStats] = useState<VectorStats | null>(null);
    const [syncing, setSyncing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch document list
    const fetchDocuments = async () => {
        try {
            const res = await fetch("http://localhost:8000/documents");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (e) {
            console.error("Failed to fetch documents", e);
        } finally {
            setLoadingDocs(false);
        }
    };

    // Sync with Pinecone and refresh documents
    const syncVectorDB = async () => {
        setSyncing(true);
        try {
            await fetchDocuments();
            const res = await fetch("http://localhost:8000/debug/index-stats");
            if (res.ok) {
                const { stats } = await res.json();
                setVectorStats(stats);
                setStatus({ type: "success", message: "Vector DB synced successfully" });
            } else {
                throw new Error("Failed to fetch vector stats");
            }
        } catch (e) {
            console.error(e);
            setStatus({ type: "error", message: "Failed to sync with Vector DB" });
        } finally {
            setSyncing(false);
            setTimeout(() => setStatus({ type: null, message: "" }), 3000);
        }
    };

    // Handle file selection (multiple)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setStatus({ type: null, message: "" });
        }
    };

    // Upload all selected files sequentially
    const handleUpload = async () => {
        if (files.length === 0) {
            setStatus({ type: "error", message: "Please select at least one PDF file." });
            return;
        }
        setUploading(true);
        setStatus({ type: null, message: "" });
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("subject", subject);
                const res = await fetch("http://localhost:8000/upload-document", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Upload failed");
                }
                if (data.status === "warning") {
                    setStatus({ type: "error", message: data.message });
                } else {
                    setStatus({ type: "success", message: `Uploaded ${data.filename}` });
                }
            }
            // Clear selection after successful uploads
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
            syncVectorDB();
        } catch (e: any) {
            console.error(e);
            setStatus({ type: "error", message: e.message || "Upload error" });
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
        syncVectorDB();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary/30">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Knowledge Base
                        </h1>
                        <p className="text-slate-400 mt-2">Manage PDF documents and vector database</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/admin/students" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-700">
                            <User size={18} />
                            <span>Manage Students</span>
                        </Link>
                        <button
                            onClick={syncVectorDB}
                            disabled={syncing}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                            {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                            <span>{syncing ? "Syncing..." : "Sync Vector DB"}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-200">
                                <Upload className="text-primary" size={20} />
                                Upload Knowledge Source
                            </h2>
                            <div className="space-y-6">
                                {/* Subject Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Maths">Maths</option>
                                        <option value="Mixed">Mixed (Physics, Maths, Chemistry)</option>
                                    </select>
                                </div>

                                {/* File Drop Zone */}
                                <div
                                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${files.length > 0 ? "border-primary bg-primary/5" : "border-slate-700 hover:border-primary/50 bg-slate-900/30"
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf"
                                        multiple
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer block">
                                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            {files.length > 0 ? (
                                                <FileText className="text-primary" size={32} />
                                            ) : (
                                                <Upload className="text-slate-400" size={32} />
                                            )}
                                        </div>
                                        {files.length > 0 ? (
                                            <div className="space-y-2">
                                                {files.map((f, i) => (
                                                    <div key={i} className="text-left">
                                                        <h3 className="text-lg font-medium text-primary">{f.name}</h3>
                                                        <p className="text-slate-500 text-sm">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div>
                                                <h3 className="text-lg font-medium mb-2 text-slate-200">Select PDF file(s)</h3>
                                                <p className="text-slate-500">Support for PDF (Max 50MB each)</p>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {/* Upload Button */}
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || files.length === 0}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing Documents...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={20} />
                                            Upload & Index Documents
                                        </>
                                    )}
                                </button>

                                {/* Status Message */}
                                {status.message && (
                                    <div
                                        className={`p-4 rounded-lg flex items-center gap-3 ${status.type === "success"
                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                                            }`}
                                    >
                                        {status.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                        {status.message}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Document List */}
                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-200">
                                <Database className="text-primary" size={20} />
                                Active Knowledge Base
                            </h2>
                            <div className="space-y-3">
                                {loadingDocs ? (
                                    <div className="text-center py-8 text-slate-500">Loading documents...</div>
                                ) : documents.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <p>No documents indexed yet.</p>
                                        <p className="text-sm mt-2">Upload a PDF to get started.</p>
                                    </div>
                                ) : (
                                    documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    <FileText className="text-blue-400" size={20} />
                                                </div>
                                                <div>
                                                    <span className="font-medium block text-slate-200">{doc.filename}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {doc.subject} • {new Date(doc.upload_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                                Indexed
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-sm font-medium text-slate-400 uppercase mb-4">System Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-slate-300">Pinecone Index</span>
                                        <span className={`text-sm ${vectorStats ? "text-green-400" : "text-slate-500"}`}>
                                            {vectorStats ? "Connected" : "Connecting..."}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full w-full ${vectorStats ? "bg-green-500" : "bg-slate-700"}`}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-slate-300">Total Vectors</span>
                                        <span className="text-sm font-mono text-blue-400">
                                            {vectorStats ? vectorStats.total_vector_count.toLocaleString() : "-"}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-slate-300">Dimensions</span>
                                        <span className="text-sm font-mono text-purple-400">
                                            {vectorStats ? vectorStats.dimension : "-"}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-slate-300">Documents</span>
                                        <span className="text-sm text-slate-200">{documents.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                                <Server className="text-primary mt-1" size={20} />
                                <div>
                                    <h4 className="text-sm font-semibold text-primary mb-1">RAG Status</h4>
                                    <p className="text-xs text-slate-400">
                                        System is operating in <strong>RAG-ONLY</strong> mode. Questions are generated exclusively from the {documents.length}{" "}uploaded documents.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
