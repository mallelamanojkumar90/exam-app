"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<"user" | "admin">("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (role === "admin") {
      // Admin login (mock for now as requested, or could be moved to backend too)
      setTimeout(() => {
        if (password === "admin123") {
          router.push("/admin");
        } else {
          alert("Invalid admin password (try 'admin123')");
          setLoading(false);
        }
      }, 1000);
      return;
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const payload = isLogin
        ? { username, password }
        : { username, password, full_name: fullName };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (isLogin) {
        localStorage.setItem("user", username);
        // Force navigation to ensure it happens
        window.location.href = "/dashboard";
      } else {
        alert("Account created successfully! Please login.");
        setIsLogin(true);
        setLoading(false);
      }
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Gradient/Pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-card/30 border border-white/10 shadow-2xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-lg shadow-primary/20"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              ExamAI
            </h1>
            <p className="text-muted-foreground text-sm">
              Premium IIT/JEE Preparation Platform
            </p>
          </div>

          <Tabs defaultValue="user" onValueChange={(v) => setRole(v as "user" | "admin")} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="user" className="gap-2">
                <User size={16} />
                Student
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Shield size={16} />
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleLogin} className="space-y-4">
            {role === "user" && (
              <div className="flex justify-center mb-4">
                <div className="bg-secondary/30 p-1 rounded-lg flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setUsername("");
                      setPassword("");
                      setFullName("");
                    }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isLogin ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setUsername("");
                      setPassword("");
                      setFullName("");
                    }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!isLogin ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {!isLogin && role === "user" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-secondary/30 border-white/10 focus:border-primary/50 transition-all"
                  required={!isLogin}
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                {role === "user" ? "Username" : "Admin ID"}
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === "user" ? "Enter your username" : "admin"}
                className="bg-secondary/30 border-white/10 focus:border-primary/50 transition-all"
                required
              />
            </div>

            {(role === "admin" || role === "user") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/30 border-white/10 focus:border-primary/50 transition-all"
                  required
                />
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25"
              size="lg"
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  {isLogin ? "Enter Platform" : "Create Account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Powered by Advanced RAG Technology</p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
