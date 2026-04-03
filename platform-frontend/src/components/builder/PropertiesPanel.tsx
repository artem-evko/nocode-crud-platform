import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { apiClient } from '../../api/client';
import { useParams } from 'react-router-dom';

export default function PropertiesPanel() {
    const { projectId } = useParams();
    const { components, selectedComponentId, updateComponentProps, updateComponentLayout } = useUIBuilderStore();
    const [entities, setEntities] = useState<{ id: string, name: string, fields: any[] }[]>([]);
    const [actionFlows, setActionFlows] = useState<{ id: string, name: string }[]>([]);

    const selectedComponent = components.find(c => c.id === selectedComponentId);

    useEffect(() => {
        if (projectId) {
            apiClient.get(`/projects`)
                .then(res => {
                    const proj = res.data.find((p: any) => p.id === projectId);
                    if (proj && proj.specText && proj.specText !== '{}') {
                        try {
                            const parsed = JSON.parse(proj.specText);
                            
                            let nodes = [];
                            if (parsed._flow && parsed._flow.nodes) nodes = parsed._flow.nodes;
                            else if (parsed.flow && parsed.flow.nodes) nodes = parsed.flow.nodes;
                            else if (parsed.nodes) nodes = parsed.nodes;

                            if (nodes.length > 0) {
                                setEntities(nodes.filter((n: any) => n.type === 'entity').map((n: any) => ({
                                    id: n.id,
                                    name: n.data.name,
                                    fields: n.data.fields || []
                                })));
                            }

                            if (parsed.actionFlows) {
                                setActionFlows(parsed.actionFlows.map((f: any) => ({
                                    id: f.id,
                                    name: f.name
                                })));
                            }
                        } catch (e) {
                            console.error("Failed to parse project to extract entities for binding");
                        }
                    }
                })
                .catch(console.error);
        }
    }, [projectId]);

    if (!selectedComponent) {
        return (
            <div className="text-sm text-zinc-400 text-center py-10">
                Выберите компонент на холсте, чтобы настроить его свойства и связи с данными.
            </div>
        );
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateComponentProps(selectedComponent.id, { text: e.target.value });
    };

    const handleEntityBindingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        updateComponentProps(selectedComponent.id, { entityName: val === "none" ? null : val });
    };

    const toggleClass = (prefix: string, newValue: string) => {
        const currentClass = selectedComponent.props.className || '';
        const classes = currentClass.split(' ').filter((c: string) => !c.startsWith(prefix) && c.trim() !== '');
        if (newValue) classes.push(newValue);
        updateComponentProps(selectedComponent.id, { className: classes.join(' ').trim() });
    };

    const currentClasses = selectedComponent.props.className || '';
    
    // Find active configured styles
    const activeBgColor = ['bg-zinc-900', 'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-yellow-500', 'bg-transparent'].find(c => currentClasses.includes(c)) || 'bg-transparent';
    const activeRadius = ['rounded-none', 'rounded-md', 'rounded-xl', 'rounded-2xl', 'rounded-full'].find(c => currentClasses.includes(c)) || 'rounded-none';
    const activePadding = ['p-0', 'p-2', 'p-4', 'p-6', 'p-8'].find(c => currentClasses.includes(c)) || 'p-0';
    const activeTextColor = ['text-zinc-50', 'text-zinc-400', 'text-zinc-900', 'text-emerald-400', 'text-indigo-400', 'text-rose-400'].find(c => currentClasses.includes(c)) || 'text-zinc-50';
    const activeTextAlign = ['text-left', 'text-center', 'text-right'].find(c => currentClasses.includes(c)) || 'text-left';
    const activeTextSize = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'].find(c => currentClasses.includes(c)) || 'text-base';
    const activeFontWeight = ['font-normal', 'font-medium', 'font-semibold', 'font-bold'].find(c => currentClasses.includes(c)) || 'font-normal';
    const activeShadow = ['shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl'].find(c => currentClasses.includes(c)) || 'shadow-none';
    
    const selectedEntityDef = entities.find(e => e.name === selectedComponent.props.entityName);
    const hasEmptyFields = selectedEntityDef && (!selectedEntityDef.fields || selectedEntityDef.fields.length === 0);
    const hasEmptyAction = selectedComponent.type === 'Button' && (!selectedComponent.props.actionFlowId || selectedComponent.props.actionFlowId === 'none');

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm font-semibold text-zinc-300">Тип</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded font-mono">
                        {selectedComponent.type}
                    </span>
                </div>

                {/* General Text Property */}
                {(selectedComponent.type === 'Heading' || selectedComponent.type === 'Text' || selectedComponent.type === 'Button') && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-400 block">Текстовое содержимое</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className={`text-[10px] ${!selectedComponent.props.isDynamicText ? 'text-zinc-300' : 'text-zinc-600'}`}>Static</span>
                                <input 
                                    type="checkbox" 
                                    checked={selectedComponent.props.isDynamicText || false}
                                    onChange={(e) => updateComponentProps(selectedComponent.id, { isDynamicText: e.target.checked })}
                                    className="hidden" 
                                />
                                <div className={`w-7 h-4 rounded-full relative transition-colors ${selectedComponent.props.isDynamicText ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${selectedComponent.props.isDynamicText ? 'translate-x-3' : ''}`}></div>
                                </div>
                                <span className={`text-[10px] ${selectedComponent.props.isDynamicText ? 'text-indigo-400 font-semibold' : 'text-zinc-600'}`}>Dynamic</span>
                            </label>
                        </div>
                        <input
                            type="text"
                            placeholder={selectedComponent.props.isDynamicText ? "{item.title}" : "Текст компонента"}
                            className={`w-full bg-zinc-900 border rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors ${selectedComponent.props.isDynamicText ? 'border-indigo-600/50 font-mono text-indigo-300' : 'border-zinc-800'}`}
                            value={selectedComponent.props.text || ''}
                            onChange={handleTextChange}
                        />
                        {selectedComponent.props.isDynamicText && (
                            <p className="text-[10px] text-zinc-500">Укажите JS выражение в фигурных скобках (например, {'{item.name}'}).</p>
                        )}
                    </div>
                )}

                {/* Logic Binding Property */}
                {selectedComponent.type === 'Button' && (
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <label className="text-xs font-semibold text-zinc-400 block">Выполнить логику (Action Flow)</label>
                        <select
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={selectedComponent.props.actionFlowId || "none"}
                            onChange={(e) => updateComponentProps(selectedComponent.id, { actionFlowId: e.target.value === "none" ? null : e.target.value })}
                        >
                            <option value="none">-- Без действия --</option>
                            {actionFlows.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">
                            Выберите поток логики, который будет выполняться при клике на кнопку.
                        </p>
                        {hasEmptyAction && (
                            <div className="mt-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded p-2 flex gap-2">
                                <span>⚠️</span>
                                <span>Кнопке не назначено действие (Action Flow). Она не будет реагировать на нажатия.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Data Binding Properties */}
                {(selectedComponent.type === 'DataTable' || selectedComponent.type === 'FormModule' || selectedComponent.type === 'BarChart' || selectedComponent.type === 'LineChart') && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 block">Привязать к сущности</label>
                        <select
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            value={selectedComponent.props.entityName || "none"}
                            onChange={handleEntityBindingChange}
                        >
                            <option value="none">-- Выберите сущность --</option>
                            {entities.map(e => (
                                <option key={e.id} value={e.name}>{e.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">
                            Свяжите этот компонент с сущностью модели данных для автогенерации API-вызовов.
                        </p>
                        {selectedComponent.type === 'FormModule' && hasEmptyFields && (
                            <div className="mt-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded p-2 flex gap-2">
                                <span>⚠️</span>
                                <span>В выбранной сущности нет полей. Сгенерированная форма будет абсолютно пустой. Добавьте поля в Модели Данных!</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Chart Axis Configuration */}
                {(selectedComponent.type === 'BarChart' || selectedComponent.type === 'LineChart') && selectedComponent.props.entityName && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800 focus-within:ring-0">
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 block mb-1">Поле для Оси X (Dimension)</label>
                            <select
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={selectedComponent.props.xAxisKey || "id"}
                                onChange={(e) => updateComponentProps(selectedComponent.id, { xAxisKey: e.target.value })}
                            >
                                <option value="id">id (По умолчанию)</option>
                                {selectedEntityDef?.fields?.map((f: any) => (
                                    <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 block mb-1">Поле для Оси Y (Metric)</label>
                            <select
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={selectedComponent.props.yAxisKey || "id"}
                                onChange={(e) => updateComponentProps(selectedComponent.id, { yAxisKey: e.target.value })}
                            >
                                <option value="id">id (Количество/Id)</option>
                                {selectedEntityDef?.fields?.map((f: any) => (
                                    <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Image Property */}
                {selectedComponent.type === 'Image' && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 block pb-1">URL Изображения</label>
                        <input
                            type="text"
                            placeholder="https://example.com/image.png"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            value={selectedComponent.props.url || ''}
                            onChange={(e) => updateComponentProps(selectedComponent.id, { url: e.target.value })}
                        />
                    </div>
                )}
                {/* CSS Styling Property */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <label className="text-xs font-semibold text-zinc-400 block mb-[-8px]">Визуальные стили</label>
                    
                    <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Цвет фона</span>
                        <div className="flex flex-wrap gap-2">
                            {['bg-transparent', 'bg-zinc-900', 'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-yellow-500'].map(bg => (
                                <button
                                    key={bg}
                                    onClick={() => toggleClass('bg-', bg === 'bg-transparent' ? '' : bg)}
                                    className={`w-6 h-6 rounded-md border-2 transition-all ${bg === 'bg-transparent' ? 'bg-zinc-950 border-dashed' : bg.replace('-500', '-500/80')} ${activeBgColor === bg ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                    title={bg}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Скругление углов</span>
                        <div className="flex gap-2">
                            {[
                                { class: 'rounded-none', label: '0px' },
                                { class: 'rounded-md', label: '4px' },
                                { class: 'rounded-xl', label: '12px' },
                                { class: 'rounded-2xl', label: '16px' },
                                { class: 'rounded-full', label: 'Max' }
                            ].map(r => (
                                <button
                                    key={r.class}
                                    onClick={() => toggleClass('rounded-', r.class === 'rounded-none' ? '' : r.class)}
                                    className={`px-2 py-1 flex-1 text-xs border rounded transition-colors ${activeRadius === r.class ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Отступы (Padding)</span>
                        <div className="flex gap-2">
                            {[
                                { class: 'p-0', label: '0' },
                                { class: 'p-2', label: 'S' },
                                { class: 'p-4', label: 'M' },
                                { class: 'p-6', label: 'L' },
                                { class: 'p-8', label: 'XL' }
                            ].map(p => (
                                <button
                                    key={p.class}
                                    onClick={() => toggleClass('p-', p.class === 'p-0' ? '' : p.class)}
                                    className={`px-2 py-1 flex-1 text-xs border rounded transition-colors ${activePadding === p.class ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Цвет текста</span>
                        <div className="flex flex-wrap gap-2">
                            {['text-zinc-50', 'text-zinc-400', 'text-zinc-900', 'text-emerald-400', 'text-indigo-400', 'text-rose-400'].map(tc => (
                                <button
                                    key={tc}
                                    onClick={() => toggleClass('text-', tc)}
                                    className={`w-6 h-6 rounded-md border-2 transition-all bg-zinc-900 flex items-center justify-center ${activeTextColor === tc ? 'border-indigo-500 scale-110' : 'border-zinc-700 hover:scale-105 hover:border-zinc-500'}`}
                                    title={tc}
                                >
                                    <span className={`${tc} font-bold text-xs`}>A</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Выравнивание & Тень</span>
                        <div className="flex gap-2 mb-2">
                            {[
                                { class: 'text-left', label: 'Left' },
                                { class: 'text-center', label: 'Center' },
                                { class: 'text-right', label: 'Right' }
                            ].map(a => (
                                <button
                                    key={a.class}
                                    onClick={() => toggleClass('text-', a.class)}
                                    className={`px-2 py-1 flex-1 text-xs border rounded transition-colors ${activeTextAlign === a.class ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {[
                                { class: 'shadow-none', label: 'No Shadow' },
                                { class: 'shadow-md', label: 'Medium' },
                                { class: 'shadow-xl', label: 'Large' }
                            ].map(s => (
                                <button
                                    key={s.class}
                                    onClick={() => toggleClass('shadow-', s.class === 'shadow-none' ? '' : s.class)}
                                    className={`px-2 py-1 flex-1 text-xs border rounded transition-colors ${activeShadow === s.class ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Шрифт (Размер / Вес)</span>
                        <div className="flex gap-2 mb-2">
                            {[
                                { class: 'text-sm', label: 'SM' },
                                { class: 'text-base', label: 'Base' },
                                { class: 'text-xl', label: 'XL' },
                                { class: 'text-3xl', label: '3XL' }
                            ].map(s => (
                                <button
                                    key={s.class}
                                    onClick={() => toggleClass('text-', s.class)}
                                    className={`px-2 py-1 flex-1 text-xs border rounded transition-colors ${activeTextSize === s.class ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            {[
                                { class: 'font-normal', label: 'Regular' },
                                { class: 'font-medium', label: 'Medium' },
                                { class: 'font-bold', label: 'Bold' }
                            ].map(fw => (
                                <button
                                    key={fw.class}
                                    onClick={() => toggleClass('font-', fw.class)}
                                    className={`px-2 py-1 flex-1 text-xs border rounded transition-colors ${activeFontWeight === fw.class ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                >
                                    {fw.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Tailwind Classes (Вручную)</span>
                        <input
                            type="text"
                            placeholder="Например: opacity-50 shadow-xl"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm font-mono text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                            value={selectedComponent.props.className || ''}
                            onChange={(e) => updateComponentProps(selectedComponent.id, { className: e.target.value })}
                        />
                    </div>
                </div>

                {/* Layout Properties */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <label className="text-xs font-semibold text-zinc-400 block pb-1">Размещение и Размер (Сетка 12)</label>
                    <div className="grid grid-cols-2 gap-3 pb-2">
                        {/* W */}
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Ширина (1-12)</label>
                            <input
                                type="number"
                                min="1" max="12"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={selectedComponent.layout?.w || 4}
                                onChange={(e) => updateComponentLayout(selectedComponent.id, { ...(selectedComponent.layout || {x:0,y:0,w:4,h:4}), w: Math.min(12, Math.max(1, parseInt(e.target.value) || 1)) })}
                            />
                        </div>
                        {/* H */}
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Высота (Строки)</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={selectedComponent.layout?.h || 4}
                                onChange={(e) => updateComponentLayout(selectedComponent.id, { ...(selectedComponent.layout || {x:0,y:0,w:4,h:4}), h: Math.max(1, parseInt(e.target.value) || 1) })}
                            />
                        </div>
                        {/* X */}
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Позиция X (0-11)</label>
                            <input
                                type="number"
                                min="0" max="11"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={selectedComponent.layout?.x || 0}
                                onChange={(e) => updateComponentLayout(selectedComponent.id, { ...(selectedComponent.layout || {x:0,y:0,w:4,h:4}), x: Math.min(11, Math.max(0, parseInt(e.target.value) || 0)) })}
                            />
                        </div>
                        {/* Y */}
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Позиция Y (Строки)</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value={selectedComponent.layout?.y || 0}
                                onChange={(e) => updateComponentLayout(selectedComponent.id, { ...(selectedComponent.layout || {x:0,y:0,w:4,h:4}), y: Math.max(0, parseInt(e.target.value) || 0) })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
