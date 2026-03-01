import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
}

export default function ProjectsPage() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectFormData | null>(null);

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
        } else {
            // Create using POST
            await apiClient.post('/projects', data);
        }
        await fetchProjects();
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await apiClient.delete(`/projects/${id}`);
                await fetchProjects();
            } catch (err) {
                console.error("Failed to delete", err);
                alert("Failed to delete project");
            }
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
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Plus size={16} />
                            New Project
                        </button>
                        <div className="h-6 w-px bg-zinc-800 mx-2"></div>
                        <span className="text-sm text-zinc-400">User: <strong className="text-white font-medium">{user}</strong></span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors border border-zinc-800"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
                        <h3 className="text-xl font-medium text-white mb-2">No projects yet</h3>
                        <p className="text-zinc-400 mb-6">Create your first project to start modeling your architecture.</p>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-indigo-500"
                        >
                            <Plus size={18} />
                            Create Project
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
                                        onClick={(e) => openEditModal(e, project)}
                                        className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors"
                                        title="Edit Project"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                        title="Delete Project"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold mb-3 text-white pr-16 truncate">{project.name}</h3>
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
                                        <span className="text-zinc-500">Version</span>
                                        <span className="text-zinc-300 font-mono text-xs">{project.version}</span>
                                    </div>
                                </div>
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
        </div>
    );
}
