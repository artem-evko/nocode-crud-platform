import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { ArrowLeft, Save, LayoutTemplate, Settings, Monitor, Smartphone, Tablet, Type, Heading, Box, BarChart3, LineChart as LineChartIcon, Play, Rocket, Zap, Image as ImageIcon, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { useUIBuilderStore } from '../store/uiBuilderStore';
import SidebarItem from '../components/builder/SidebarItem';
import CanvasArea from '../components/builder/CanvasArea';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import DeploymentModal from '../components/DeploymentModal';

interface ProjectData {
    id: string;
    name: string;
    specText: string;
    [key: string]: unknown;
}

export default function UIBuilderPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const { components, setComponents } = useUIBuilderStore();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeployOpen, setIsDeployOpen] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                // Reset components state immediately when loading a new project
                setComponents([]);
                
                const response = await apiClient.get<ProjectData[]>('/projects');
                const found = response.data.find(p => p.id === projectId);
                if (found) {
                    setProject(found);

                    // Hydrate components from specText if possible
                    if (found.specText && found.specText !== '{}') {
                        try {
                            const parsed = JSON.parse(found.specText);
                            if (parsed.uiSpec && parsed.uiSpec.components && parsed.uiSpec.components.length > 0) {
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

        apiClient.get('/auth/me')
            .then((res) => {
                setUser(res.data);
                fetchProject();
            })
            .catch(() => {
                setUser(null);
                navigate('/login');
            });
    }, [navigate, setUser, projectId, setComponents]);

    const handleSave = async () => {
        if (!project || !project.id) return;

        try {
            let specObj = {};
            if (project.specText && project.specText !== '{}') {
                try {
                    specObj = JSON.parse(project.specText);
                } catch {
                    // Ignore JSON parsing errors
                }
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
            toast.success("Макет UI Builder успешно сохранен!");
        } catch (error) {
            console.error("Failed to save UI layout", error);
            toast.error("Ошибка при сохранении макета.");
        }
    };



    if (loading) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Загрузка...</div>;
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-zinc-950 text-slate-50 overflow-hidden">
                {/* Header Navbar */}
                <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/projects')}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Назад к проектам"
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
                            Модель данных
                        </button>
                        <button
                            onClick={() => navigate(`/projects/${projectId}/flows`)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-zinc-700"
                        >
                            <Zap size={16} />
                            Логика (Flows)
                        </button>
                        <button
                            onClick={() => window.open(`/projects/${projectId}/preview`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Play size={16} className="fill-current" />
                            Предпросмотр
                        </button>
                        <button
                            onClick={async () => {
                                // Auto-save UI before opening deployment to ensure DB receives current components
                                await handleSave();
                                setIsDeployOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 hover:text-indigo-300 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-indigo-600/30"
                        >
                            <Rocket size={16} />
                            Развернуть
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Save size={16} />
                            Сохранить UI
                        </button>
                    </div>
                </header>

                {/* Main 3-Column Layout */}
                <div className="flex flex-1 h-full overflow-hidden">
                    {/* Left Panel: Components */}
                    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Компоненты</h2>
                        <div className="space-y-3">
                            {/* Draggable items */}
                            <SidebarItem type="Button" label="Кнопка" description="Кликабельный элемент для вызова Action Flow" icon={Play} iconColor="text-indigo-400" />
                            <SidebarItem type="Heading" label="Заголовок" description="Крупный текст для разделов страницы" icon={Heading} iconColor="text-pink-400" />
                            <SidebarItem type="Text" label="Текст" description="Обычный многострочный текст или описание" icon={Type} iconColor="text-zinc-300" />
                            <SidebarItem type="DataTable" label="Таблица данных" description="Отображение списка записей из БД" icon={LayoutTemplate} iconColor="text-blue-400" />
                            <SidebarItem type="FormModule" label="Модуль формы" description="Форма ввода для создания или ред. записей" icon={Settings} iconColor="text-emerald-400" />
                            <SidebarItem type="BarChart" label="Столбчатая диаграмма" description="Сравнение числовых значений по категориям" icon={BarChart3} iconColor="text-violet-400" />
                            <SidebarItem type="LineChart" label="Линейный график" description="Отображение динамики изменений" icon={LineChartIcon} iconColor="text-cyan-400" />
                            <SidebarItem type="Card" label="Карточка (Card)" description="Блок выделения контента или группировки" icon={Box} iconColor="text-indigo-400" />
                            <SidebarItem type="Badge" label="Бейдж" description="Цветной ярлык или статус" icon={Type} iconColor="text-emerald-400" />
                            <SidebarItem type="Image" label="Изображение" description="Вставка картинки по URL" icon={ImageIcon} iconColor="text-rose-400" />
                            <SidebarItem type="Divider" label="Разделитель" description="Горизонтальная линия для визуального деления" icon={Minus} iconColor="text-zinc-500" />
                            <SidebarItem type="Container" label="Контейнер Layout" description="Блочная сетка для группировки других элементов" icon={Box} iconColor="text-amber-400" />
                        </div>

                    </aside>

                    {/* Center Panel: Canvas */}
                    <main className="flex-1 bg-zinc-900 relative overflow-y-auto overflow-x-hidden p-8 flex justify-center content-start">
                        <CanvasArea />
                    </main>

                    {/* Right Panel: Properties */}
                    <aside className="w-72 border-l border-zinc-800 bg-zinc-900/40 p-4 flex flex-col overflow-y-auto">
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Свойства</h2>
                        <PropertiesPanel />
                    </aside>
                </div>

            <DeploymentModal
                isOpen={isDeployOpen}
                onClose={() => setIsDeployOpen(false)}
                projectId={project?.id || ''}
            />
        </div>
    );
}
