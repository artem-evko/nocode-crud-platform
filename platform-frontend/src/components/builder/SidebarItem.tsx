import { useDraggable } from '@dnd-kit/core';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from '../../store/uiBuilderStore';

interface SidebarItemProps {
    id: string; // Draggable ID, usually identifies the type of component being dragged
    type: ComponentType;
    label: string;
    icon: LucideIcon;
    iconColor?: string;
}

export default function SidebarItem({ id, type, label, icon: Icon, iconColor }: SidebarItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id,
        data: {
            "type": "SidebarItem",
            "componentType": type,
            label,
        }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`border border-zinc-800 bg-zinc-900 rounded-md p-3 flex items-center gap-3 cursor-grab hover:border-zinc-700 transition-colors ${isDragging ? 'opacity-50 border-indigo-500' : ''}`}
        >
            <Icon className={iconColor || "text-zinc-400"} size={18} />
            <span className="text-sm font-medium select-none">{label}</span>
        </div>
    );
}
