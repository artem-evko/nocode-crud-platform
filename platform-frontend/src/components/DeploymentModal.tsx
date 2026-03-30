import { useEffect, useState } from 'react';
import { X, PlayCircle, Loader2, Link as LinkIcon, AlertCircle, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client';

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentUIComponents?: any[]; // optional prop to validate unsaved state
}

export default function DeploymentModal({ isOpen, onClose, projectId, currentUIComponents }: DeploymentModalProps) {
    const [status, setStatus] = useState<string>('NONE'); // NONE, DEPLOYING, RUNNING, FAILED, STOPPING, PORT_OCCUPIED
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const [isTriggering, setIsTriggering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [port, setPort] = useState<string>('');

    useEffect(() => {
        if (!isOpen || !projectId) return;
        
        // Initial fetch
        fetchStatus();

        // Polling if active operation
        const intervalId = setInterval(() => {
            fetchStatus();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [isOpen, projectId]);

    const fetchStatus = async () => {
        try {
            const res = await apiClient.get('/projects');
            const proj = res.data.find((p: any) => p.id === projectId);
            if (proj) {
                if (proj.deploymentStatus) setStatus(proj.deploymentStatus);
                if (proj.deploymentUrl) setLiveUrl(proj.deploymentUrl);
            }
        } catch (error) {
            console.error("Failed to fetch deployment status", error);
        }
    };

    const handleDeploy = async () => {
        try {
            setError(null);
            
            // Validate the UI components before deployment
            let compsToValidate = currentUIComponents;
            
            // If we are deploying via Dashboard, fetch DB spec
            if (!compsToValidate) {
                const res = await apiClient.get('/projects');
                const proj = res.data.find((p: any) => p.id === projectId);
                if (proj && proj.specText) {
                    try {
                        const spec = JSON.parse(proj.specText);
                        compsToValidate = spec?.uiSpec?.components || [];
                    } catch (e) {}
                }
            }

            if (compsToValidate && compsToValidate.length > 0) {
                const invalid = compsToValidate.filter((c: any) => 
                    (c.type === 'DataTable' || c.type === 'FormModule') && !c.props.entityName
                );
                if (invalid.length > 0) {
                    setError("В проекте есть компоненты (Таблица данных или Форма), у которых не выбрана Сущность данных. Пожалуйста, закройте это окно, выберите элемент на холсте и привяжите Сущность в правой панели свойств.");
                    return;
                }
            }

            setIsTriggering(true);
            const queryPort = port.trim() ? `?port=${port.trim()}` : '';
            await apiClient.post(`/projects/${projectId}/deploy${queryPort}`);
            setStatus('DEPLOYING');
        } catch (e: any) {
            console.error("Deploy trigger failed", e);
            setError("Произошла ошибка при отправке запроса на развертывание.");
        } finally {
            setIsTriggering(false);
        }
    };

    const handleStop = async () => {
        try {
            setIsTriggering(true);
            await apiClient.delete(`/projects/${projectId}/deploy`);
            setStatus('STOPPING');
        } catch (error) {
            console.error("Stop deploy trigger failed", error);
        } finally {
            setIsTriggering(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-zinc-800/60">
                    <h2 className="text-xl font-bold text-white tracking-tight">Cloud Развёртывание</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-sm text-red-400 flex items-start gap-2 animate-in fade-in">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {status === 'PORT_OCCUPIED' && (
                        <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-3 text-sm text-amber-400 flex items-start gap-2 animate-in fade-in">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>Этот порт уже занят другим приложением. Укажите вручную другой свободный порт или оставьте поле пустым для автоматического выбора.</span>
                        </div>
                    )}

                    <p className="text-zinc-400 text-sm">
                        Разверните ваше приложение в облаке в один клик. Платформа автоматически настроит инфраструктуру, соберёт docker-контейнеры и опубликует ваше приложение.
                    </p>

                    {(status === 'NONE' || status === 'FAILED' || status === 'PORT_OCCUPIED') && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Развернуть на порту</label>
                            <input
                                type="number"
                                placeholder="Автоматически (оставьте пустым)"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm text-white"
                            />
                        </div>
                    )}

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-zinc-300">Статус</span>
                            {status === 'NONE' && <span className="text-sm text-zinc-500 font-medium">Не развёрнуто</span>}
                            {status === 'DEPLOYING' && (
                                <span className="flex items-center gap-2 text-sm text-indigo-400 font-medium">
                                    <Loader2 size={14} className="animate-spin" /> Развёртывание...
                                </span>
                            )}
                            {status === 'STOPPING' && (
                                <span className="flex items-center gap-2 text-sm text-amber-400 font-medium">
                                    <Loader2 size={14} className="animate-spin" /> Остановка...
                                </span>
                            )}
                            {status === 'RUNNING' && (
                                <span className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                                    <PlayCircle size={14} /> Запущено
                                </span>
                            )}
                            {status === 'FAILED' && (
                                <span className="flex items-center gap-2 text-sm text-red-400 font-medium">
                                    <AlertCircle size={14} /> Ошибка
                                </span>
                            )}
                        </div>

                        {status === 'RUNNING' && liveUrl && (
                            <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
                                <span className="text-xs text-emerald-500 font-semibold uppercase tracking-wider block mb-1">Live URL</span>
                                <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-emerald-200 text-sm font-medium flex items-center gap-2 break-all">
                                    <LinkIcon size={14} />
                                    {liveUrl}
                                    <ExternalLink size={12} className="ml-auto opacity-50" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-800/60 bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                        Закрыть
                    </button>

                    {(status === 'NONE' || status === 'FAILED' || status === 'PORT_OCCUPIED') && (
                        <button
                            onClick={handleDeploy}
                            disabled={isTriggering}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlayCircle size={16} />
                            Развернуть
                        </button>
                    )}

                    {status === 'RUNNING' && (
                        <button
                            onClick={handleStop}
                            disabled={isTriggering}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-red-200 bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Остановить
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
