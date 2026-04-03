import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import ProjectModal from '../components/ProjectModal';
import type { ProjectFormData } from '../components/ProjectModal';

interface Project {
    id: string;
    name: string;
    groupId: string;
    artifactId: string;
    version: string;
    basePackage: string;
    specText?: string;
    deploymentStatus?: string;
    deploymentUrl?: string;
}

export default function ProjectsPage() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectFormData | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    useEffect(() => {
        apiClient.get('/auth/me')
            .then((res) => {
                setUser(res.data);
                fetchProjects();
            })
            .catch(() => {
                setUser(null);
                navigate('/login');
            });
    }, [navigate, setUser]);

    const fetchProjects = async () => {
        try {
            const response = await apiClient.get<Project[]>('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await apiClient.post('/auth/logout');
        setUser(null);
        navigate('/login');
    };

    const handleSaveProject = async (data: ProjectFormData) => {
        if (data.id) {
            // Update using PUT
            await apiClient.put(`/projects/${data.id}`, data);
            await fetchProjects();
        } else {
            // Create using POST
            const res = await apiClient.post<Project>('/projects', data);
            await fetchProjects();
            navigate(`/projects/${res.data.id}/modeler`);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;
        const id = projectToDelete;
        setProjectToDelete(null); // Optimistic close of the dialog
        
        const deletePromise = apiClient.delete(`/projects/${id}`).then(() => fetchProjects());
        
        toast.promise(deletePromise, {
            loading: 'Остановка контейнеров и удаление проекта...',
            success: 'Проект успешно удален',
            error: 'Не удалось удалить проект'
        });
        
        try {
            await deletePromise;
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const openCreateModal = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setEditingProject(project);
        setIsModalOpen(true);
    };

    if (loading) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Загрузка...</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Мои Проекты</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Plus size={16} />
                            Новый Проект
                        </button>
                        <div className="h-6 w-px bg-zinc-800 mx-2"></div>
                        <span className="text-sm text-zinc-400">Пользователь: <strong className="text-white font-medium">{user}</strong></span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors border border-zinc-800"
                        >
                            Выйти
                        </button>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
                        <h3 className="text-xl font-medium text-white mb-2">Проектов пока нет</h3>
                        <p className="text-zinc-400 mb-6">Создайте свой первый проект, чтобы начать моделирование.</p>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-indigo-500"
                        >
                            <Plus size={18} />
                            Создать Проект
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => navigate(`/projects/${project.id}/modeler`)}
                                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer"
                            >
                                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/projects/${project.id}/builder`);
                                        }}
                                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-md transition-colors"
                                        title="Конструктор интерфейса (UI Builder)"
                                    >
                                        <LayoutTemplate size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => openEditModal(e, project)}
                                        className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors"
                                        title="Изменить проект"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProjectToDelete(project.id);
                                        }}
                                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                        title="Удалить проект"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-3 pr-16">
                                    <h3 className="text-xl font-bold text-white truncate">{project.name}</h3>
                                    {project.deploymentStatus === 'RUNNING' && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Запущено
                                        </span>
                                    )}
                                    {project.deploymentStatus === 'IN_PROGRESS' && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                                            Развертывание
                                        </span>
                                    )}
                                    {project.deploymentStatus === 'ERROR' && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                            Ошибка
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                                        <span className="text-zinc-500">Group ID</span>
                                        <span className="text-zinc-300 font-mono text-xs">{project.groupId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                                        <span className="text-zinc-500">Artifact ID</span>
                                        <span className="text-zinc-300 font-mono text-xs">{project.artifactId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Версия</span>
                                        <span className="text-zinc-300 font-mono text-xs">{project.version}</span>
                                    </div>
                                </div>
                                
                                {project.deploymentStatus === 'RUNNING' && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                        <a 
                                            href={`http://proj-${project.id}.localhost`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-sm font-semibold transition-colors border border-emerald-500/20"
                                        >
                                            <LayoutTemplate size={16} />
                                            Открыть приложение
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
                initialData={editingProject}
            />

            {/* Custom Confirm Modal */}
            {projectToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Удалить проект?</h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            Вы уверены, что хотите безвозвратно удалить этот проект? Это также остановит все запущенные серверы и контейнеры, связанные с ним.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setProjectToDelete(null)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
