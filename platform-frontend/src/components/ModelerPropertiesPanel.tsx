import { Plus, X, Link as LinkIcon } from 'lucide-react';
import type { AppNode, EntityFieldType } from './EntityNode';
import type { Edge } from '@xyflow/react';

interface ModelerPropertiesPanelProps {
    selectedNode: AppNode | null;
    nodes: AppNode[];
    edges: Edge[];
    setNodes: (updater: (nodes: AppNode[]) => AppNode[]) => void;
    setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
}

const TYPE_OPTIONS: EntityFieldType[] = ['String', 'Integer', 'Long', 'Boolean', 'LocalDate', 'OffsetDateTime', 'UUID', 'Double', 'BigDecimal'];

// A helper for generating simple IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ModelerPropertiesPanel({ selectedNode, nodes, edges, setNodes, setEdges }: ModelerPropertiesPanelProps) {
    if (!selectedNode) {
        return (
            <div className="w-80 bg-zinc-950 border-l border-zinc-800 p-4 shrink-0 flex items-center justify-center">
                <p className="text-zinc-500 text-sm text-center">Выберите сущность на холсте для редактирования её свойств.</p>
            </div>
        );
    }

    const { id, data, position } = selectedNode;

    const updateNodeData = (updates: any) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n));
    };

    const updateNodePosition = (axis: 'x' | 'y', value: number) => {
        setNodes(nds => nds.map(n => n.id === id ? { ...n, position: { ...n.position, [axis]: value } } : n));
    };

    const handleAddField = () => {
        const newField = { id: generateId(), name: 'newField', type: 'String' as const, required: false };
        updateNodeData({ fields: [...(data.fields || []), newField] });
    };

    const handleFieldChange = (fieldId: string, updates: any) => {
        updateNodeData({ fields: data.fields.map((f: any) => f.id === fieldId ? { ...f, ...updates } : f) });
    };

    const handleRemoveField = (fieldId: string) => {
        updateNodeData({ fields: data.fields.filter((f: any) => f.id !== fieldId) });
    };

    const handleAddRelation = (targetEntityId: string) => {
        if (!targetEntityId) return;
        const newEdge: Edge = {
            id: `edge-${generateId()}`,
            source: id,
            target: targetEntityId,
            animated: false,
            style: { stroke: '#818cf8', strokeWidth: 2 }
        };
        setEdges(eds => [...eds, newEdge]);
    };

    const handleRemoveRelation = (edgeId: string) => {
        setEdges(eds => eds.filter(e => e.id !== edgeId));
    };

    // Find outgoing edges (relations where this node is source)
    const outgoingEdges = edges.filter(e => e.source === id);

    return (
        <div className="w-80 bg-zinc-950 border-l border-zinc-800 shrink-0 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-10">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    Свойства Сущности
                </h2>
                <div className="mt-3">
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Название сущности</label>
                    <input
                        type="text"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                        value={data.name || ''}
                        onChange={(e) => updateNodeData({ name: e.target.value })}
                        placeholder="Например, User"
                    />
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Positions */}
                <div>
                    <h3 className="text-xs font-semibold text-zinc-400 mb-2">Положение на холсте (X / Y)</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Позиция X</label>
                            <input
                                type="number"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={Math.round(position.x)}
                                onChange={(e) => updateNodePosition('x', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Позиция Y</label>
                            <input
                                type="number"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={Math.round(position.y)}
                                onChange={(e) => updateNodePosition('y', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </div>

                {/* Fields */}
                <div className="pt-2 border-t border-zinc-800/50">
                    <h3 className="text-xs font-semibold text-zinc-400 mb-2 flex items-center justify-between">
                        Поля (Свойства)
                        <button onClick={handleAddField} className="text-indigo-400 hover:text-indigo-300 p-1 rounded-md hover:bg-indigo-500/10">
                            <Plus size={14} />
                        </button>
                    </h3>
                    <div className="space-y-2">
                        {data.fields && data.fields.map((field: any) => (
                            <div key={field.id} className="bg-zinc-900/50 rounded-lg p-2 border border-zinc-800 relative group">
                                <button
                                    onClick={() => handleRemoveField(field.id)}
                                    className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 block">Название поля</label>
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => handleFieldChange(field.id, { name: e.target.value })}
                                            className="w-full bg-zinc-900 border border-zinc-700/50 rounded px-1.5 py-1 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                                            placeholder="название"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 block">Тип данных</label>
                                        <select
                                            value={field.type}
                                            onChange={(e) => handleFieldChange(field.id, { type: e.target.value })}
                                            className="w-full bg-zinc-900 border border-zinc-700/50 rounded px-1.5 py-1 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                                        >
                                            {TYPE_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!data.fields || data.fields.length === 0) && (
                            <p className="text-[11px] text-zinc-600 text-center italic">Нет добавленных полей</p>
                        )}
                    </div>
                </div>

                {/* Relations */}
                <div className="pt-2 border-t border-zinc-800/50">
                    <h3 className="text-xs font-semibold text-zinc-400 mb-2">Связи (Внешние ключи)</h3>
                    <p className="text-[10px] text-zinc-500 mb-2">
                        Свяжите эту сущность с другими таблицами (создаст связь ONE_TO_MANY).
                    </p>
                    <div className="space-y-2">
                        {outgoingEdges.map(edge => {
                            const targetEntity = nodes.find(n => n.id === edge.target);
                            return (
                                <div key={edge.id} className="flex flex-col gap-1 bg-indigo-900/10 border border-indigo-500/20 rounded p-2 text-xs">
                                    <div className="flex justify-between items-center text-zinc-300">
                                        <span className="flex items-center gap-1 font-mono text-indigo-400">
                                            <LinkIcon size={10}/>
                                            {targetEntity?.data?.name || 'Unknown'}
                                        </span>
                                        <button onClick={() => handleRemoveRelation(edge.id)} className="text-zinc-500 hover:text-red-400 p-0.5"><X size={12}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2">
                        <select 
                            id="new_relation_target"
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                            defaultValue=""
                        >
                            <option value="" disabled>-- Выберите сущность --</option>
                            {nodes.filter(n => n.id !== id).map(n => (
                                <option key={n.id} value={n.id}>{n.data.name || 'Без имени'}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => {
                                const sel = document.getElementById('new_relation_target') as HTMLSelectElement;
                                if (sel && sel.value) {
                                    handleAddRelation(sel.value);
                                    sel.value = "";
                                }
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded p-1.5 transition-colors"
                        >
                            Добавить
                        </button>
                    </div>
                </div>

                {/* Security Roles */}
                <div className="pt-2 border-t border-zinc-800/50">
                    <h3 className="text-xs font-semibold text-zinc-400 mb-2">Права доступа (RBAC)</h3>
                    <div className="space-y-2">
                        {['readRoles', 'createRoles', 'updateRoles', 'deleteRoles'].map((roleKey) => (
                            <div key={roleKey}>
                                <label className="text-[10px] text-zinc-500 uppercase block mb-0.5">{roleKey.replace('Roles','')} (Роли через запятую)</label>
                                <input
                                    type="text"
                                    value={(data[roleKey] as string) || ''}
                                    onChange={(e) => updateNodeData({ [roleKey]: e.target.value })}
                                    className="w-full bg-zinc-900 text-xs border border-zinc-700/50 rounded px-2 py-1 outline-none focus:border-indigo-500 text-zinc-300"
                                    placeholder="ROLE_ADMIN, ROLE_USER"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
