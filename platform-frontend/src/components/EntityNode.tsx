import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Plus, X, List, Hash, ToggleLeft, Calendar } from 'lucide-react';

export type EntityFieldType = 'String' | 'Integer' | 'Long' | 'Boolean' | 'LocalDate' | 'OffsetDateTime' | 'UUID' | 'Double' | 'BigDecimal';

export interface EntityField {
    id: string;
    name: string;
    type: EntityFieldType;
    required: boolean;
}

export type EntityNodeData = {
    name: string;
    fields: EntityField[];
    onNameChange?: (id: string, newName: string) => void;
    onAddField?: (id: string) => void;
    onRemoveField?: (nodeId: string, fieldId: string) => void;
    onFieldChange?: (nodeId: string, fieldId: string, updates: Partial<EntityField>) => void;
} & Record<string, unknown>;

export type AppNode = Node<EntityNodeData, 'entity'>;

const TYPE_ICONS: Record<string, any> = {
    'String': <List size={12} className="text-zinc-500" />,
    'Integer': <Hash size={12} className="text-zinc-500" />,
    'Long': <Hash size={12} className="text-zinc-500" />,
    'Double': <Hash size={12} className="text-zinc-500" />,
    'BigDecimal': <Hash size={12} className="text-zinc-500" />,
    'Boolean': <ToggleLeft size={12} className="text-zinc-500" />,
    'LocalDate': <Calendar size={12} className="text-zinc-500" />,
    'OffsetDateTime': <Calendar size={12} className="text-zinc-500" />,
    'UUID': <Hash size={12} className="text-zinc-500" />
};

export default function EntityNode({ id, data }: NodeProps<AppNode>) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState(data.name || 'NewEntity');

    const handleNameSubmit = () => {
        setIsEditingName(false);
        if (data.onNameChange && editNameValue.trim() !== '') {
            data.onNameChange(id, editNameValue.trim());
        } else {
            setEditNameValue(data.name || 'NewEntity');
        }
    };

    return (
        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-700/50 rounded-xl shadow-xl w-72 overflow-visible">
            {/* Input Handles for relationships */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border border-zinc-900" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-fuchsia-500 border border-zinc-900" />

            {/* Header: Entity Name */}
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-3 rounded-t-xl border-b border-zinc-800/80 flex justify-between items-center group cursor-grab active:cursor-grabbing">
                {isEditingName ? (
                    <input
                        type="text"
                        autoFocus
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onBlur={handleNameSubmit}
                        onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                        className="bg-zinc-950 text-white text-sm font-bold px-2 py-0.5 rounded outline-none border border-indigo-500/50 w-full"
                    />
                ) : (
                    <h3
                        className="text-slate-50 font-bold text-sm truncate flex-1 hover:text-indigo-400 transition-colors cursor-text"
                        onClick={() => setIsEditingName(true)}
                    >
                        {data.name || 'NewEntity'}
                    </h3>
                )}
            </div>

            {/* Fields List */}
            <div className="p-2 space-y-1">
                {data.fields && data.fields.map((field) => (
                    <div key={field.id} className="group relative flex items-center justify-between p-1.5 hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-zinc-700/50">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span title={field.type}>
                                {TYPE_ICONS[field.type] || <List size={12} className="text-zinc-500" />}
                            </span>
                            <input
                                type="text"
                                value={field.name}
                                onChange={(e) => data.onFieldChange?.(id, field.id, { name: e.target.value })}
                                className="bg-transparent text-xs text-zinc-300 focus:text-white font-medium outline-none w-20 flex-1 truncate placeholder-zinc-600"
                                placeholder="fieldName"
                            />

                            <select
                                value={field.type}
                                onChange={(e) => data.onFieldChange?.(id, field.id, { type: e.target.value as EntityFieldType })}
                                className="bg-transparent text-[10px] text-zinc-500 hover:text-zinc-300 font-mono outline-none cursor-pointer appearance-none outline-none"
                            >
                                <option value="String">String</option>
                                <option value="Integer">Integer</option>
                                <option value="Long">Long</option>
                                <option value="Boolean">Boolean</option>
                                <option value="LocalDate">LocalDate</option>
                                <option value="OffsetDateTime">OffsetDateTime</option>
                                <option value="UUID">UUID</option>
                                <option value="Double">Double</option>
                                <option value="BigDecimal">BigDecimal</option>
                            </select>
                        </div>

                        <button
                            onClick={() => data.onRemoveField?.(id, field.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-0.5 transition-all ml-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => data.onAddField?.(id)}
                    className="w-full flex items-center justify-center gap-1.5 p-1.5 mt-2 text-xs font-medium text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 border border-dashed border-zinc-700 hover:border-indigo-500/50 rounded-lg transition-all"
                >
                    <Plus size={12} />
                    Add Field
                </button>
            </div>
        </div>
    );
}
