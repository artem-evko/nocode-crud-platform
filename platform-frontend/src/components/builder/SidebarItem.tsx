import type { LucideIcon } from 'lucide-react';
import { useUIBuilderStore, type ComponentType } from '../../store/uiBuilderStore';

interface SidebarItemProps {
    type: ComponentType;
    label: string;
    description: string;
    icon: LucideIcon;
    iconColor?: string;
}

export default function SidebarItem({ type, label, description, icon: Icon, iconColor }: SidebarItemProps) {
    const { addComponent } = useUIBuilderStore();
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const dragData = {
            type: "SidebarItem",
            componentType: type,
            label
        };
        e.dataTransfer.setData("application/json", JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleClick = () => {
        let w = 4; let h = 4;
        if (type === 'DataTable') { w = 8; h = 6; }
        if (type === 'BarChart' || type === 'LineChart') { w = 6; h = 8; }
        if (type === 'FormModule') { w = 6; h = 6; }
        if (type === 'Heading' || type === 'Text') { w = 4; h = 2; }

        const storeComponents = useUIBuilderStore.getState().components;
        let maxY = 0;
        storeComponents.forEach(c => {
            if (c.layout && c.layout.y + c.layout.h > maxY) {
                maxY = c.layout.y + c.layout.h;
            }
        });

        addComponent({
            id: Math.random().toString(36).substring(2, 11),
            type: type,
            props: { text: `Новый компонент ${type}` },
            layout: { x: 0, y: maxY, w, h }
        });
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={handleClick}
            className={`border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md p-3 flex items-start gap-3 cursor-grab hover:border-gray-300 dark:hover:border-zinc-700 transition-colors active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-zinc-800`}
            title="Перетащите или нажмите, чтобы добавить"
        >
            <Icon className={`mt-0.5 min-w-5 shrink-0 ${iconColor || "text-gray-400 dark:text-zinc-400"}`} size={18} />
            <div className="flex flex-col select-none">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">{label}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 leading-tight">{description}</span>
            </div>
        </div>
    );
}
