import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { apiClient } from '../../api/client';
import { useParams } from 'react-router-dom';

export default function PropertiesPanel() {
    const { projectId } = useParams();
    const { components, selectedComponentId, updateComponentProps } = useUIBuilderStore();
    const [entities, setEntities] = useState<{ id: string, name: string }[]>([]);

    const selectedComponent = components.find(c => c.id === selectedComponentId);

    useEffect(() => {
        if (projectId) {
            // Load project to glean entity names for the data binding dropdown
            apiClient.get(`/projects`)
                .then(res => {
                    const proj = res.data.find((p: any) => p.id === projectId);
                    if (proj && proj.specText && proj.specText !== '{}') {
                        try {
                            const parsed = JSON.parse(proj.specText);
                            const flowData = parsed._flow || parsed.flow;
                            if (flowData && flowData.nodes) {
                                setEntities(flowData.nodes.map((n: any) => ({
                                    id: n.id,
                                    name: n.data.name
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
                Select a component on the canvas to configure its settings and data bindings.
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
                    <span className="text-sm font-semibold text-zinc-300">Type</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded font-mono">
                        {selectedComponent.type}
                    </span>
                </div>

                {/* General Text Property */}
                {(selectedComponent.type === 'Heading' || selectedComponent.type === 'Text' || selectedComponent.type === 'Button') && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 block">Text Content</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={selectedComponent.props.text || ''}
                            onChange={handleTextChange}
                        />
                    </div>
                )}

                {/* Data Binding Properties */}
                {(selectedComponent.type === 'DataTable' || selectedComponent.type === 'FormModule' || selectedComponent.type === 'BarChart' || selectedComponent.type === 'LineChart') && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 block">Bind to Entity</label>
                        <select
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={selectedComponent.props.entityName || "none"}
                            onChange={handleEntityBindingChange}
                        >
                            <option value="none">-- Select Entity --</option>
                            {entities.map(e => (
                                <option key={e.id} value={e.name}>{e.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">
                            Link this component to an existing data model entity to auto-generate API calls.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
