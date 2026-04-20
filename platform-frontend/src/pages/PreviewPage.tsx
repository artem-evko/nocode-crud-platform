import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ArrowLeft, Play } from 'lucide-react';
import type { UIComponent } from '../store/uiBuilderStore';
import { generateMockData } from '../lib/MockDataEngine';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '../store/themeStore';

export default function PreviewPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const [project, setProject] = useState<any>(null);
    const [components, setComponents] = useState<UIComponent[]>([]);
    const [entities, setEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            const response = await apiClient.get<any[]>('/projects');
            const found = response.data.find(p => p.id === projectId);
            if (found) {
                setProject(found);
                
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
                
                if (found.specText && found.specText !== '{}') {
                    try {
                        const parsedModel = JSON.parse(found.specText);
                        
                        let nodes = [];
                        if (parsedModel._flow && parsedModel._flow.nodes) nodes = parsedModel._flow.nodes;
                        else if (parsedModel.flow && parsedModel.flow.nodes) nodes = parsedModel.flow.nodes;
                        else if (parsedModel.nodes) nodes = parsedModel.nodes;

                        if (nodes.length > 0) {
                            setEntities(nodes.filter((n: any) => n.type === 'entity').map((n: any) => n.data));
                        }
                    } catch (e) {
                        console.error("Failed to parse specText for entities", e);
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

    const getMockDataForEntity = (entityName: string) => {
        const entity = entities.find(e => e.name === entityName);
        if (!entity || !entity.fields || entity.fields.length === 0) {
            // Fallback generic data
            return [
                { id: 1, name: 'Пример 1', value: 100 },
                { id: 2, name: 'Пример 2', value: 200 },
                { id: 3, name: 'Пример 3', value: 150 },
                { id: 4, name: 'Пример 4', value: 300 }
            ];
        }
        return generateMockData(entity, 5);
    };

    const chartGridColor = theme === 'dark' ? '#3f3f46' : '#e5e7eb';
    const chartAxisColor = theme === 'dark' ? '#a1a1aa' : '#6b7280';
    const chartTooltipBg = theme === 'dark' ? '#18181b' : '#ffffff';
    const chartTooltipBorder = theme === 'dark' ? '#27272a' : '#e5e7eb';

    const renderComponent = (comp: UIComponent): React.ReactNode => {
        switch (comp.type) {
            case 'Heading':
                return <h2 key={comp.id} className="text-2xl font-bold mb-4">{comp.props.text || 'Заголовок'}</h2>;
            case 'Text':
                return <p key={comp.id} className="text-gray-600 dark:text-zinc-300 mb-4">{comp.props.text || 'Текстовый блок'}</p>;
            case 'Button':
                return <button key={comp.id} className="px-4 py-2 bg-indigo-600 rounded-md text-white font-medium hover:bg-indigo-500 transition-colors mb-4">{comp.props.text || 'Кнопка'}</button>;
            case 'DataTable': {
                const data = getMockDataForEntity(comp.props.entityName);
                if (data.length === 0) return null;
                const columns = Object.keys(data[0]);
                return (
                    <div key={comp.id} className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 mb-6">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-300">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500 dark:text-zinc-400">
                                <tr>
                                    {columns.map(col => <th key={col} className="px-4 py-3 font-medium">{col}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                {data.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-800/20">
                                        {columns.map(col => <td key={col} className="px-4 py-3">{String(row[col])}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            case 'FormModule':
                return (
                    <div key={comp.id} className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 mb-6 shadow-sm">
                        <h3 className="text-lg font-medium mb-4">Создать {comp.props.entityName || 'Запись'}</h3>
                        <div className="space-y-4 opacity-50 pointer-events-none">
                            <div className="flex gap-2"><div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded flex-1"></div></div>
                            <div className="flex gap-2"><div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded flex-1"></div></div>
                            <div className="h-10 bg-indigo-600/30 rounded w-24 mt-2"></div>
                        </div>
                    </div>
                );
            case 'BarChart': {
                const data = getMockDataForEntity(comp.props.entityName);
                if (data.length === 0) return null;
                const keys = Object.keys(data[0]).filter(k => k !== 'id');
                const yKey = keys.length > 0 ? keys[keys.length - 1] : 'value';
                const xKey = keys.length > 1 ? keys[0] : 'name';
                
                return (
                    <div key={comp.id} className="h-64 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                <XAxis dataKey={xKey} stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px' }} itemStyle={{ color: '#a78bfa' }} />
                                <Bar dataKey={yKey} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            }
            case 'LineChart': {
                const data = getMockDataForEntity(comp.props.entityName);
                if (data.length === 0) return null;
                const keys = Object.keys(data[0]).filter(k => k !== 'id');
                const yKey = keys.length > 0 ? keys[keys.length - 1] : 'value';
                const xKey = keys.length > 1 ? keys[0] : 'name';
                
                return (
                    <div key={comp.id} className="h-64 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                <XAxis dataKey={xKey} stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px' }} itemStyle={{ color: '#2dd4bf' }} />
                                <Line type="monotone" dataKey={yKey} stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 2, stroke: theme === 'dark' ? '#18181b' : '#ffffff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            }
            case 'Container':
                return (
                    <div key={comp.id} className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {comp.children && comp.children.map(child => renderComponent(child))}
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center text-gray-900 dark:text-white">Загрузка предпросмотра...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-slate-50">
            {/* Header Navbar */}
            <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-900/20 shadow-[0_0_15px_rgba(79,70,229,0.1)] z-10 sticky top-0 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/projects/${projectId}/builder`)}
                        className="p-2 text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Назад в Конструктор"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Play size={18} className="text-indigo-400 group-hover:text-indigo-300" />
                        <h1 className="text-xl font-bold tracking-tight shadow-sm">
                            {project?.name} <span className="text-indigo-500 dark:text-indigo-400/80 font-normal ml-1">Предпросмотр</span>
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Application Area */}
            <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
                {components.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-zinc-500">
                        <p>Компоненты пока не добавлены. Вернитесь в Конструктор, чтобы создать страницу.</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {components.map(comp => renderComponent(comp))}
                    </div>
                )}
            </main>
        </div>
    );
}
