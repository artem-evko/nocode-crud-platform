import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface Project {
    id: string;
    name: string;
    groupId: string;
    artifactId: string;
}

export default function ProjectsPage() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple auth check on load
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

    if (loading) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-400">Logged in as <strong className="text-white">{user}</strong></span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors border border-zinc-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed">
                        <p className="text-zinc-400">No projects found. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors cursor-pointer group">
                                <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                                <div className="text-sm text-zinc-500 space-y-1">
                                    <p>Group: {project.groupId}</p>
                                    <p>Artifact: {project.artifactId}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
