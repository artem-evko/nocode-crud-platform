import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, MessageSquare, Zap, ArrowRight, MousePointerClick } from 'lucide-react';

interface LogicNodeProps {
    data: {
        label: string;
        type: 'trigger' | 'action' | 'logic';
        action: string;
        config?: any;
    };
    isConnectable: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
    UI_CLICK: <MousePointerClick size={16} className="text-orange-400" />,
    DB_CREATE_RECORD: <Database size={16} className="text-emerald-400" />,
    DB_UPDATE_RECORD: <Database size={16} className="text-emerald-400" />,
    DB_DELETE_RECORD: <Database size={16} className="text-emerald-400" />,
    UI_SHOW_TOAST: <MessageSquare size={16} className="text-blue-400" />,
    NAVIGATE: <ArrowRight size={16} className="text-blue-400" />
};

export default function LogicNode({ data, isConnectable }: LogicNodeProps) {
    const isTrigger = data.type === 'trigger';

    let bgColor = 'bg-white dark:bg-zinc-900';
    let borderColor = 'border-gray-300 dark:border-zinc-700';
    if (data.type === 'trigger') {
        borderColor = 'border-orange-500/50';
        bgColor = 'bg-orange-50 dark:bg-orange-500/10';
    } else if (data.type === 'action') {
        borderColor = 'border-emerald-500/50';
        bgColor = 'bg-emerald-50 dark:bg-emerald-500/10';
    } else if (data.type === 'logic') {
        borderColor = 'border-blue-500/50';
        bgColor = 'bg-blue-50 dark:bg-blue-500/10';
    }

    return (
        <div className={`min-w-[200px] border shadow-md rounded-xl p-3 ${bgColor} ${borderColor} transition-all duration-200 hover:shadow-lg backdrop-blur-sm`}>
            {/* Input handle (unless it's a trigger) */}
            {!isTrigger && (
                <Handle
                    type="target"
                    position={Position.Top}
                    isConnectable={isConnectable}
                    className="w-3 h-3 border-2 border-white dark:border-zinc-900 bg-gray-400 dark:bg-zinc-500"
                />
            )}

            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-zinc-800/80 rounded-lg shrink-0">
                    {iconMap[data.action] || <Zap size={16} className="text-gray-400 dark:text-zinc-400" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        {data.type}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {data.label}
                    </span>
                </div>
            </div>

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className={`w-3 h-3 border-2 border-white dark:border-zinc-900 ${
                    data.type === 'trigger' ? 'bg-orange-400' :
                    data.type === 'action' ? 'bg-emerald-400' : 'bg-blue-400'
                }`}
            />
        </div>
    );
}
