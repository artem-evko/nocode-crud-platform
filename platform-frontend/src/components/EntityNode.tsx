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
    readRoles?: string;
    createRoles?: string;
    updateRoles?: string;
    deleteRoles?: string;
    onNameChange?: (id: string, newName: string) => void;
    onAddField?: (id: string) => void;
    onRemoveField?: (nodeId: string, fieldId: string) => void;
    onFieldChange?: (nodeId: string, fieldId: string, updates: Partial<EntityField>) => void;
    onRolesChange?: (nodeId: string, updates: Partial<{ readRoles: string, createRoles: string, updateRoles: string, deleteRoles: string }>) => void;
} & Record<string, unknown>;

export type AppNode = Node<EntityNodeData, 'entity'>;

const TYPE_ICONS: Record<string, any> = {
    'String': <List size={12} className="text-gray-400 dark:text-zinc-500" />,
    'Integer': <Hash size={12} className="text-gray-400 dark:text-zinc-500" />,
    'Long': <Hash size={12} className="text-gray-400 dark:text-zinc-500" />,
    'Double': <Hash size={12} className="text-gray-400 dark:text-zinc-500" />,
    'BigDecimal': <Hash size={12} className="text-gray-400 dark:text-zinc-500" />,
    'Boolean': <ToggleLeft size={12} className="text-gray-400 dark:text-zinc-500" />,
    'LocalDate': <Calendar size={12} className="text-gray-400 dark:text-zinc-500" />,
    'OffsetDateTime': <Calendar size={12} className="text-gray-400 dark:text-zinc-500" />,
    'UUID': <Hash size={12} className="text-gray-400 dark:text-zinc-500" />
};

export default function EntityNode({ id, data }: NodeProps<AppNode>) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState(data.name || 'NewEntity');
    const [showPermissions, setShowPermissions] = useState(false);

    const handleNameSubmit = () => {
        setIsEditingName(false);
        if (data.onNameChange && editNameValue.trim() !== '') {
            data.onNameChange(id, editNameValue.trim());
        } else {
            setEditNameValue(data.name || 'NewEntity');
        }
    };

    const isValidEntityName = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(data.name || 'НоваяСущность');

    return (
        <div className={`bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border rounded-xl shadow-xl w-72 overflow-visible transition-colors ${!isValidEntityName ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-300 dark:border-zinc-700/50'}`}>
            {/* Input Handles for relationships */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border border-white dark:border-zinc-900" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-fuchsia-500 border border-white dark:border-zinc-900" />

            {/* Header: Entity Name */}
            <div className={`p-3 rounded-t-xl border-b border-gray-200 dark:border-zinc-800/80 flex justify-between items-center group cursor-grab active:cursor-grabbing ${!isValidEntityName ? 'bg-red-50 dark:bg-red-950/40' : 'bg-gradient-to-r from-gray-100 dark:from-zinc-800 to-gray-50 dark:to-zinc-900'}`}>
                {isEditingName ? (
                    <input
                        type="text"
                        autoFocus
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onBlur={handleNameSubmit}
                        onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                        className="bg-white dark:bg-zinc-950 text-gray-900 dark:text-white text-sm font-bold px-2 py-0.5 rounded outline-none border border-indigo-500/50 w-full"
                    />
                ) : (
                    <h3
                        className="text-gray-900 dark:text-slate-50 font-bold text-sm truncate flex-1 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-text"
                        onClick={() => setIsEditingName(true)}
                    >
                        {data.name || 'НоваяСущность'}
                    </h3>
                )}
            </div>

            {/* Fields List */}
            <div className="p-2 space-y-1">
                {data.fields && data.fields.map((field) => (
                    <div key={field.id} className="group relative flex items-center justify-between p-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700/50">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span title={field.type}>
                                {TYPE_ICONS[field.type] || <List size={12} className="text-gray-400 dark:text-zinc-500" />}
                            </span>
                            <input
                                type="text"
                                value={field.name}
                                onChange={(e) => data.onFieldChange?.(id, field.id, { name: e.target.value })}
                                title={!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name) ? 'Используйте только латинские буквы без пробелов' : ''}
                                className={`bg-transparent text-xs font-medium outline-none w-20 flex-1 truncate placeholder-gray-400 dark:placeholder-zinc-600 px-1 py-0.5 rounded ${!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name) ? 'text-red-400 border border-red-500/50 bg-red-500/10' : 'text-gray-600 dark:text-zinc-300 focus:text-gray-900 dark:focus:text-white'}`}
                                placeholder="fieldName"
                            />

                            <select
                                value={field.type}
                                onChange={(e) => data.onFieldChange?.(id, field.id, { type: e.target.value as EntityFieldType })}
                                className="bg-transparent text-[10px] text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 focus:text-gray-700 dark:focus:text-zinc-200 font-mono outline-none cursor-pointer"
                            >
                                <option value="String" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">String</option>
                                <option value="Integer" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">Integer</option>
                                <option value="Long" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">Long</option>
                                <option value="Boolean" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">Boolean</option>
                                <option value="LocalDate" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">LocalDate</option>
                                <option value="OffsetDateTime" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">OffsetDateTime</option>
                                <option value="UUID" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">UUID</option>
                                <option value="Double" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">Double</option>
                                <option value="BigDecimal" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-200">BigDecimal</option>
                            </select>
                        </div>

                        <button
                            onClick={() => data.onRemoveField?.(id, field.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-zinc-500 hover:text-red-400 p-0.5 transition-all ml-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => data.onAddField?.(id)}
                    className="w-full flex items-center justify-center gap-1.5 p-1.5 mt-2 text-xs font-medium text-gray-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-dashed border-gray-300 dark:border-zinc-700 hover:border-indigo-500/50 rounded-lg transition-all"
                >
                    <Plus size={12} />
                    Добавить поле
                </button>
            </div>

            {/* Permissions Section */}
            <div className="p-2 border-t border-gray-200 dark:border-zinc-800/80">
                <button
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="w-full flex justify-between items-center px-2 py-1 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <span>Права доступа (RBAC)</span>
                    <span className="text-[10px]">{showPermissions ? '▲' : '▼'}</span>
                </button>

                {showPermissions && (
                    <div className="mt-2 space-y-2 px-1">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold">Чтение (Роли)</label>
                            <input
                                type="text"
                                value={data.readRoles || ''}
                                onChange={e => data.onRolesChange?.(id, { readRoles: e.target.value })}
                                placeholder="ROLE_USER, ROLE_ADMIN"
                                className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-900 dark:text-white rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold">Создание (Роли)</label>
                            <input
                                type="text"
                                value={data.createRoles || ''}
                                onChange={e => data.onRolesChange?.(id, { createRoles: e.target.value })}
                                placeholder="ROLE_ADMIN"
                                className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-900 dark:text-white rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold">Обновление (Роли)</label>
                            <input
                                type="text"
                                value={data.updateRoles || ''}
                                onChange={e => data.onRolesChange?.(id, { updateRoles: e.target.value })}
                                placeholder="ROLE_ADMIN"
                                className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-900 dark:text-white rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-bold">Удаление (Роли)</label>
                            <input
                                type="text"
                                value={data.deleteRoles || ''}
                                onChange={e => data.onRolesChange?.(id, { deleteRoles: e.target.value })}
                                placeholder="ROLE_ADMIN"
                                className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-900 dark:text-white rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
