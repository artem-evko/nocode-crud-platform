import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlusCircle } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import SortableComponent from './SortableComponent';

export default function CanvasArea() {
    const { components } = useUIBuilderStore();

    // The canvas itself is a droppable area for new components
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-drop-zone',
        data: {
            type: "Canvas"
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`w-full max-w-5xl min-h-[800px] bg-zinc-950 border shadow-2xl rounded-lg p-8 relative transition-colors ${isOver ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-800 ring-1 ring-white/5'}`}
        >
            {components.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-zinc-800/50 m-8 rounded-lg pointer-events-none">
                    <div className="text-zinc-500 flex flex-col items-center gap-2">
                        <PlusCircle size={24} className="opacity-50" />
                        <span>Drag components here</span>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 min-h-full">
                    {/* We use SortableContext to make the items inside the canvas sortable among themselves */}
                    <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {components.map((comp) => (
                            <SortableComponent key={comp.id} component={comp} />
                        ))}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}
