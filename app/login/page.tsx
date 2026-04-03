"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, loginWithGoogle } from "../../services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(""); // Đổi state thành username cho chuẩn
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Xử lý đăng nhập bằng Tên đăng nhập / Email
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // THỦ THUẬT 1: Đệm email ảo nếu người dùng chỉ nhập Username
    let finalEmail = username.trim().toLowerCase();
    if (!finalEmail.includes('@')) {
      finalEmail += '@space.internal';
    }

    // THỦ THUẬT 2: Đệm password bí mật để qua mặt luật 6 ký tự của Firebase
    const finalPassword = password + "SpaceVN@2026";

    try {
      // Truyền email và password ĐÃ ĐỆM vào service
      await login(finalEmail, finalPassword); 
      
      // Nếu chạy đến đây là thành công
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login fail:", err);
      setError("Sai tài khoản hoặc mật khẩu! Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError("Đăng nhập Google thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white selection:bg-indigo-500/30">
      <div className="max-w-md w-full p-8 bg-white/[0.02] border border-white/5 rounded-[32px] backdrop-blur-xl relative overflow-hidden shadow-2xl">
        
        {/* Ambient Glow */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-indigo-600/5 blur-[100px] pointer-events-none" />

        <div className="text-center mb-10 relative z-10">
          <h1 className="text-4xl font-semibold tracking-tighter mb-2 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Space Vietnam<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Control Center Access</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs text-center animate-in fade-in zoom-in duration-300 relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 relative z-10">
          <input
            type="text" // ĐỔI TỪ EMAIL SANG TEXT Ở ĐÂY
            placeholder="Tên đăng nhập hoặc Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all text-sm"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.2)] disabled:opacity-50 text-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Đang xác thực...</span>
              </div>
            ) : "Đăng nhập hệ thống"}
          </button>
        </form>

        <div className="mt-8 flex items-center relative z-10">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="px-4 text-[10px] text-zinc-600 font-bold tracking-widest">OR</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full mt-8 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white rounded-2xl font-medium transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm relative z-10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Đăng nhập với Google
        </button>
      </div>
    </div>
  );
}