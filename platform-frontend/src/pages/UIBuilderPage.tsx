import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { ArrowLeft, Save, LayoutTemplate, Settings, Monitor, Smartphone, Tablet, Type, Heading } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { toast } from 'sonner';
import type { DragEndEvent } from '@dnd-kit/core';
import { useUIBuilderStore } from '../store/uiBuilderStore';
import type { ComponentType } from '../store/uiBuilderStore';
import SidebarItem from '../components/builder/SidebarItem';
import CanvasArea from '../components/builder/CanvasArea';
import PropertiesPanel from '../components/builder/PropertiesPanel';

export default function UIBuilderPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const { addComponent, moveComponent, components, setComponents } = useUIBuilderStore();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/auth/me')
            .then((res) => {
                setUser(res.data);
                fetchProject();
            })
            .catch(() => {
                setUser(null);
                navigate('/login');
            });
    }, [navigate, setUser, projectId]);

    const fetchProject = async () => {
        try {
            const response = await apiClient.get<any[]>('/projects');
            const found = response.data.find(p => p.id === projectId);
            if (found) {
                setProject(found);

                // Hydrate components from specText if possible
                if (found.specText && found.specText !== '{}') {
                    try {
                        const parsed = JSON.parse(found.specText);
                        if (parsed.uiSpec && parsed.uiSpec.components) {
                            setComponents(parsed.uiSpec.components);
                        }
                    } catch (e) {
                        console.error("Failed to parse uiSpec", e);
                    }
                }
            } else {
                navigate('/projects');
            }
        } catch (error) {
            console.error("Failed to fetch project", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!project || !project.id) return;
        try {
            let specObj = {};
            if (project.specText && project.specText !== '{}') {
                try {
                    specObj = JSON.parse(project.specText);
                } catch (e) { }
            }

            // Combine with existing spec
            const updatedSpec = {
                ...specObj,
                uiSpec: {
                    components: components
                }
            };

            const specText = JSON.stringify(updatedSpec, null, 2);

            await apiClient.put(`/projects/${project.id}`, {
                ...project,
                specText
            });
            toast.success("UI Builder layout saved successfully!");
        } catch (error) {
            console.error("Failed to save UI layout", error);
            toast.error("Error saving UI layout.");
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        // If dragging from sidebar to canvas
        if (active.data.current?.type === 'SidebarItem') {
            const isOverCanvasArea = over.id === 'canvas-drop-zone' || components.some(c => c.id === over.id);
            if (isOverCanvasArea) {
                const compType = active.data.current.componentType as ComponentType;
                addComponent({
                    id: Math.random().toString(36).substr(2, 9),
                    type: compType,
                    props: { text: `New ${compType}` }
                });
            }
            return;
        }

        // Reordering within canvas
        if (active.data.current?.type === 'CanvasItem' && over.data.current?.type === 'CanvasItem') {
            const oldIndex = components.findIndex(c => c.id === active.id);
            const newIndex = components.findIndex(c => c.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                moveComponent(oldIndex, newIndex);
            }
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen w-screen bg-zinc-950 text-slate-50 overflow-hidden">
                {/* Header Navbar */}
                <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/projects')}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Back to Projects"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{project?.name} <span className="text-sm font-normal text-zinc-400">UI Builder</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50 mr-auto ml-10">
                        <button className="p-1.5 text-zinc-300 bg-zinc-700 rounded shadow-sm"><Monitor size={16} /></button>
                        <button className="p-1.5 text-zinc-500 hover:text-zinc-300"><Tablet size={16} /></button>
                        <button className="p-1.5 text-zinc-500 hover:text-zinc-300"><Smartphone size={16} /></button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(`/projects/${projectId}/modeler`)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-zinc-700"
                        >
                            <Settings size={16} />
                            Data Model
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Save size={16} />
                            Save UI
                        </button>
                    </div>
                </header>

                {/* Main 3-Column Layout */}
                <div className="flex flex-1 h-full overflow-hidden">
                    {/* Left Panel: Components */}
                    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Components</h2>
                        <div className="space-y-3">
                            {/* Draggable items */}
                            <SidebarItem id="s-heading" type="Heading" label="Heading" icon={Heading} iconColor="text-pink-400" />
                            <SidebarItem id="s-text" type="Text" label="Text Block" icon={Type} iconColor="text-zinc-300" />
                            <SidebarItem id="s-datatable" type="DataTable" label="Data Table" icon={LayoutTemplate} iconColor="text-blue-400" />
                            <SidebarItem id="s-form" type="FormModule" label="Form Module" icon={Settings} iconColor="text-emerald-400" />
                        </div>
                    </aside>

                    {/* Center Panel: Canvas */}
                    <main className="flex-1 bg-zinc-900 relative overflow-y-auto overflow-x-hidden p-8 flex justify-center content-start">
                        <CanvasArea />
                    </main>

                    {/* Right Panel: Properties */}
                    <aside className="w-72 border-l border-zinc-800 bg-zinc-900/40 p-4 flex flex-col overflow-y-auto">
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Properties</h2>
                        <PropertiesPanel />
                    </aside>
                </div>
            </div>
        </DndContext>
    );
}
