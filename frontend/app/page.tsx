"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { Send, Zap, Shield, BarChart3 } from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function LandingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("reachbox_token");
    if (token) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${apiBase}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Login failed. Check if API is running on correct port.`);
      }
      const data = await res.json();
      localStorage.setItem("reachbox_token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google login failed.");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Send size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ReachInbox</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 gap-16 relative z-10 py-12 lg:py-0">
        
        {/* Left text */}
        <div className="flex-1 space-y-8 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            ReachInbox Version 2.0
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            Automate your <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Email Outreach
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Schedule personalized campaigns at scale. Connect your Google account and let our powerful rate-limited engine handle the heavy lifting while you focus on replies.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 max-w-lg mx-auto lg:mx-0 text-left">
            <div className="flex items-start gap-3">
              <Zap className="text-indigo-400 mt-1" size={20} />
              <div>
                <h3 className="text-white font-medium">Smart Queues</h3>
                <p className="text-sm text-slate-400">BullMQ-powered persistence.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="text-purple-400 mt-1" size={20} />
              <div>
                <h3 className="text-white font-medium">Safe Limits</h3>
                <p className="text-sm text-slate-400">Auto-respects hourly caps.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right login card */}
        <div className="w-full max-w-md">
          <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-white/10 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 mx-auto lg:mx-0">
                <BarChart3 className="text-slate-300" size={24} />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 text-center lg:text-left">Welcome Back</h2>
              <p className="text-slate-400 mb-8 text-center lg:text-left">Sign in to your dashboard to manage your campaigns.</p>

              <div className="flex flex-col items-center lg:items-start gap-4">
                <div className="w-full flex justify-center lg:justify-start">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google login failed")}
                    theme="filled_black"
                    size="large"
                    shape="circle"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 w-full text-center">
                    {error}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2 text-center lg:text-left w-full">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
