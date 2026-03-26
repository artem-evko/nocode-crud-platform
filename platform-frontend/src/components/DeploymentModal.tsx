import { useEffect, useState } from 'react';
import { X, PlayCircle, Loader2, Link as LinkIcon, AlertCircle, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client';

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export default function DeploymentModal({ isOpen, onClose, projectId }: DeploymentModalProps) {
    const [status, setStatus] = useState<string>('NONE'); // NONE, DEPLOYING, RUNNING, FAILED, STOPPING
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const [isTriggering, setIsTriggering] = useState(false);

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
            setIsTriggering(true);
            await apiClient.post(`/projects/${projectId}/deploy`);
            setStatus('DEPLOYING');
        } catch (error) {
            console.error("Deploy trigger failed", error);
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

                <div className="p-6 space-y-6">
                    <p className="text-zinc-400 text-sm">
                        Разверните ваше приложение в облаке в один клик. Платформа автоматически настроит инфраструктуру, соберёт docker-контейнеры и опубликует ваше приложение.
                    </p>

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

                    {(status === 'NONE' || status === 'FAILED') && (
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
