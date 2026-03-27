import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { apiClient } from '../../api/client';
import { useParams } from 'react-router-dom';

export default function PropertiesPanel() {
    const { projectId } = useParams();
    const { components, selectedComponentId, updateComponentProps } = useUIBuilderStore();
    const [entities, setEntities] = useState<{ id: string, name: string }[]>([]);
    const [actionFlows, setActionFlows] = useState<{ id: string, name: string }[]>([]);

    const selectedComponent = components.find(c => c.id === selectedComponentId);

    useEffect(() => {
        if (projectId) {
            apiClient.get(`/projects`)
                .then(res => {
                    const proj = res.data.find((p: any) => p.id === projectId);
                    if (proj && proj.specText && proj.specText !== '{}') {
                        try {
                            const parsed = JSON.parse(proj.specText);
                            
                            let nodes = [];
                            if (parsed._flow && parsed._flow.nodes) nodes = parsed._flow.nodes;
                            else if (parsed.flow && parsed.flow.nodes) nodes = parsed.flow.nodes;
                            else if (parsed.nodes) nodes = parsed.nodes;

                            if (nodes.length > 0) {
                                setEntities(nodes.filter((n: any) => n.type === 'entity').map((n: any) => ({
                                    id: n.id,
                                    name: n.data.name
                                })));
                            }

                            if (parsed.actionFlows) {
                                setActionFlows(parsed.actionFlows.map((f: any) => ({
                                    id: f.id,
                                    name: f.name
                                })));
                            }
                        } catch (e) {
                            console.error("Failed to parse project to extract entities for binding");
                        }
                    }
                })
                .catch(console.error);
        }
    }, [projectId]);

    if (!selectedComponent) {
        return (
            <div className="text-sm text-zinc-400 text-center py-10">
                Выберите компонент на холсте, чтобы настроить его свойства и связи с данными.
            </div>
        );
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateComponentProps(selectedComponent.id, { text: e.target.value });
    };

    const handleEntityBindingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        updateComponentProps(selectedComponent.id, { entityName: val === "none" ? null : val });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm font-semibold text-zinc-300">Тип</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded font-mono">
                        {selectedComponent.type}
                    </span>
                </div>

                {/* General Text Property */}
                {(selectedComponent.type === 'Heading' || selectedComponent.type === 'Text' || selectedComponent.type === 'Button') && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 block">Текстовое содержимое</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={selectedComponent.props.text || ''}
                            onChange={handleTextChange}
                        />
                    </div>
                )}

                {/* Logic Binding Property */}
                {selectedComponent.type === 'Button' && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <label className="text-xs font-semibold text-zinc-400 block">Выполнить логику (Action Flow)</label>
                        <select
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={selectedComponent.props.actionFlowId || "none"}
                            onChange={(e) => updateComponentProps(selectedComponent.id, { actionFlowId: e.target.value === "none" ? null : e.target.value })}
                        >
                            <option value="none">-- Без действия --</option>
                            {actionFlows.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">
                            Выберите поток логики, который будет выполняться при клике на кнопку.
                        </p>
                    </div>
                )}

                {/* Data Binding Properties */}
                {(selectedComponent.type === 'DataTable' || selectedComponent.type === 'FormModule' || selectedComponent.type === 'BarChart' || selectedComponent.type === 'LineChart') && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 block">Привязать к сущности</label>
                        <select
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={selectedComponent.props.entityName || "none"}
                            onChange={handleEntityBindingChange}
                        >
                            <option value="none">-- Выберите сущность --</option>
                            {entities.map(e => (
                                <option key={e.id} value={e.name}>{e.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">
                            Свяжите этот компонент с сущностью модели данных для автогенерации API-вызовов.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
