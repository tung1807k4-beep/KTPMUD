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
  X
} from 'lucide-react';
import { supabase } from './supabase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Session } from '@supabase/supabase-js';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  created_at: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'team' | 'analytics' | 'archive'>('projects');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'TRUNG BÌNH'
  });

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
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchTasks = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
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

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
        }
      ]);

    if (error) {
      console.error('Error adding task:', error);
    } else {
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'TRUNG BÌNH' });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!session) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting task:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !session) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as 'todo' | 'doing' | 'done';
      
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', draggableId);

      if (error) {
        console.error('Error updating task status:', error);
        fetchTasks(); // Revert on error
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const doingTasks = filteredTasks.filter(t => t.status === 'doing');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const renderTaskCard = (task: Task, index: number) => {
    const isDone = task.status === 'done';
    return (
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
              <div className="flex items-center gap-2 text-text-muted">
                {isDone ? <CheckCircle size={12} /> : <Calendar size={12} />}
                <span className="text-[11px]">
                  {isDone ? 'Đóng lúc ' : ''}
                  {new Date(task.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}
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
          <h1 className="text-[24px] font-bold text-text-main tracking-[2px] uppercase mb-2">Quản trị Pro</h1>
          <p className="text-[13px] text-text-secondary mb-10">Đăng nhập để truy cập không gian làm việc của bạn</p>
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
            <span className="text-[13px] font-medium">Đăng nhập bằng Google</span>
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
            <h2 className="text-[18px] font-bold text-primary tracking-[4px] uppercase">Quản trị Pro</h2>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mt-1">Gói Doanh nghiệp</p>
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
                <span>Bảng điều khiển</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('projects')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'projects' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'projects' ? 'opacity-100' : 'opacity-0'}`}></div>
                <ClipboardList size={16} />
                <span>Dự án</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('team')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'team' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'team' ? 'opacity-100' : 'opacity-0'}`}></div>
                <Users size={16} />
                <span>Nhóm</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('analytics')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'analytics' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'analytics' ? 'opacity-100' : 'opacity-0'}`}></div>
                <BarChart2 size={16} />
                <span>Phân tích</span>
              </button>
            </li>
            <li className="mb-6">
              <button 
                onClick={() => setCurrentView('archive')}
                className={`flex w-full items-center gap-3 text-[13px] uppercase tracking-[1px] transition-colors cursor-pointer bg-transparent border-none p-0 text-left ${currentView === 'archive' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
              >
                <div className={`w-1.5 h-1.5 bg-primary rounded-full transition-opacity ${currentView === 'archive' ? 'opacity-100' : 'opacity-0'}`}></div>
                <Archive size={16} />
                <span>Lưu trữ</span>
              </button>
            </li>
          </ul>
        </nav>
        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-transparent border border-border-hover text-text-main py-2 px-3 text-[11px] uppercase cursor-pointer hover:border-primary transition-colors"
          >
            Dự án mới
          </button>
          <a className="flex items-center gap-3 text-[13px] uppercase tracking-[1px] text-text-muted hover:text-text-main transition-colors cursor-pointer" href="#">
            <HelpCircle size={16} />
            <span>Trợ giúp</span>
          </a>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-[13px] uppercase tracking-[1px] text-text-muted hover:text-text-main transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
          <div className="text-[10px] text-text-muted tracking-[1px] mt-2">
            V2.4.0 • 2024
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-60 flex-1 min-h-screen flex flex-col p-10">
        {/* TopNavBar Component */}
        <header className="flex justify-between items-center w-full mb-12">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-[32px] font-light tracking-[-1px] text-text-main">Kiến trúc sư Trưởng</h1>
            <div className="relative w-full max-w-md ml-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                className="w-full bg-surface-container border border-border rounded-[4px] py-2 pl-10 pr-4 focus:border-primary transition-all text-[13px] text-text-main outline-none" 
                placeholder="Tìm kiếm công việc..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-text-muted hover:text-text-main transition-colors">
              <Bell size={18} />
            </button>
            <button className="text-text-muted hover:text-text-main transition-colors">
              <Settings size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-text-secondary">Chào buổi sáng, {session.user?.user_metadata?.full_name || 'Người dùng'}</span>
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
                <h2 className="text-[11px] uppercase tracking-[2px] text-text-dim mb-2">Bảng Dự Án</h2>
                <p className="text-[14px] text-text-secondary">Không gian làm việc tối giản / Giai đoạn Q4</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-transparent border border-border-hover text-text-main py-1.5 px-3 text-[11px] uppercase cursor-pointer hover:border-primary transition-colors flex items-center gap-2">
                  <Filter size={14} /> Lọc
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-transparent border border-border-hover text-text-main py-1.5 px-3 text-[11px] uppercase cursor-pointer hover:border-primary transition-colors flex items-center gap-2"
                >
                  <Plus size={14} /> Thêm công việc
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
                      <h3 className="text-[11px] uppercase tracking-[2px] text-text-dim">Cần làm</h3>
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
                      <h3 className="text-[11px] uppercase tracking-[2px] text-text-dim">Đang làm</h3>
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
                      <h3 className="text-[11px] uppercase tracking-[2px] text-text-dim">Hoàn thành</h3>
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
              <h2 className="text-[18px] text-text-main font-bold mb-2">Bảng điều khiển</h2>
              <p className="text-[13px] text-text-secondary">Tính năng đang được phát triển</p>
            </div>
          </div>
        )}

        {currentView === 'team' && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-[4px]">
            <div className="text-center">
              <Users className="mx-auto mb-4 text-text-muted" size={32} />
              <h2 className="text-[18px] text-text-main font-bold mb-2">Nhóm</h2>
              <p className="text-[13px] text-text-secondary">Tính năng đang được phát triển</p>
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-[4px]">
            <div className="text-center">
              <BarChart2 className="mx-auto mb-4 text-text-muted" size={32} />
              <h2 className="text-[18px] text-text-main font-bold mb-2">Phân tích</h2>
              <p className="text-[13px] text-text-secondary">Tính năng đang được phát triển</p>
            </div>
          </div>
        )}

        {currentView === 'archive' && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-[4px]">
            <div className="text-center">
              <Archive className="mx-auto mb-4 text-text-muted" size={32} />
              <h2 className="text-[18px] text-text-main font-bold mb-2">Lưu trữ</h2>
              <p className="text-[13px] text-text-secondary">Tính năng đang được phát triển</p>
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
              <h3 className="text-[18px] text-text-main font-bold">Thêm công việc mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">Tiêu đề</label>
                <input 
                  required
                  type="text" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none"
                  placeholder="Nhập tiêu đề công việc..."
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">Mô tả</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none min-h-[100px] resize-none"
                  placeholder="Nhập mô tả chi tiết..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">Trạng thái</label>
                  <select 
                    value={newTask.status}
                    onChange={e => setNewTask({...newTask, status: e.target.value as any})}
                    className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none appearance-none"
                  >
                    <option value="todo">Cần làm</option>
                    <option value="doing">Đang làm</option>
                    <option value="done">Hoàn thành</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[1px] text-text-dim mb-2">Độ ưu tiên</label>
                  <select 
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full bg-surface-container border border-border rounded-[4px] py-2 px-3 focus:border-primary transition-all text-[13px] text-text-main outline-none appearance-none"
                  >
                    <option value="CAO">Cao</option>
                    <option value="TRUNG BÌNH">Trung bình</option>
                    <option value="THẤP">Thấp</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent border border-border-hover text-text-main py-2 px-4 text-[11px] uppercase cursor-pointer hover:border-text-muted transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="bg-primary text-background py-2 px-4 text-[11px] uppercase font-bold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
