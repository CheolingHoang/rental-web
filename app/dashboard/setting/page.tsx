"use client";

import { useState } from "react";
import { User, Key, Bell, Shield, Save, Database, Cpu } from "lucide-react";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleSave = () => {
    setIsSaving(true);
    // Giả lập thời gian lưu API
    setTimeout(() => {
      setIsSaving(false);
      alert("Đã lưu cấu hình thành công!");
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium tracking-widest text-indigo-400 uppercase">System Configuration</span>
          </div>
          <h2 className="text-3xl font-normal text-white tracking-tight">Cài đặt hệ thống</h2>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
        >
          {isSaving ? <Save className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar Menu Settings */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl border border-white/10 transition-all">
            <User className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-sm">Tài khoản & Hồ sơ</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all">
            <Cpu className="w-5 h-5" />
            <span className="font-medium text-sm">Tích hợp AI (API)</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all">
            <Database className="w-5 h-5" />
            <span className="font-medium text-sm">Cơ sở dữ liệu</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="font-medium text-sm">Thông báo</span>
          </button>
        </div>

        {/* Nội dung Settings */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section: Thông tin cá nhân */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Thông tin quản trị viên
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Họ và Tên</label>
                <input 
                  type="text" 
                  defaultValue="Quản trị viên" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Email liên hệ</label>
                <input 
                  type="email" 
                  defaultValue="admin@spacevietnam.com" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section: Cấu hình AI API Key */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" /> Cấu hình API Keys
            </h3>
            <p className="text-sm text-zinc-500 mb-6">Quản lý các khóa kết nối với dịch vụ bên thứ 3 (Google Gemini, Firebase...).</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Google Gemini API Key (Dùng cho OCR)</label>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..........................." 
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm transition-colors">
                    Kiểm tra
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1">Lưu ý: API Key nhập ở đây sẽ ghi đè lên biến môi trường .env.local</p>
              </div>
            </div>
          </div>

          {/* Section: Bảo mật */}
          <div className="bg-white/[0.02] border border-red-500/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-lg font-medium text-red-400 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Vùng nguy hiểm
            </h3>
            <p className="text-sm text-zinc-500 mb-4">Các hành động không thể hoàn tác.</p>
            <button className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm transition-all font-medium">
              Xóa toàn bộ Cache hệ thống
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Icon phụ trợ
function SettingsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}