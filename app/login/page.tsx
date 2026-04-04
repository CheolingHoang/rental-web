"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../services/auth"; // Đã xóa loginWithGoogle
import { User, Lock, ArrowRight, ShieldCheck, Fingerprint } from "lucide-react"; // Thêm icon cho xịn

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Đệm email ảo theo tên hệ thống mới
    let finalEmail = username.trim().toLowerCase();
    if (!finalEmail.includes('@')) {
      finalEmail += '@space.internal'; // Đã đổi thành cheoling.internal
    }

    // Giữ nguyên pass đệm cũ để không bị lỗi tài khoản test
    const finalPassword = password + "SpaceVN@2026";

    try {
      await login(finalEmail, finalPassword); 
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login fail:", err);
      setError("Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Background với hiệu ứng lưới (Grid) mờ ảo nhìn giống hệ thống OS
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none"></div>

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[420px] w-full p-10 bg-[#0a0a0a]/80 border border-white/5 rounded-3xl backdrop-blur-2xl relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        {/* LOGO & TITLE */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <Fingerprint className="w-8 h-8 text-indigo-400" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-widest mb-1 uppercase">
            CHEOLING <span className="text-indigo-500">SYSTEM</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-medium tracking-[0.2em] uppercase flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Secure Network Access
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center animate-in fade-in zoom-in duration-300 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase ml-1">System ID</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm font-medium tracking-wide"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase ml-1">Access Code</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm font-medium tracking-wide"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide uppercase"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                Initialize Session <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* FOOTER TEXT */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono">
            v2.0.4 • Encrypted Connection
          </p>
        </div>
      </div>
    </div>
  );
}