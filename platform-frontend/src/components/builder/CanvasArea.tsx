// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import SortableComponent from './SortableComponent';

// Simple self-contained grid builder without external DnD libraries.
// Components are added by dragging from sidebar using native HTML5 DnD.

const GRID_COLS = 12;
const ROW_HEIGHT = 48; // px per grid row

export default function CanvasArea() {
    const { components, addComponent, updateComponentLayout, selectComponent } = useUIBuilderStore();
    const [isDragOver, setIsDragOver] = useState(false);
    const [resizing, setResizing] = useState(null); // { id, startX, startY, startW, startH }

    // dynamically resize background to furthest component
    const maxRow = components.reduce((max, c) => Math.max(max, (c.layout?.y || 0) + (c.layout?.h || 0)), 0);
    const canvasHeight = Math.max(800, (maxRow + 3) * ROW_HEIGHT);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
            const dataStr = e.dataTransfer?.getData('application/json');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);
            if (data.type !== 'SidebarItem') return;

            // Snap drop position to grid
            const rect = e.currentTarget.getBoundingClientRect();
            const colWidth = rect.width / GRID_COLS;
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(relX / colWidth)));
            const row = Math.max(0, Math.floor(relY / ROW_HEIGHT));

            let w = 4; let h = 4;
            if (data.componentType === 'DataTable') { w = 8; h = 6; }
            if (data.componentType === 'BarChart' || data.componentType === 'LineChart') { w = 6; h = 8; }
            if (data.componentType === 'FormModule') { w = 6; h = 6; }
            if (data.componentType === 'Heading' || data.componentType === 'Text') { w = 4; h = 2; }
            if (data.componentType === 'Card') { w = 4; h = 4; }
            if (data.componentType === 'Badge') { w = 2; h = 1; }

            addComponent({
                id: Math.random().toString(36).substr(2, 9),
                type: data.componentType,
                props: { text: `Новый компонент ${data.componentType}` },
                layout: { x: col, y: row, w, h }
            });
        } catch (err) {
            console.error(err);
        }
    }, [addComponent]);

    return (
        <div
            className={`w-full bg-white dark:bg-zinc-950 border shadow-2xl rounded-lg relative transition-colors ${isDragOver ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/5' : 'border-gray-200 dark:border-zinc-800 ring-1 ring-black/5 dark:ring-white/5'}`}
            style={{ position: 'relative', minHeight: `${canvasHeight}px` }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
            onDrop={handleDrop}
            onClick={() => selectComponent(null)}
        >
            {components.length === 0 && !isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-800/50 m-8 rounded-lg pointer-events-none">
                    <div className="text-gray-400 dark:text-zinc-500 flex flex-col items-center gap-2">
                        <PlusCircle size={24} className="opacity-50" />
                        <span>Перетащите компоненты сюда</span>
                    </div>
                </div>
            )}

            {/* Background grid lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(to right, rgba(156,163,175,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(156,163,175,0.2) 1px, transparent 1px)',
                backgroundSize: `${100 / GRID_COLS}% ${ROW_HEIGHT}px`,
            }} />

            {/* Canvas area for components - use CSS absolute positioning */}
            <div className="relative" style={{ minHeight: `${canvasHeight}px` }} data-canvas="true">
                {components.map((comp) => {
                    const layout = comp.layout || { x: 0, y: 0, w: 4, h: 4 };
                    return (
                        <ComponentBlock
                            key={comp.id}
                            comp={comp}
                            layout={layout}
                            onLayoutChange={(newLayout) => updateComponentLayout(comp.id, newLayout)}
                            onSelect={() => selectComponent(comp.id)}
                            containerRef={{ gridCols: GRID_COLS, rowHeight: ROW_HEIGHT }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function ComponentBlock({ comp, layout, onLayoutChange, onSelect, containerRef }) {
    const [dragging, setDragging] = useState(false);
    const [localLayout, setLocalLayout] = useState(layout);

    useEffect(() => {
        setLocalLayout(layout);
    }, [layout]);

    // Use localLayout for smooth drag, then sync to store on drop
    const { x, y, w, h } = localLayout;
    const { gridCols, rowHeight } = containerRef;

    // We derive pixel values from a % grid system baked into the parent container
    // Since the parent is 100% wide, col width = 100% / GRID_COLS
    const style = {
        position: 'absolute',
        left: `calc(${(x / gridCols) * 100}% + 4px)`,
        top: `${y * rowHeight + 4}px`,
        width: `calc(${(w / gridCols) * 100}% - 8px)`,
        height: `${h * rowHeight - 8}px`,
        transition: dragging ? 'none' : 'top 0.1s, left 0.1s',
    };

    const handleMouseDownDrag = (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        onSelect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLayout = { ...localLayout };
        setDragging(true);

        const container = e.currentTarget.closest('[data-canvas]');
        const rect = container?.getBoundingClientRect();
        if (!rect) return;
        const colPx = rect.width / gridCols;

        const onMove = (mv) => {
            const dx = mv.clientX - startX;
            const dy = mv.clientY - startY;
            const newX = Math.max(0, Math.min(gridCols - startLayout.w, startLayout.x + Math.round(dx / colPx)));
            const newY = Math.max(0, startLayout.y + Math.round(dy / rowHeight));
            setLocalLayout({ ...startLayout, x: newX, y: newY });
        };
        const onUp = () => {
            setDragging(false);
            setLocalLayout(prev => { onLayoutChange(prev); return prev; });
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleMouseDownResize = (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLayout = { ...localLayout };

        const container = e.currentTarget.closest('[data-canvas]');
        const rect = container?.getBoundingClientRect();
        if (!rect) return;
        const colPx = rect.width / gridCols;

        const onMove = (mv) => {
            const dx = mv.clientX - startX;
            const dy = mv.clientY - startY;
            const newW = Math.max(2, Math.min(gridCols - startLayout.x, startLayout.w + Math.round(dx / colPx)));
            const newH = Math.max(2, startLayout.h + Math.round(dy / rowHeight));
            setLocalLayout({ ...startLayout, w: newW, h: newH });
        };
        const onUp = () => {
            setLocalLayout(prev => { onLayoutChange(prev); return prev; });
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    return (
        <div style={style} data-component-id={comp.id} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            <SortableComponent
                component={comp}
                onDragHandleMouseDown={handleMouseDownDrag}
                onResizeMouseDown={handleMouseDownResize}
            />
        </div>
    );
}
