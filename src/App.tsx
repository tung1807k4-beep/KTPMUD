import React, { useState, useEffect, useMemo } from 'react';
import {
  PenTool,
  LayoutGrid,
  ClipboardList,
  Users,
  BarChart2,
  Archive,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  Filter,
  Plus,
  PlusCircle,
  Calendar,
  CheckCircle2,
  CheckCircle,
  Trash2,
  X,
  Edit2,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { supabase } from './supabase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Session } from '@supabase/supabase-js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { SettingsModal } from './components/SettingsModal';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  created_at: string;
  due_date?: string | null;
};

const translations = {
  vi: {
    dashboard: 'Bảng điều khiển',
    projects: 'Dự án',
    team: 'Nhóm',
    analytics: 'Phân tích',
    archive: 'Lưu trữ',
    newProject: 'Dự án mới',
    help: 'Trợ giúp',
    chiefArchitect: 'Kiến trúc sư Trưởng',
    searchPlaceholder: 'Tìm kiếm công việc...',
    notifications: 'Thông báo',
    markAllRead: 'Đánh dấu đã đọc tất cả',
    noNewNotif: 'Không có thông báo mới',
    version: 'V2.4.0 • 2024',
    greeting: 'Chào buổi sáng',
    projectBoard: 'Bảng Dự Án',
    workspace: 'Không gian làm việc tối giản / Giai đoạn Q4',
    workspaceSubtitle: 'Không gian làm việc của',
    allPriorities: 'Tất cả độ ưu tiên',
    priorityHighFilter: 'Ưu tiên: Cao',
    priorityMedFilter: 'Ưu tiên: Trung bình',
    priorityLowFilter: 'Ưu tiên: Thấp',
    addTask: 'Thêm công việc',
    todo: 'Cần làm',
    doing: 'Đang làm',
    done: 'Hoàn thành',
    featureDev: 'Tính năng đang được phát triển',
    statistics: 'Thống kê',
    overview: 'Tổng quan về tiến độ công việc',
    totalTasks: 'Tổng công việc',
    statusRatio: 'Tỷ lệ trạng thái',
    priorityDistribution: 'Phân bố độ ưu tiên',
    noTaskData: 'Chưa có dữ liệu công việc',
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp',
    addNewTaskTitle: 'Thêm công việc mới',
    editTaskTitle: 'Chỉnh sửa công việc',
    taskTitlePlaceholder: 'Nhập tiêu đề công việc...',
    taskDescPlaceholder: 'Nhập mô tả chi tiết...',
    titleLabel: 'Tiêu đề',
    descLabel: 'Mô tả',
    statusLabel: 'Trạng thái',
    priorityLabel: 'Độ ưu tiên',
    dueDateLabel: 'Ngày đến hạn',
    cancel: 'Hủy',
    addNew: 'Thêm mới',
    saveChanges: 'Lưu thay đổi',
    overdue: 'Quá hạn: ',
    dueSoon: 'Sắp đến hạn: ',
    deadline: 'Hạn chót: ',
    closedAt: 'Đóng lúc ',
    adminPro: 'Quản trị Pro',
    enterprisePlan: 'Gói Doanh nghiệp',
    loginGoogle: 'Đăng nhập bằng Google',
    loginMessage: 'Đăng nhập để truy cập không gian làm việc của bạn',
    toastAddSuccess: 'Thêm công việc thành công!'
  },
  en: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    team: 'Team',
    analytics: 'Analytics',
    archive: 'Archive',
    newProject: 'New Project',
    help: 'Help',
    chiefArchitect: 'Chief Architect',
    searchPlaceholder: 'Search tasks...',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNewNotif: 'No new notifications',
    version: 'V2.4.0 • 2024',
    greeting: 'Good morning',
    projectBoard: 'Project Board',
    workspace: 'Minimalist Workspace / Q4 Phase',
    workspaceSubtitle: 'Workspace of',
    allPriorities: 'All Priorities',
    priorityHighFilter: 'Priority: High',
    priorityMedFilter: 'Priority: Medium',
    priorityLowFilter: 'Priority: Low',
    addTask: 'Add task',
    todo: 'To Do',
    doing: 'Doing',
    done: 'Done',
    featureDev: 'Feature under development',
    statistics: 'Statistics',
    overview: 'Work progress overview',
    totalTasks: 'Total Tasks',
    statusRatio: 'Status Ratio',
    priorityDistribution: 'Priority Distribution',
    noTaskData: 'No task data available',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    addNewTaskTitle: 'Add New Task',
    editTaskTitle: 'Edit Task',
    taskTitlePlaceholder: 'Enter task title...',
    taskDescPlaceholder: 'Enter detailed description...',
    titleLabel: 'Title',
    descLabel: 'Description',
    statusLabel: 'Status',
    priorityLabel: 'Priority',
    dueDateLabel: 'Due Date',
    cancel: 'Cancel',
    addNew: 'Add New',
    saveChanges: 'Save Changes',
    overdue: 'Overdue: ',
    dueSoon: 'Due soon: ',
    deadline: 'Deadline: ',
    closedAt: 'Closed at ',
    adminPro: 'Admin Pro',
    enterprisePlan: 'Enterprise Plan',
    loginGoogle: 'Sign in with Google',
    loginMessage: 'Sign in to access your workspace',
    toastAddSuccess: 'Task added successfully!'
  }
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'team' | 'analytics' | 'archive'>('projects');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'TRUNG BÌNH',
    due_date: ''
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('language') as 'vi' | 'en';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(initialDark);
    if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newDark = !prev;
      if (newDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newDark;
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    fetchTasks();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => {
              if (prev.find(t => t.id === payload.new.id)) return prev;
              const updated = [payload.new as Task, ...prev];
              return updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            });
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notifs: { type: 'overdue' | 'due_soon', task: Task, diffDays: number }[] = [];
    
    tasks.forEach(task => {
      if (task.status === 'done' || !task.due_date || dismissedNotifIds.includes(task.id)) return;
      
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        notifs.push({ type: 'overdue', task, diffDays });
      } else if (diffDays <= 1) {
        notifs.push({ type: 'due_soon', task, diffDays });
      }
    });
    
    return notifs.sort((a, b) => a.diffDays - b.diffDays);
  }, [tasks, dismissedNotifIds]);

  const markAllAsRead = () => {
    setDismissedNotifIds(prev => [...prev, ...notifications.map(n => n.task.id)]);
    setIsNotifOpen(false);
  };

  const fetchTasks = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Error logging in:', error.message);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !session) return;

    const tempId = `temp-${Date.now()}`;
    const taskToAdd: Task = {
      id: tempId,
      title: newTask.title,
      description: newTask.description || '',
      status: (newTask.status as 'todo' | 'doing' | 'done') || 'todo',
      priority: (newTask.priority as 'CAO' | 'TRUNG BÌNH' | 'THẤP') || 'TRUNG BÌNH',
      created_at: new Date().toISOString(),
      due_date: newTask.due_date || null,
    };

    const previousTasks = [...tasks];
    setTasks(prev => [taskToAdd, ...prev]);
    setIsModalOpen(false);
    setNewTask({ title: '', description: '', status: 'todo', priority: 'TRUNG BÌNH', due_date: '' });

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: taskToAdd.title,
          description: taskToAdd.description,
          status: taskToAdd.status,
          priority: taskToAdd.priority,
          due_date: taskToAdd.due_date,
          user_id: session.user.id
        }
      ])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      showToast('Có lỗi xảy ra khi thêm công việc. Vui lòng thử lại.', 'error');
      setTasks(previousTasks);
    } else if (data && data.length > 0) {
      setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t));
      showToast(translations[language].toastAddSuccess);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!session) return;
    
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
      
    if (error) {
      console.error('Error deleting task:', error);
      showToast('Có lỗi xảy ra khi xóa công việc. Vui lòng thử lại.', 'error');
      setTasks(previousTasks);
    } else {
      showToast('Đã xóa công việc!');
    }
  };

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !session) return;

    const previousTasks = [...tasks];
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        due_date: editingTask.due_date || null,
      })
      .eq('id', editingTask.id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating task:', error);
      showToast('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.', 'error');
      setTasks(previousTasks);
    } else {
      showToast('Cập nhật công việc thành công!');
    }
  };

  const handleClearAllTasks = async () => {
    if (!session) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('user_id', session.user.id);
      if (error) throw error;
      setTasks([]);
      showToast(language === 'en' ? 'All data cleared successfully!' : 'Đã xóa toàn bộ dữ liệu thành công!', 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showToast(language === 'en' ? 'Failed to clear data.' : 'Lỗi khi xóa dữ liệu. Vui lòng thử lại.', 'error');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !session) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as 'todo' | 'doing' | 'done';
      
      const previousTasks = [...tasks];
      
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', draggableId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating task status:', error);
        showToast('Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.', 'error');
        setTasks(previousTasks); // Revert on error
      } else {
        showToast('Đã cập nhật trạng thái!');
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const doingTasks = filteredTasks.filter(t => t.status === 'doing');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const renderTaskCard = (task: Task, index: number) => {
    const isDone = task.status === 'done';
    
    let dateColorClass = 'text-text-muted';
    let displayDate = 'Chưa có hạn';

    if (task.due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      displayDate = dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });

      if (!isDone) {
        if (diffDays < 0) {
          dateColorClass = 'text-red-500 font-medium';
        } else if (diffDays <= 1) {
          dateColorClass = 'text-orange-500 font-medium';
        }
      }
    }

    return (
      // @ts-ignore
      <Draggable key={task.id} draggableId={task.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-surface-container border border-border p-6 rounded-[4px] hover:border-border-hover transition-all group cursor-pointer mb-4 ${isDone ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.5px] border border-white/10 ${
                task.priority === 'CAO' ? 'text-primary border-primary' :
                task.priority === 'TRUNG BÌNH' ? 'text-text-secondary border-border-hover' :
                'text-text-muted border-border-hover'
              }`}>
                {isDone ? 'ĐÃ HOÀN THÀNH' : task.priority}
              </span>
              <div className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="text-text-muted" size={16} />
                ) : null}
                <button 
                  onClick={() => setEditingTask(task)}
                  className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h4 className={`text-[14px] mb-2 ${isDone ? 'text-text-muted line-through' : 'text-text-main'}`}>
              {task.title}
            </h4>
            <p className={`text-[12px] line-clamp-2 mb-5 ${isDone ? 'text-text-muted' : 'text-text-secondary'}`}>
              {task.description}
            </p>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className={`flex items-center gap-2 ${dateColorClass}`}>
                {isDone ? <CheckCircle size={12} /> : <Calendar size={12} />}
                <span className="text-[11px]">
                  {isDone ? translations[language].closedAt : ''}
                  {displayDate}
                </span>
              </div>
              <img className={`w-6 h-6 rounded-full border border-border-hover bg-border ${isDone ? 'opacity-50' : ''}`} src={session?.user?.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuCYt5asm6KLGQ6xl7p8LEaRCH1RcRiVP5DH3IVYc2aYKrB14RgfKrGSM-7F8RZ8plNQQG4zE5dt1lVuope_1KOVdfIzRAH0JHb4uSwXiy7Fcy0nMVlieqcfbDJXSvi1r-0tHiCfAwLaGBBpL2gNrEI9gyUij8xkz0YmEea87xI6eYilZWqaTBo8h8s-wahZjerZodgpd8yYyNd-cpWbI1fC0bvGMImMM-q5U6VjOI6EFZA07UkzNGo6s9BWd1QXdAbggTb548jX47I"} alt="Assignee" />
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  if (!session) {
    return (
      <div className="bg-background text-text-main antialiased min-h-screen flex items-center justify-center font-sans">
        <div className="bg-surface border border-border p-10 rounded-[4px] w-full max-w-md flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
            <PenTool size={32} />
          </div>
          <h1 className="text-[24px] font-bold text-text-main tracking-[2px] uppercase mb-2">{translations[language].adminPro}</h1>
          <p className="text-[13px] text-text-secondary mb-10">{translations[language].loginMessage}</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-surface-container border border-border hover:border-primary text-text-main py-3 px-4 rounded-[4px] flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            <span className="text-[13px] font-medium">{translations[language].loginGoogle}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-text-main antialiased min-h-screen flex font-sans">
      {/* SideNavBar Component */}
      <aside className="flex flex-col h-screen fixed left-0 top-0 py-10 px-6 border-r border-border bg-surface w-60 z-40">
        <div className="mb-[60px] flex items-center gap-3">
          <div className="text-primary">
            <PenTool size={24} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-primary tracking-[4px] uppercase">{translations[language].adminPro}</h2>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mt-1">{translations[language].enterprisePlan}</p>
          </div>
        </div>
        <nav className="flex-1">
          <ul className="list-none p-0 m-0">
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'dashboard' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'dashboard' ? 'opacity-100' : 'opacity-0'}`}></div>
                <LayoutGrid size={16} />
                <span>{translations[language].dashboard}</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('projects')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'projects' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'projects' ? 'opacity-100' : 'opacity-0'}`}></div>
                <ClipboardList size={16} />
                <span>{translations[language].projects}</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('team')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'team' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'team' ? 'opacity-100' : 'opacity-0'}`}></div>
                <Users size={16} />
                <span>{translations[language].team}</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('analytics')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'analytics' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'analytics' ? 'opacity-100' : 'opacity-0'}`}></div>
                <BarChart2 size={16} />
                <span>{translations[language].analytics}</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('archive')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'archive' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'archive' ? 'opacity-100' : 'opacity-0'}`}></div>
                <Archive size={16} />
                <span>{translations[language].archive}</span>
              </button>
            </li>
          </ul>
        </nav>
        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-transparent border border-border-hover text-text-main py-2 px-3 text-[11px] uppercase cursor-pointer hover:border-primary transition-colors"
          >
            {translations[language].newProject}
          </button>
          <a className="flex items-center gap-3 text-[13px] uppercase tracking-[1px] text-text-muted hover:text-text-main transition-colors cursor-pointer" href="#">
            <HelpCircle size={16} />
            <span>{translations[language].help}</span>
          </a>
          <div className="text-[10px] text-text-muted tracking-[1px] mt-2">
            {translations[language].version}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-60 flex-1 min-h-screen flex flex-col p-10">
        {/* TopNavBar Component */}
        <header className="flex justify-between items-center w-full mb-12">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-[32px] font-light tracking-[-1px] text-text-main">{translations[language].chiefArchitect}</h1>
            <div className="relative w-full max-w-md ml-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                className="w-full bg-surface-container border border-border rounded-[4px] py-2 pl-10 pr-4 focus:border-primary transition-all text-[13px] text-text-main outline-none" 
                placeholder={translations[language].searchPlaceholder} 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="text-text-muted hover:text-text-main transition-colors relative"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 bg-surface border border-border rounded-[8px] shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-container">
                      <h3 className="text-[13px] font-bold text-text-main">{translations[language].notifications}</h3>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[11px] text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        >
                          {translations[language].markAllRead}
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        <ul className="flex flex-col">
                          {notifications.map((notif, idx) => (
                            <li key={`${notif.task.id}-${idx}`} className="px-4 py-3 border-b border-border hover:bg-surface-container transition-colors last:border-b-0">
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 text-[14px]">
                                  {notif.type === 'overdue' ? '🔴' : '🟠'}
                                </span>
                                <div className="flex-1">
                                  <p className="text-[13px] text-text-main leading-tight mb-1">
                                    <span className="font-semibold">{notif.type === 'overdue' ? translations[language].overdue : translations[language].dueSoon}</span>
                                    {notif.task.title}
                                  </p>
                                  <p className="text-[11px] text-text-muted">
                                    {translations[language].deadline}{new Date(notif.task.due_date!).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-[13px] text-text-muted">{translations[language].noNewNotif}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              <Settings size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-text-secondary">{translations[language].greeting}, {session.user?.user_metadata?.full_name || 'Người dùng'}</span>
              <img 
                alt="User profile avatar" 
                className="w-8 h-8 rounded-full object-cover border border-border-hover bg-border" 
                src={session.user?.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuB8kCfSQGNy3dkc1eKHzHZypr23j6JbZx8ACMFVV3ttw4j9r-LnJKDdwIwwoItdlqISRxXlRE8Hd8YCNs5NEbrltWBgIbooPAEnShPImk7lwdKBNBAZlnaoqdE46zCW4Zwv1JFGbu_l4CgIq1lZ8D0IolSACBPXvUoeOrOAUMNFq2sSiDn6xUNEoLc2dlCOv152EuhlhHLQKV8AfG1OKv7jsnBCNJwxZ3Bvr6jKqfyHmDXx5nN2k86fLG_ub6ckCgNHkVHh2s94pRM"} 
              />
            </div>
          </div>
        </header>

        {/* View Content */}
        {currentView === 'projects' && (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[11px] uppercase tracking-[2px] text-text-dim mb-2">{translations[language].projectBoard}</h2>
                <p className="text-[14px] text-text-secondary">{translations[language].workspaceSubtitle} {session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || translations[language].information || 'Bạn'}</p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-transparent border border-border-hover rounded-[4px] px-3 py-1.5 focus-within:border-primary transition-colors">
                  <Filter size={14} className="text-text-muted" />
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-transparent text-[11px] uppercase text-text-main outline-none cursor-pointer appearance-none"
                  >
                    <option value="ALL" className="bg-surface">{translations[language].allPriorities}</option>
                    <option value="CAO" className="bg-surface">{translations[language].priorityHighFilter}</option>
                    <option value="TRUNG BÌNH" className="bg-surface">{translations[language].priorityMedFilter}</option>
                    <option value="THẤP" className="bg-surface">{translations[language].priorityLowFilter}</option>
                  </select>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-transparent border border-border-hover text-text-main py-1.5 px-3 text-[11px] uppercase cursor-pointer hover:border-primary transition-colors flex items-center gap-2"
                >
                  <Plus size={14} /> {translations[language].addTask}
                </button>
              </div>
            </div>

            {/* Board Columns */}
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column: Cần làm */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] uppercase tracking-[2px] text-text-dim">{translations[language].todo}</h3>
                      <span className="text-[11px] text-text-muted">({todoTasks.length})</span>
                    </div>
                    <button 
                      onClick={() => { setNewTask({...newTask, status: 'todo'}); setIsModalOpen(true); }}
                      className="text-text-muted hover:text-text-main transition-colors"
                    >
                      <PlusCircle size={16} />
                    </button>
                  </div>
                  <Droppable droppableId="todo">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="min-h-[200px]"
                      >
                        {todoTasks.map((task, index) => renderTaskCard(task, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Column: Đang làm */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] uppercase tracking-[2px] text-text-dim">{translations[language].doing}</h3>
                      <span className="text-[11px] text-text-muted">({doingTasks.length})</span>
                    </div>
                    <button 
                      onClick={() => { setNewTask({...newTask, status: 'doing'}); setIsModalOpen(true); }}
                      className="text-text-muted hover:text-text-main transition-colors"
                    >
                      <PlusCircle size={16} />
                    </button>
                  </div>
                  <Droppable droppableId="doing">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="min-h-[200px]"
                      >
                        {doingTasks.map((task, index) => renderTaskCard(task, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Column: Hoàn thành */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] uppercase tracking-[2px] text-text-dim">{translations[language].done}</h3>
                      <span className="text-[11px] text-text-muted">({doneTasks.length})</span>
                    </div>
                    <button 
                      onClick={() => { setNewTask({...newTask, status: 'done'}); setIsModalOpen(true); }}
                      className="text-text-muted hover:text-text-main transition-colors"
                    >
                      <PlusCircle size={16} />
                    </button>
                  </div>
                  <Droppable droppableId="done">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="min-h-[200px]"
                      >
                        {doneTasks.map((task, index) => renderTaskCard(task, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

              </div>
            </DragDropContext>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-[4px]">
            <div className="text-center">
              <LayoutGrid className="mx-auto mb-4 text-text-muted" size={32} />
              <h2 className="text-[18px] text-text-main font-bold mb-2">{translations[language].dashboard}</h2>
              <p className="text-[13px] text-text-secondary">{translations[language].featureDev}</p>
            </div>
          </div>
        )}

        {currentView === 'team' && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-[4px]">
            <div className="text-center">
              <Users className="mx-auto mb-4 text-text-muted" size={32} />
              <h2 className="text-[18px] text-text-main font-bold mb-2">{translations[language].team}</h2>
              <p className="text-[13px] text-text-secondary">{translations[language].featureDev}</p>
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="flex-1 flex flex-col">
            <div className="mb-8">
              <h2 className="text-[11px] uppercase tracking-[2px] text-text-dim mb-2">{translations[language].statistics}</h2>
              <p className="text-[14px] text-text-secondary">{translations[language].overview}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-surface-container border border-border p-6 rounded-[4px]">
                <h3 className="text-[11px] uppercase tracking-[1px] text-text-muted mb-2">{translations[language].totalTasks}</h3>
                <p className="text-[32px] font-light text-text-main">{tasks.length}</p>
              </div>
              <div className="bg-surface-container border border-border p-6 rounded-[4px]">
                <h3 className="text-[11px] uppercase tracking-[1px] text-text-muted mb-2">{translations[language].todo}</h3>
                <p className="text-[32px] font-light text-text-main">{tasks.filter(t => t.status === 'todo').length}</p>
              </div>
              <div className="bg-surface-container border border-border p-6 rounded-[4px]">
                <h3 className="text-[11px] uppercase tracking-[1px] text-text-muted mb-2">{translations[language].doing}</h3>
                <p className="text-[32px] font-light text-primary">{tasks.filter(t => t.status === 'doing').length}</p>
              </div>
              <div className="bg-surface-container border border-border p-6 rounded-[4px]">
                <h3 className="text-[11px] uppercase tracking-[1px] text-text-muted mb-2">{translations[language].done}</h3>
                <p className="text-[32px] font-light text-green-500">{tasks.filter(t => t.status === 'done').length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
              <div className="bg-surface-container border border-border p-6 rounded-[4px] flex flex-col">
                <h3 className="text-[13px] uppercase tracking-[1px] text-text-main mb-6">{translations[language].statusRatio}</h3>
                <div className="flex-1 w-full min-h-[300px]">
                  {tasks.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: translations[language].todo, value: tasks.filter(t => t.status === 'todo').length, color: '#666666' },
                            { name: translations[language].doing, value: tasks.filter(t => t.status === 'doing').length, color: '#c5a059' },
                            { name: translations[language].done, value: tasks.filter(t => t.status === 'done').length, color: '#22c55e' },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {
                            [
                              { name: translations[language].todo, value: tasks.filter(t => t.status === 'todo').length, color: '#666666' },
                              { name: translations[language].doing, value: tasks.filter(t => t.status === 'doing').length, color: '#c5a059' },
                              { name: translations[language].done, value: tasks.filter(t => t.status === 'done').length, color: '#22c55e' },
                            ].filter(d => d.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: isDarkMode ? '#0d0d0d' : '#ffffff', borderColor: isDarkMode ? '#1a1a1a' : '#e5e7eb', borderRadius: '4px', color: isDarkMode ? '#fff' : '#111827' }}
                          itemStyle={{ color: isDarkMode ? '#fff' : '#111827' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[13px] text-text-muted">
                      {translations[language].noTaskData}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface-container border border-border p-6 rounded-[4px] flex flex-col">
                <h3 className="text-[13px] uppercase tracking-[1px] text-text-main mb-6">{translations[language].priorityDistribution}</h3>
                <div className="flex-1 w-full min-h-[300px]">
                  {tasks.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: translations[language].high, value: tasks.filter(t => t.priority === 'CAO').length, color: '#ef4444' },
                          { name: translations[language].medium, value: tasks.filter(t => t.priority === 'TRUNG BÌNH').length, color: '#f97316' },
                          { name: translations[language].low, value: tasks.filter(t => t.priority === 'THẤP').length, color: '#666666' },
                        ]}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1a1a1a' : '#e5e7eb'} vertical={false} />
                        <XAxis dataKey="name" stroke={isDarkMode ? '#666666' : '#9ca3af'} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={isDarkMode ? '#666666' : '#9ca3af'} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: isDarkMode ? '#0d0d0d' : '#ffffff', borderColor: isDarkMode ? '#1a1a1a' : '#e5e7eb', borderRadius: '4px', color: isDarkMode ? '#fff' : '#111827' }}
                          itemStyle={{ color: isDarkMode ? '#fff' : '#111827' }}
                          cursor={{ fill: isDarkMode ? '#1a1a1a' : '#f3f4f6' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {
                            [
                              { name: translations[language].high, value: tasks.filter(t => t.priority === 'CAO').length, color: '#ef4444' },
                              { name: translations[language].medium, value: tasks.filter(t => t.priority === 'TRUNG BÌNH').length, color: '#f97316' },
                              { name: translations[language].low, value: tasks.filter(t => t.priority === 'THẤP').length, color: '#666666' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[13px] text-text-muted">
                      {translations[language].noTaskData}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'archive' && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-[4px]">
            <div className="text-center">
              <Archive className="mx-auto mb-4 text-text-muted" size={32} />
              <h2 className="text-[18px] text-text-main font-bold mb-2">{translations[language].archive}</h2>
              <p className="text-[13px] text-text-secondary">{translations[language].featureDev}</p>
            </div>
          </div>
        )}
      </main>

      {/* FAB for Task Entry */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-12 h-12 bg-surface-container border border-border text-text-main rounded-full shadow-lg flex items-center justify-center hover:border-primary transition-all z-40"
      >
        <Plus size={20} />
      </button>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-surface border border-border p-8 rounded-[4px] w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] text-text-main font-bold">{translations[language].addNewTaskTitle}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].titleLabel}</label>
                <input 
                  required
                  type="text" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none"
                  placeholder={translations[language].taskTitlePlaceholder}
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].descLabel}</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none min-h-[100px] resize-none"
                  placeholder={translations[language].taskDescPlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].statusLabel}</label>
                  <select 
                    value={newTask.status}
                    onChange={e => setNewTask({...newTask, status: e.target.value as any})}
                    className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none appearance-none"
                  >
                    <option value="todo">{translations[language].todo}</option>
                    <option value="doing">{translations[language].doing}</option>
                    <option value="done">{translations[language].done}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].priorityLabel}</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none appearance-none"
                  >
                    <option value="CAO">{translations[language].high}</option>
                    <option value="TRUNG BÌNH">{translations[language].medium}</option>
                    <option value="THẤP">{translations[language].low}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].dueDateLabel}</label>
                <input 
                  type="date" 
                  value={newTask.due_date || ''}
                  onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none"
                />
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent border border-border-hover text-text-main py-2 px-4 text-[11px] uppercase cursor-pointer hover:border-text-muted transition-colors"
                >
                  {translations[language].cancel}
                </button>
                <button 
                  type="submit"
                  className="bg-primary text-background py-2 px-4 text-[11px] uppercase font-bold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {translations[language].addNew}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-surface border border-border p-8 rounded-[4px] w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] text-text-main font-bold">{translations[language].editTaskTitle}</h3>
              <button onClick={() => setEditingTask(null)} className="text-text-muted hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={updateTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].titleLabel}</label>
                <input 
                  required
                  type="text" 
                  value={editingTask.title}
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none"
                  placeholder={translations[language].taskTitlePlaceholder}
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].descLabel}</label>
                <textarea 
                  value={editingTask.description}
                  onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none min-h-[100px] resize-none"
                  placeholder={translations[language].taskDescPlaceholder}
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].priorityLabel}</label>
                <select 
                  value={editingTask.priority}
                  onChange={e => setEditingTask({...editingTask, priority: e.target.value as any})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none appearance-none"
                >
                  <option value="CAO">{translations[language].high}</option>
                  <option value="TRUNG BÌNH">{translations[language].medium}</option>
                  <option value="THẤP">{translations[language].low}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">{translations[language].dueDateLabel}</label>
                <input 
                  type="date" 
                  value={editingTask.due_date || ''}
                  onChange={e => setEditingTask({...editingTask, due_date: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none"
                />
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTask(null)}
                  className="bg-transparent border border-border-hover text-text-main py-2 px-4 text-[11px] uppercase cursor-pointer hover:border-text-muted transition-colors"
                >
                  {translations[language].cancel}
                </button>
                <button 
                  type="submit"
                  className="bg-primary text-background py-2 px-4 text-[11px] uppercase font-bold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {translations[language].saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#1a1a1a' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#111827',
            border: `1px solid ${isDarkMode ? '#333333' : '#e5e7eb'}`,
            fontSize: '13px',
            borderRadius: '4px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: isDarkMode ? '#1a1a1a' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: isDarkMode ? '#1a1a1a' : '#ffffff',
            },
          },
        }}
      />
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        session={session}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
        language={language}
        setLanguage={(lang) => {
          setLanguage(lang);
          localStorage.setItem('language', lang);
        }}
        tasks={tasks}
        onClearAll={handleClearAllTasks}
      />
    </div>
  );
}
