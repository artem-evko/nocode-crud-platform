import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings, Box, MousePointerClick, Database, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../api/client';
import type { ProjectFormData } from '../components/ProjectModal';
import LogicNode from '../components/flow/LogicNode';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    useReactFlow,
    useOnSelectionChange
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
    logic: LogicNode,
};

function ActionFlowContent({ project, setProject }: { project: ProjectFormData | null, setProject: (p: any) => void }) {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    useOnSelectionChange({
        onChange: ({ nodes }) => {
            if (nodes.length > 0) {
                setSelectedNodeId(nodes[0].id);
            } else {
                setSelectedNodeId(null);
            }
        },
    });

    const updateNodeData = (id: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
    };

    useEffect(() => {
        if (project?.specText && project.specText !== '{}') {
            try {
                const parsed = JSON.parse(project.specText);
                if (parsed.actionFlows && parsed.actionFlows.length > 0) {
                    const flow = parsed.actionFlows[0];
                    if (flow.nodes) {
                        // Restore react flow nodes mapped from backend
                        const restoredNodes = flow.nodes.map((n: any) => ({
                            id: n.id,
                            type: 'logic',
                            position: n.config?.position || { x: 100, y: 100 },
                            data: {
                                label: n.config?.label || n.action,
                                type: n.type,
                                action: n.action,
                                config: n.config
                            }
                        }));
                        setNodes(restoredNodes);
                    }
                    if (flow.edges) {
                        const restoredEdges = flow.edges.map((e: any) => ({
                            id: e.id,
                            source: e.source,
                            target: e.target,
                            type: 'smoothstep'
                        }));
                        setEdges(restoredEdges);
                    }
                }
            } catch (e) {
                console.error("Failed to parse specText", e);
            }
        }
    }, [project, setNodes, setEdges]);

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)), [setEdges]);

    const onDragStart = (event: React.DragEvent, nodeType: string, actionName: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, action: actionName, label }));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const dataStr = event.dataTransfer.getData('application/reactflow');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `node_${crypto.randomUUID()}`,
                type: 'logic',
                position,
                data: { label: data.label, type: data.type, action: data.action, config: { position } },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    const handleSave = async () => {
        if (!project || !project.id) return;

        try {
            let specObj = {};
            if (project.specText && project.specText !== '{}') {
                try {
                    specObj = JSON.parse(project.specText);
                } catch (e) { }
            }

            // Map react flow nodes back to backend Spec ActionFlow nodes
            const backendNodes = nodes.map(n => ({
                id: n.id,
                type: n.data.type as string,
                action: n.data.action as string,
                config: { ...n.data.config as any, position: n.position, label: n.data.label }
            }));

            const backendEdges = edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target
            }));

            const flowDef = {
                id: 'flow_1',
                name: 'Main Business Logic',
                nodes: backendNodes,
                edges: backendEdges
            };

            const updatedSpec = { ...specObj, actionFlows: [flowDef] };
            const specText = JSON.stringify(updatedSpec, null, 2);

            await apiClient.put(`/projects/${project.id}`, { ...project, specText });
            toast.success("Action Flow успешно сохранен!");
            setProject({...project, specText});
        } catch (error) {
            console.error("Failed to save action flows", error);
            toast.error("Ошибка при сохранении логики.");
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-zinc-950 text-slate-50 overflow-hidden">
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
                        <h1 className="text-xl font-bold">{project?.name || 'Project'} <span className="text-sm font-normal text-zinc-400">Визуальная логика</span></h1>
                    </div>
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
                        onClick={() => navigate(`/projects/${projectId}/builder`)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-zinc-700"
                    >
                        <Box size={16} />
                        UI Builder
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Save size={16} />
                        Сохранить поток
                    </button>
                </div>
            </header>

            <div className="flex flex-1 h-full overflow-hidden">
                <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-6 overflow-y-auto">
                    
                    <div>
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Состояния (Triggers)</h2>
                        <div className="space-y-2">
                            <div 
                                onDragStart={(e) => onDragStart(e, 'trigger', 'UI_CLICK', 'On Element Click')} draggable
                                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                            >
                                <MousePointerClick size={16} className="text-orange-400" />
                                <span className="text-sm font-medium">Клик в интерфейсе</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Действия (Actions)</h2>
                        <div className="space-y-2">
                            <div 
                                onDragStart={(e) => onDragStart(e, 'action', 'DB_CREATE_RECORD', 'Create Record')} draggable
                                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                            >
                                <Database size={16} className="text-emerald-400" />
                                <span className="text-sm font-medium">Создать запись</span>
                            </div>
                            <div 
                                onDragStart={(e) => onDragStart(e, 'action', 'DB_UPDATE_RECORD', 'Update Record')} draggable
                                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                            >
                                <Database size={16} className="text-emerald-400" />
                                <span className="text-sm font-medium">Обновить запись</span>
                            </div>
                            <div 
                                onDragStart={(e) => onDragStart(e, 'action', 'UI_SHOW_TOAST', 'Show Notification')} draggable
                                className="flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                            >
                                <MessageSquare size={16} className="text-blue-400" />
                                <span className="text-sm font-medium">Уведомление (Toast)</span>
                            </div>
                        </div>
                    </div>

                </aside>

                <main className="flex-1 bg-zinc-950 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background color="#3f3f46" gap={16} />
                        <Controls className="bg-zinc-800 text-white border-zinc-700" />
                    </ReactFlow>
                </main>
                
                <aside className="w-72 border-l border-zinc-800 bg-zinc-900/40 p-4 flex flex-col overflow-y-auto">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Настройки Ноды</h2>
                    
                    {(() => {
                        const selectedNode = nodes.find(n => n.id === selectedNodeId);
                        
                        let parsedSpec: any = {};
                        if (project?.specText && project.specText !== '{}') {
                            try { parsedSpec = JSON.parse(project.specText); } catch(e){}
                        }
                        const entities = parsedSpec.entities || [];

                        if (!selectedNode) {
                            return (
                                <div className="text-sm text-zinc-400 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 border-dashed text-center">
                                    Выберите узел на холсте для редактирования свойств.
                                </div>
                            );
                        }

                        return (
                            <div className="flex flex-col gap-5">
                                <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <div className="text-xs text-zinc-500 mb-1">Тип узла</div>
                                    <div className="font-medium text-white flex items-center gap-2">
                                        {String(selectedNode.data.action)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Название (Label)</label>
                                    <input 
                                        type="text"
                                        value={selectedNode.data.label as string || ''}
                                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>

                                {selectedNode.data.action === 'DB_CREATE_RECORD' && (
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Сущность (Entity)</label>
                                            <select 
                                                value={(selectedNode.data.config as any)?.entityName || ''}
                                                onChange={(e) => updateNodeData(selectedNode.id, { config: { ...(selectedNode.data.config as any), entityName: e.target.value } })}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                                            >
                                                <option value="">-- Выберите сущность --</option>
                                                {entities.map((ent: any) => (
                                                    <option key={ent.name} value={ent.name}>{ent.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Маппинг полей (JSON)</label>
                                            <div className="text-xs text-zinc-500 mb-2">Настройте, откуда брать поля. Используйте {'{{payload.field}}'} для связи с триггером.</div>
                                            <textarea 
                                                value={(selectedNode.data.config as any)?.mapping ?? '{\n  "title": "{{payload.title}}"\n}'}
                                                onChange={(e) => updateNodeData(selectedNode.id, { config: { ...(selectedNode.data.config as any), mapping: e.target.value } })}
                                                rows={5}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-mono resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedNode.data.action === 'UI_SHOW_TOAST' && (
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Сообщение (Toast)</label>
                                            <input 
                                                type="text"
                                                value={(selectedNode.data.config as any)?.message || ''}
                                                onChange={(e) => updateNodeData(selectedNode.id, { config: { ...(selectedNode.data.config as any), message: e.target.value } })}
                                                placeholder="{{payload.message}} или Статичный текст"
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </aside>
            </div>
        </div>
    );
}

export default function ActionFlowPage() {
    const { projectId } = useParams();
    const [project, setProject] = useState<ProjectFormData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await apiClient.get(`/projects/${projectId}`);
                setProject(response.data);
            } catch (error) {
                console.error("Failed to fetch project", error);
                toast.error("Не удалось загрузить проект");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    if (loading) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Загрузка...</div>;
    }

    return (
        <ReactFlowProvider>
            <ActionFlowContent project={project} setProject={setProject} />
        </ReactFlowProvider>
    );
}
