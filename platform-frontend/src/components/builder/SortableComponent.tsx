import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MouseEvent } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import type { UIComponent } from '../../store/uiBuilderStore';

interface SortableComponentProps {
    component: UIComponent;
}

export default function SortableComponent({ component }: SortableComponentProps) {
    const { selectComponent, selectedComponentId, removeComponent } = useUIBuilderStore();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: component.id,
        data: {
            "type": "CanvasItem",
            component
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isSelected = selectedComponentId === component.id;

    const isDataComponent = component.type === 'DataTable' || component.type === 'FormModule' || component.type === 'BarChart' || component.type === 'LineChart';
    const isMissingDataSource = isDataComponent && !component.props.entityName;

    const handleSelect = (e: MouseEvent) => {
        e.stopPropagation();
        selectComponent(component.id);
    };

    const handleDelete = (e: MouseEvent) => {
        e.stopPropagation();
        removeComponent(component.id);
    };

    // Very basic rendering switch
    const renderContent = () => {
        switch (component.type) {
            case 'Heading':
                return <h2 className="text-2xl font-bold">{component.props.text || 'Heading'}</h2>;
            case 'Text':
                return <p className="text-zinc-300">{component.props.text || 'Text block'}</p>;
            case 'Button':
                return <button className="px-4 py-2 bg-indigo-600 rounded-md text-white font-medium">{component.props.text || 'Button'}</button>;
            case 'DataTable':
                return (
                    <div className={`w-full h-48 border-2 border-dashed rounded bg-zinc-800/50 flex items-center justify-center flex-col 
                        ${isMissingDataSource ? 'border-red-500/50' : 'border-zinc-700'}`}>
                        <span className="font-mono text-zinc-400">{'<DataTable />'}</span>
                        <span className={`text-xs mt-1 ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-zinc-500'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
                return (
                    <div className={`w-full h-48 border-2 border-dashed rounded flex items-center justify-center flex-col 
                        ${isMissingDataSource ? 'border-red-500/50 bg-red-900/10' : 'border-emerald-700/50 bg-emerald-900/10'}`}>
                        <span className="font-mono text-emerald-500/70">{'<FormModule />'}</span>
                        <span className={`text-xs mt-1 ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-emerald-500/50'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
            case 'BarChart':
                return (
                    <div className={`w-full h-48 border-2 border-dashed rounded flex flex-col items-center justify-center
                        ${isMissingDataSource ? 'border-red-500/50 bg-red-900/10' : 'border-violet-700/50 bg-violet-900/10'}`}>
                        <span className="font-mono text-violet-500/70">{'<BarChart />'}</span>
                        <span className={`text-xs mt-1 ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-violet-500/50'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
            case 'LineChart':
                return (
                    <div className={`w-full h-48 border-2 border-dashed rounded flex flex-col items-center justify-center
                        ${isMissingDataSource ? 'border-red-500/50 bg-red-900/10' : 'border-cyan-700/50 bg-cyan-900/10'}`}>
                        <span className="font-mono text-cyan-500/70">{'<LineChart />'}</span>
                        <span className={`text-xs mt-1 ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-cyan-500/50'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
            case 'Container':
                return (
                    <div className="w-full min-h-32 border-2 border-dashed border-amber-700/50 bg-amber-900/5 rounded flex items-center justify-center p-4">
                        <span className="font-mono text-amber-500/40 text-sm">{'<Layout Container />'}</span>
                    </div>
                );
            default:
                return <div>Unknown component</div>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handleSelect}
            className={`relative p-4 rounded-md border-2 bg-zinc-900 shadow-sm cursor-grab group transition-colors ${isDragging ? 'opacity-50 z-50 shadow-xl' : 'opacity-100'
                } ${isSelected ? 'border-indigo-500' : isMissingDataSource ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-zinc-800 hover:border-zinc-700'
                }`}
        >
            {/* Grab handle area for sortable */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 p-1 text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {/* Drag icon */}
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM5.5 5C5.22386 5 5 4.77614 5 4.5C5 4.22386 5.22386 4 5.5 4C5.77614 4 6 4.22386 6 4.5C6 4.77614 5.77614 5 5.5 5ZM9.5 3C8.67157 3 8 3.67157 8 4.5C8 5.32843 8.67157 6 9.5 6C10.32843 6 11 5.32843 11 4.5C11 3.67157 10.32843 3 9.5 3ZM9.5 5C9.22386 5 9 4.77614 9 4.5C9 4.22386 9.22386 4 9.5 4C9.77614 4 10 4.22386 10 4.5C10 4.77614 9.77614 5 9.5 5ZM5.5 7C4.67157 7 4 7.67157 4 8.5C4 9.32843 4.67157 10 5.5 10C6.32843 10 7 9.32843 7 8.5C7 7.67157 6.32843 7 5.5 7ZM5.5 9C5.22386 9 5 8.77614 5 8.5C5 8.22386 5.22386 8 5.5 8C5.77614 8 6 8.22386 6 8.5C6 8.77614 5.77614 9 5.5 9ZM9.5 7C8.67157 7 8 7.67157 8 8.5C8 9.32843 8.67157 10 9.5 10C10.32843 10 11 9.32843 11 8.5C11 7.67157 10.32843 7 9.5 7ZM9.5 9C9.22386 9 9 8.77614 9 8.5C9 8.22386 9.22386 8 9.5 8C9.77614 8 10 8.22386 10 8.5C10 8.77614 9.77614 9 9.5 9ZM5.5 11C4.67157 11 4 11.6715 4 12.5C4 13.3284 4.67157 14 5.5 14C6.32843 14 7 13.3284 7 12.5C7 11.6715 6.32843 11 5.5 11ZM5.5 13C5.22386 13 5 12.7761 5 12.5C5 12.2239 5.22386 12 5.5 12C5.77614 12 6 12.2239 6 12.5C6 12.7761 5.77614 13 5.5 13ZM9.5 11C8.67157 11 8 11.6715 8 12.5C8 13.3284 8.67157 14 9.5 14C10.3284 14 11 13.3284 11 12.5C11 11.6715 10.3284 11 9.5 11ZM9.5 13C9.22386 13 9 12.7761 9 12.5C9 12.2239 9.22386 12 9.5 12C9.77614 12 10 12.2239 10 12.5C10 12.7761 9.77614 13 9.5 13Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
            </div>

            {/* Validation Error Icon */}
            {isMissingDataSource && (
                <div className="absolute -top-3 -left-3 p-1.5 text-red-500 bg-zinc-900 rounded-full z-10 shadow-md border border-red-500/30" title="Missing Data Source">
                    <AlertTriangle size={14} />
                </div>
            )}

            {/* Delete button */}
            {isSelected && (
                <button
                    onClick={handleDelete}
                    className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-400 transition-colors z-10"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <div className={`px-6 py-2 ${isSelected ? 'pointer-events-none' : ''}`}>
                {renderContent()}
            </div>
        </div>
    );
}
