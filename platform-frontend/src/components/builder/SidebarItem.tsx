import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from '../../store/uiBuilderStore';

interface SidebarItemProps {
    type: ComponentType;
    label: string;
    icon: LucideIcon;
    iconColor?: string;
}

export default function SidebarItem({ type, label, icon: Icon, iconColor }: SidebarItemProps) {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const dragData = {
            type: "SidebarItem",
            componentType: type,
            label
        };
        e.dataTransfer.setData("application/json", JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={`border border-zinc-800 bg-zinc-900 rounded-md p-3 flex items-center gap-3 cursor-grab hover:border-zinc-700 transition-colors active:cursor-grabbing hover:bg-zinc-800`}
        >
            <Icon className={iconColor || "text-zinc-400"} size={18} />
            <span className="text-sm font-medium select-none">{label}</span>
        </div>
    );
}
