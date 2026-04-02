"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, loginWithGoogle } from "../../services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: loginError } = await login(email, password); 
      if (loginError) {
        setError("Sai tài khoản hoặc mật khẩu! Vui lòng thử lại.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const { error: googleError } = await loginWithGoogle();
    
    if (googleError) {
      setError("Đăng nhập Google thất bại: " + googleError);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
      <div className="max-w-md w-full p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-indigo-600/5 blur-[100px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">Space Vietnam<span className="text-indigo-500">.</span></h1>
          <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">Không gian quản trị</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5 relative z-10">
          <div>
            <input
              type="email"
              placeholder="Email đăng nhập"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Mật khẩu bảo mật"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 text-sm mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Đang xử lý...
              </span>
            ) : "Đăng nhập bằng Email"}
          </button>
        </form>

        <div className="mt-6 flex items-center relative z-10">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="px-3 text-xs text-zinc-500 bg-transparent">HOẶC</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full mt-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm relative z-10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Tiếp tục với Google
        </button>
      </div>
    </div>
  );
}