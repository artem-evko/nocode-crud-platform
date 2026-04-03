import type { MouseEvent } from 'react';
import { Trash2, AlertTriangle, GripHorizontal } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import type { UIComponent } from '../../store/uiBuilderStore';

interface SortableComponentProps {
    component: UIComponent;
    onDragHandleMouseDown?: (e: React.MouseEvent) => void;
    onResizeMouseDown?: (e: React.MouseEvent) => void;
}

export default function SortableComponent({ component, onDragHandleMouseDown, onResizeMouseDown }: SortableComponentProps) {
    const { selectComponent, selectedComponentId, removeComponent } = useUIBuilderStore();

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

    const renderContent = () => {
        switch (component.type) {
            case 'Heading':
                return <h2 className={`text-2xl font-bold w-full h-full flex items-center ${component.props.className || ''}`}>{component.props.text || 'Heading'}</h2>;
            case 'Text':
                return <p className={`text-zinc-300 w-full h-full overflow-hidden text-ellipsis ${component.props.className || ''}`}>{component.props.text || 'Text block'}</p>;
            case 'Button':
                return <button className={`px-4 py-2 bg-indigo-600 rounded-md text-white font-medium w-full h-full ${component.props.className || ''}`}>{component.props.text || 'Button'}</button>;
            case 'DataTable':
                return (
                    <div className={`w-full h-full border-2 border-dashed rounded bg-zinc-800/50 flex items-center justify-center flex-col 
                        ${isMissingDataSource ? 'border-red-500/50' : 'border-zinc-700'}`}>
                        <span className="font-mono text-zinc-400">{'<DataTable />'}</span>
                        <span className={`text-xs mt-1 text-center ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-zinc-500'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
            case 'FormModule':
                return (
                    <div className={`w-full h-full border-2 border-dashed rounded flex items-center justify-center flex-col 
                        ${isMissingDataSource ? 'border-red-500/50 bg-red-900/10' : 'border-emerald-700/50 bg-emerald-900/10'}`}>
                        <span className="font-mono text-emerald-500/70">{'<FormModule />'}</span>
                        <span className={`text-xs mt-1 text-center ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-emerald-500/50'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
            case 'BarChart':
                return (
                    <div className={`w-full h-full border-2 border-dashed rounded flex flex-col items-center justify-center
                        ${isMissingDataSource ? 'border-red-500/50 bg-red-900/10' : 'border-violet-700/50 bg-violet-900/10'}`}>
                        <span className="font-mono text-violet-500/70">{'<BarChart />'}</span>
                        <span className={`text-xs mt-1 text-center ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-violet-500/50'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
            case 'LineChart':
                return (
                    <div className={`w-full h-full border-2 border-dashed rounded flex flex-col items-center justify-center
                        ${isMissingDataSource ? 'border-red-500/50 bg-red-900/10' : 'border-cyan-700/50 bg-cyan-900/10'}`}>
                        <span className="font-mono text-cyan-500/70">{'<LineChart />'}</span>
                        <span className={`text-xs mt-1 text-center ${isMissingDataSource ? 'text-red-400 font-semibold' : 'text-cyan-500/50'}`}>
                            {isMissingDataSource ? 'Error: Missing Entity Binding' : `Bound to: ${component.props.entityName}`}
                        </span>
                    </div>
                );
            case 'Container':
                return (
                    <div className="w-full h-full border-2 border-dashed border-amber-700/50 bg-amber-900/5 rounded flex items-center justify-center p-4">
                        <span className="font-mono text-amber-500/40 text-sm">{'<Layout Container />'}</span>
                    </div>
                );
            case 'Image':
                return (
                    <div className={`w-full h-full flex items-center justify-center bg-zinc-800/50 rounded overflow-hidden ${component.props.className || ''}`}>
                        {component.props.url ? (
                            <img src={component.props.url} alt="Component Image" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-zinc-500 text-sm">No Image</span>
                        )}
                    </div>
                );
            case 'Divider':
                return (
                    <div className="w-full h-full flex items-center px-4">
                        <hr className={`w-full border-t border-zinc-700 ${component.props.className || ''}`} />
                    </div>
                );
            case 'Card':
                return (
                    <div className={`w-full h-full bg-zinc-800/50 rounded flex flex-col justify-center items-center ${component.props.className || ''}`}>
                        <span className="text-zinc-300 font-medium text-center">{component.props.text || 'Карточка'}</span>
                    </div>
                );
            case 'Badge':
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 w-auto shadow-sm ${component.props.className || ''}`}>
                            {component.props.text || 'Badge'}
                        </span>
                    </div>
                );
            default:
                return <div>Unknown component</div>;
        }
    };

    return (
        <div
            onClick={handleSelect}
            className={`relative w-full h-full rounded-md border-2 bg-zinc-900 shadow-sm group transition-colors overflow-hidden flex flex-col
                ${isSelected ? 'border-indigo-500' : isMissingDataSource ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-zinc-800 hover:border-zinc-700'}`}
        >
            {/* Grab handle area */}
            <div
                className="drag-handle absolute top-0 left-0 w-full h-6 bg-zinc-800/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-move flex items-center justify-between px-2 z-20"
                onMouseDown={onDragHandleMouseDown}
            >
                <GripHorizontal size={14} className="text-zinc-500" />
            </div>

            {/* Validation Error Icon */}
            {isMissingDataSource && (
                <div className="absolute top-1 left-7 p-1 text-red-500 rounded-full z-10" title="Missing Data Source">
                    <AlertTriangle size={14} />
                </div>
            )}

            {/* Delete button */}
            {isSelected && (
                <button
                    onClick={handleDelete}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded shadow-md hover:bg-red-400 transition-colors z-20"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <div className={`w-full flex-1 p-4 pt-6 ${isSelected ? 'pointer-events-none' : ''}`}>
                {renderContent()}
            </div>

            {/* Resize handle - bottom-right corner */}
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
                style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(99,102,241,0.6) 50%)' }}
                onMouseDown={onResizeMouseDown}
            />
        </div>
    );
}
