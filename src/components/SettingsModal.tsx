import React, { useState } from 'react';
import { X, User, Palette, Shield, LogOut, Sun, Moon, Download, AlertTriangle, Globe } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Task } from '../App';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  isDarkMode: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
  tasks: Task[];
  onClearAll: () => Promise<void>;
}

const translations = {
  vi: {
    settings: 'Cài đặt',
    info: 'Thông tin',
    appearance: 'Giao diện',
    system: 'Hệ thống',
    advanced: 'Nâng cao',
    userInfo: 'Thông tin Người dùng',
    notUpdated: 'Chưa cập nhật email',
    linkMsg: 'Tài khoản của bạn được liên kết qua hệ thống xác thực. Để tiếp tục trải nghiệm an toàn, vui lòng không chia sẻ thông tin đăng nhập.',
    appSettings: 'Cài đặt Giao diện',
    lightMode: 'Sáng (Light Mode)',
    darkMode: 'Tối (Dark Mode)',
    lang: 'Ngôn ngữ (Language)',
    langMsg: 'Chọn ngôn ngữ giao diện chính (Sẽ áp dụng một số khu vực)',
    themeMsg: 'Giao diện và ngôn ngữ sẽ được lưu trữ tự động trên thiết bị của bạn qua LocalStorage.',
    systemSettings: 'Hệ thống',
    logoutInfo: 'Hành động này sẽ đăng xuất tài khoản của bạn khỏi phiên làm việc hiện tại trên thiết bị. Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.',
    logoutBtn: 'Đăng xuất ngay',
    exportData: 'Xuất dữ liệu Kanban',
    exportBtn: 'Xuất file Excel (CSV)',
    clearData: 'Xóa toàn bộ dữ liệu',
    clearBtn: 'Xóa toàn bộ dữ liệu',
    clearWarning: 'Bạn có chắc chắn muốn xóa toàn bộ công việc không? Thao tác này không thể hoàn tác.',
    cancel: 'Hủy'
  },
  en: {
    settings: 'Settings',
    info: 'Information',
    appearance: 'Appearance',
    system: 'System',
    advanced: 'Advanced',
    userInfo: 'User Information',
    notUpdated: 'Email not updated',
    linkMsg: 'Your account is linked securely. Do not share your login credentials to continue having a safe experience.',
    appSettings: 'Appearance Settings',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    lang: 'Language',
    langMsg: 'Select primary user interface language (Applicable partially)',
    themeMsg: 'Your appearance and language preferences will be automatically saved locally.',
    systemSettings: 'System',
    logoutInfo: 'This action will log out your account from the current session on this device. You will need to log in again.',
    logoutBtn: 'Sign Out Now',
    exportData: 'Export Kanban Data',
    exportBtn: 'Export to Excel (CSV)',
    clearData: 'Clear All Data',
    clearBtn: 'Delete All Data',
    clearWarning: 'Are you sure you want to delete all tasks? This action cannot be undone.',
    cancel: 'Cancel'
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  session,
  isDarkMode,
  toggleTheme,
  handleLogout,
  language,
  setLanguage,
  tasks,
  onClearAll
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'appearance' | 'system' | 'advanced'>('info');
  const [confirmClear, setConfirmClear] = useState(false);
  const t = translations[language];

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const headers = ['Tên', 'Trạng thái', 'Độ ưu tiên', 'Ngày đến hạn'];
    const rows = tasks.map(task => [
      `"${task.title.replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.due_date ? `"${task.due_date}"` : 'N/A'
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tasks_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    await onClearAll();
    setConfirmClear(false);
  };

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
          <h2 className="text-[18px] font-bold text-text-main mb-8">{t.settings}</h2>
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[4px] text-[13px] font-medium transition-colors outline-none cursor-pointer ${activeTab === 'info' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-border/50 hover:text-text-main'}`}
            >
              <User size={16} /> {t.info}
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[4px] text-[13px] font-medium transition-colors outline-none cursor-pointer ${activeTab === 'appearance' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-border/50 hover:text-text-main'}`}
            >
              <Palette size={16} /> {t.appearance}
            </button>
            <button 
              onClick={() => setActiveTab('advanced')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[4px] text-[13px] font-medium transition-colors outline-none cursor-pointer ${activeTab === 'advanced' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-border/50 hover:text-text-main'}`}
            >
              <Shield size={16} /> {t.advanced}
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[4px] text-[13px] font-medium transition-colors outline-none cursor-pointer ${activeTab === 'system' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-border/50 hover:text-text-main'}`}
            >
              <LogOut size={16} /> {t.system}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-surface">
          {activeTab === 'info' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-[16px] font-bold text-text-main mb-6 uppercase tracking-[1px]">{t.userInfo}</h3>
              <div className="flex items-center gap-6 mb-8">
                <img 
                  src={session?.user?.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8kCfSQGNy3dkc1eKHzHZypr23j6JbZx8ACMFVV3ttw4j9r-LnJKDdwIwwoItdlqISRxXlRE8Hd8YCNs5NEbrltWBgIbooPAEnShPImk7lwdKBNBAZlnaoqdE46zCW4Zwv1JFGbu_l4CgIq1lZ8D0IolSACBPXvUoeOrOAUMNFq2sSiDn6xUNEoLc2dlCOv152EuhlhHLQKV8AfG1OKv7jsnBCNJwxZ3Bvr6jKqfyHmDXx5nN2k86fLG_ub6ckCgNHkVHh2s94pRM"}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border border-border object-cover bg-surface-container"
                />
                <div>
                  <p className="text-[18px] font-bold text-text-main">{session?.user?.user_metadata?.full_name || 'Người dùng'}</p>
                  <p className="text-[13px] text-text-muted mt-1">{session?.user?.email || t.notUpdated}</p>
                </div>
              </div>
              <div className="bg-surface-container border border-border rounded-[4px] p-4">
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  {t.linkMsg}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-[16px] font-bold text-text-main mb-6 uppercase tracking-[1px]">{t.appSettings}</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => !isDarkMode && toggleTheme()}
                  className={`flex flex-col items-center justify-center p-6 border rounded-[8px] transition-all cursor-pointer outline-none ${!isDarkMode ? 'border-primary bg-primary/5' : 'border-border bg-surface-container hover:border-border-hover'}`}
                >
                  <Sun size={32} className={`mb-3 ${!isDarkMode ? 'text-primary' : 'text-text-muted'}`} />
                  <span className={`text-[13px] font-medium ${!isDarkMode ? 'text-primary' : 'text-text-secondary'}`}>{t.lightMode}</span>
                </button>
                <button 
                  onClick={() => isDarkMode && toggleTheme()}
                  className={`flex flex-col items-center justify-center p-6 border rounded-[8px] transition-all cursor-pointer outline-none ${isDarkMode ? 'border-primary bg-primary/5' : 'border-border bg-surface-container hover:border-border-hover'}`}
                >
                  <Moon size={32} className={`mb-3 ${isDarkMode ? 'text-primary' : 'text-text-muted'}`} />
                  <span className={`text-[13px] font-medium ${isDarkMode ? 'text-primary' : 'text-text-secondary'}`}>{t.darkMode}</span>
                </button>
              </div>

              <h4 className="text-[13px] font-bold text-text-main mb-3">{t.lang}</h4>
              <div className="flex gap-3 mb-2">
                <button
                  onClick={() => setLanguage('vi')}
                  className={`flex-1 py-2 px-4 rounded-[4px] font-bold text-[12px] uppercase transition-colors outline-none cursor-pointer border ${language === 'vi' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-secondary hover:border-border-hover'}`}
                >
                  Tiếng Việt
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 px-4 rounded-[4px] font-bold text-[12px] uppercase transition-colors outline-none cursor-pointer border ${language === 'en' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-secondary hover:border-border-hover'}`}
                >
                  English
                </button>
              </div>
              <p className="text-[11px] text-text-muted mb-8">{t.langMsg}</p>

              <div className="mt-6 text-[13px] text-text-muted bg-surface-container rounded-[4px] p-4 border border-border">
                {t.themeMsg}
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-[16px] font-bold text-text-main mb-6 uppercase tracking-[1px]">{t.advanced}</h3>
              
              <div className="mb-8 p-4 border border-border rounded-[8px] bg-surface-container">
                <div className="flex items-center gap-3 mb-2">
                  <Download className="text-primary" size={18} />
                  <h4 className="text-[14px] font-bold text-text-main">{t.exportData}</h4>
                </div>
                <p className="text-[13px] text-text-secondary mb-4 leading-relaxed">
                  Trích xuất toàn bộ Kanban Task hiện tại thành file Excel dạng CSV để lưu trữ hoặc chia sẻ.
                </p>
                <button
                  onClick={handleExportCSV}
                  className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background px-4 py-2.5 rounded-[4px] font-bold text-[13px] transition-colors cursor-pointer w-auto"
                >
                  {t.exportBtn}
                </button>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-[8px] p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="text-red-500" size={18} />
                  <h4 className="text-[14px] font-bold text-red-500">{t.clearData}</h4>
                </div>
                
                {!confirmClear ? (
                  <>
                    <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">
                      Xóa triệt để toàn bộ thẻ công việc trên bảng Kanban. Hành động này sẽ gọi trực tiếp lên Supabase API và không thể phục hồi.
                    </p>
                    <button
                      onClick={handleClear}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-[4px] font-bold text-[13px] transition-colors cursor-pointer w-auto"
                    >
                      {t.clearBtn}
                    </button>
                  </>
                ) : (
                  <div className="animate-in slide-in-from-top-2">
                    <p className="text-[13px] font-bold text-red-500 mb-4 bg-red-500/10 p-3 rounded-[4px] border border-red-500/20">
                      {t.clearWarning}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleClear}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-[4px] font-bold text-[13px] transition-colors cursor-pointer flex-1"
                      >
                        Xác nhận Xóa
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="bg-surface-container hover:bg-border text-text-main border border-border px-4 py-2.5 rounded-[4px] font-bold text-[13px] transition-colors cursor-pointer flex-1"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-[16px] font-bold text-text-main mb-6 uppercase tracking-[1px]">{t.systemSettings}</h3>
              <div className="bg-surface-container border border-border rounded-[8px] p-6">
                <h4 className="text-[14px] font-bold text-text-main mb-2">Đăng xuất tài khoản</h4>
                <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">
                  {t.logoutInfo}
                </p>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 bg-text-main text-background hover:opacity-90 px-4 py-2.5 rounded-[4px] font-bold text-[13px] transition-colors cursor-pointer w-auto"
                >
                  <LogOut size={16} /> {t.logoutBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
