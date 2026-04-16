import React, { useState } from 'react';
import { X, User, Palette, Shield, LogOut, Sun, Moon } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  session,
  isDarkMode,
  toggleTheme,
  handleLogout
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'appearance' | 'system'>('info');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-surface w-full max-w-3xl h-[500px] border border-border rounded-[8px] flex overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Sidebar */}
        <div className="w-1/3 bg-surface-container border-r border-border p-6 flex flex-col">
          <h2 className="text-[18px] font-bold text-text-main mb-8">Cài đặt</h2>
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[4px] text-[13px] font-medium transition-colors outline-none cursor-pointer ${activeTab === 'info' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-border/50 hover:text-text-main'}`}
            >
              <User size={16} /> Thông tin
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[4px] text-[13px] font-medium transition-colors outline-none cursor-pointer ${activeTab === 'appearance' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-border/50 hover:text-text-main'}`}
            >
              <Palette size={16} /> Giao diện
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[4px] text-[13px] font-medium transition-colors outline-none cursor-pointer ${activeTab === 'system' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-border/50 hover:text-text-main'}`}
            >
              <Shield size={16} /> Hệ thống
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-surface">
          {activeTab === 'info' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-[16px] font-bold text-text-main mb-6 uppercase tracking-[1px]">Thông tin Người dùng</h3>
              <div className="flex items-center gap-6 mb-8">
                <img 
                  src={session?.user?.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8kCfSQGNy3dkc1eKHzHZypr23j6JbZx8ACMFVV3ttw4j9r-LnJKDdwIwwoItdlqISRxXlRE8Hd8YCNs5NEbrltWBgIbooPAEnShPImk7lwdKBNBAZlnaoqdE46zCW4Zwv1JFGbu_l4CgIq1lZ8D0IolSACBPXvUoeOrOAUMNFq2sSiDn6xUNEoLc2dlCOv152EuhlhHLQKV8AfG1OKv7jsnBCNJwxZ3Bvr6jKqfyHmDXx5nN2k86fLG_ub6ckCgNHkVHh2s94pRM"}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border border-border object-cover bg-surface-container"
                />
                <div>
                  <p className="text-[18px] font-bold text-text-main">{session?.user?.user_metadata?.full_name || 'Người dùng'}</p>
                  <p className="text-[13px] text-text-muted mt-1">{session?.user?.email || 'Chưa cập nhật email'}</p>
                </div>
              </div>
              <div className="bg-surface-container border border-border rounded-[4px] p-4">
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Tài khoản của bạn được liên kết qua hệ thống xác thực. Để tiếp tục trải nghiệm an toàn, vui lòng không chia sẻ thông tin đăng nhập.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-[16px] font-bold text-text-main mb-6 uppercase tracking-[1px]">Cài đặt Giao diện</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => !isDarkMode && toggleTheme()}
                  className={`flex flex-col items-center justify-center p-6 border rounded-[8px] transition-all cursor-pointer outline-none ${!isDarkMode ? 'border-primary bg-primary/5' : 'border-border bg-surface-container hover:border-border-hover'}`}
                >
                  <Sun size={32} className={`mb-3 ${!isDarkMode ? 'text-primary' : 'text-text-muted'}`} />
                  <span className={`text-[13px] font-medium ${!isDarkMode ? 'text-primary' : 'text-text-secondary'}`}>Sáng (Light Mode)</span>
                </button>
                <button 
                  onClick={() => isDarkMode && toggleTheme()}
                  className={`flex flex-col items-center justify-center p-6 border rounded-[8px] transition-all cursor-pointer outline-none ${isDarkMode ? 'border-primary bg-primary/5' : 'border-border bg-surface-container hover:border-border-hover'}`}
                >
                  <Moon size={32} className={`mb-3 ${isDarkMode ? 'text-primary' : 'text-text-muted'}`} />
                  <span className={`text-[13px] font-medium ${isDarkMode ? 'text-primary' : 'text-text-secondary'}`}>Tối (Dark Mode)</span>
                </button>
              </div>
              <div className="mt-6 text-[13px] text-text-muted bg-surface-container rounded-[4px] p-4 border border-border">
                Giao diện sẽ được lưu trữ tự động trên thiết bị của bạn qua LocalStorage.
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-[16px] font-bold text-text-main mb-6 uppercase tracking-[1px]">Hệ thống</h3>
              <div className="bg-red-500/5 border border-red-500/20 rounded-[8px] p-6">
                <h4 className="text-[14px] font-bold text-red-500 mb-2">Đăng xuất tài khoản</h4>
                <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">
                  Hành động này sẽ đăng xuất tài khoản của bạn khỏi phiên làm việc hiện tại trên thiết bị. Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.
                </p>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-[4px] font-bold text-[13px] transition-colors cursor-pointer w-auto"
                >
                  <LogOut size={16} /> Đăng xuất ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
