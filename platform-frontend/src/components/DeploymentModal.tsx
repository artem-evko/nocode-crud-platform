import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, PlayCircle, Loader2, Link as LinkIcon, AlertCircle, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client';
import { validateProject } from '../lib/projectValidator';
import type { ValidationMessage } from '../lib/projectValidator';
import { useUIBuilderStore } from '../store/uiBuilderStore';

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export default function DeploymentModal({ isOpen, onClose, projectId }: DeploymentModalProps) {
    const navigate = useNavigate();
    const [status, setStatus] = useState<string>('NONE'); // NONE, DEPLOYING, RUNNING, FAILED, STOPPING, PORT_OCCUPIED
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const [isTriggering, setIsTriggering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [port, setPort] = useState<string>('');

    // Validation State
    const [validationErrors, setValidationErrors] = useState<ValidationMessage[]>([]);
    const [validationWarnings, setValidationWarnings] = useState<ValidationMessage[]>([]);
    const [ignoreValidation, setIgnoreValidation] = useState<boolean>(false);
    const { selectComponent } = useUIBuilderStore();

    useEffect(() => {
        if (!isOpen || !projectId) return;
        
        // Initial fetch
        fetchStatus();
        setIgnoreValidation(false);

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
                
                // Validate if specText is available and status is NONE or FAILED
                if ((!proj.deploymentStatus || proj.deploymentStatus === 'NONE' || proj.deploymentStatus === 'FAILED' || proj.deploymentStatus === 'PORT_OCCUPIED') && proj.specText) {
                    const { errors, warnings } = validateProject(proj.specText);
                    setValidationErrors(errors);
                    setValidationWarnings(warnings);
                }
            }
        } catch (error) {
            console.error("Failed to fetch deployment status", error);
        }
    };

    const handleDeploy = async () => {
        try {
            setError(null);
            
            // If we have validation errors and user hasn't ignored them, block deploy
            if (validationErrors.length > 0 && !ignoreValidation) {
                setError("Пожалуйста, исправьте критические ошибки конфигурации перед развертыванием.");
                return;
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
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-800/60">
                    <h2 className="text-xl font-bold tracking-tight">Docker Развёртывание</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/40 rounded-lg p-3 text-sm text-red-500 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {status === 'PORT_OCCUPIED' && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/40 rounded-lg p-3 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2 animate-in fade-in">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>Этот порт уже занят другим приложением. Укажите вручную другой свободный порт или оставьте поле пустым для автоматического выбора.</span>
                        </div>
                    )}

                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                        Разверните ваше приложение в один клик. Платформа автоматически соберёт Docker-контейнеры и запустит приложение на указанном порту.
                    </p>

                    {/* No-Code Doctor Display */}
                    {(status === 'NONE' || status === 'FAILED' || status === 'PORT_OCCUPIED') && (validationErrors.length > 0 || validationWarnings.length > 0) && (
                        <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={16} className={validationErrors.length > 0 ? "text-red-400" : "text-amber-400"} />
                                <span className="text-sm font-semibold text-gray-600 dark:text-zinc-300">Доктор No-Code нашел проблемы:</span>
                            </div>
                            
                            {validationErrors.map((err, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-2 bg-red-50 dark:bg-red-950/20 border-l-2 border-red-500 rounded-r">
                                    <span className="text-xs text-red-600 dark:text-red-200">{err.message}</span>
                                    {err.id && err.type === 'component' && (
                                        <button 
                                            onClick={() => { navigate(`/projects/${projectId}/builder`); selectComponent(err.id!); onClose(); }}
                                            className="text-[10px] text-red-400 hover:text-red-300 text-left underline underline-offset-2"
                                        >
                                            Фокус на компонент
                                        </button>
                                    )}
                                    {err.type === 'entity' && (
                                        <button 
                                            onClick={() => { navigate(`/projects/${projectId}/modeler`); onClose(); }}
                                            className="text-[10px] text-red-400 hover:text-red-300 text-left underline underline-offset-2"
                                        >
                                            Перейти к Моделям данных
                                        </button>
                                    )}
                                </div>
                            ))}

                            {validationWarnings.map((warn, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-2 bg-amber-50 dark:bg-amber-950/20 border-l-2 border-amber-500 rounded-r">
                                    <span className="text-xs text-amber-600 dark:text-amber-200">{warn.message}</span>
                                    {warn.id && warn.type === 'component' && (
                                        <button 
                                            onClick={() => { navigate(`/projects/${projectId}/builder`); selectComponent(warn.id!); onClose(); }}
                                            className="text-[10px] text-amber-500 dark:text-amber-400 hover:text-amber-400 dark:hover:text-amber-300 text-left underline underline-offset-2"
                                        >
                                            Фокус на компонент
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            {validationErrors.length > 0 && (
                                <label className="flex items-center gap-2 mt-4 cursor-pointer p-2 rounded bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={ignoreValidation} 
                                        onChange={(e) => setIgnoreValidation(e.target.checked)}
                                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
                                    />
                                    <span className="text-xs text-gray-600 dark:text-zinc-300 font-medium">Я понимаю риски, игнорировать ошибки и продолжить</span>
                                </label>
                            )}
                        </div>
                    )}

                    {(status === 'NONE' || status === 'FAILED' || status === 'PORT_OCCUPIED') && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Развернуть на порту</label>
                            <input
                                type="number"
                                placeholder="Автоматически (оставьте пустым)"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                            />
                        </div>
                    )}

                    <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-600 dark:text-zinc-300">Статус</span>
                            {status === 'NONE' && <span className="text-sm text-gray-400 dark:text-zinc-500 font-medium">Не развёрнуто</span>}
                            {status === 'DEPLOYING' && (
                                <span className="flex items-center gap-2 text-sm text-indigo-500 dark:text-indigo-400 font-medium">
                                    <Loader2 size={14} className="animate-spin" /> Развёртывание...
                                </span>
                            )}
                            {status === 'STOPPING' && (
                                <span className="flex items-center gap-2 text-sm text-amber-500 dark:text-amber-400 font-medium">
                                    <Loader2 size={14} className="animate-spin" /> Остановка...
                                </span>
                            )}
                            {status === 'RUNNING' && (
                                <span className="flex items-center gap-2 text-sm text-emerald-500 dark:text-emerald-400 font-medium">
                                    <PlayCircle size={14} /> Запущено
                                </span>
                            )}
                            {status === 'FAILED' && (
                                <span className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 font-medium">
                                    <AlertCircle size={14} /> Ошибка
                                </span>
                            )}
                        </div>

                        {status === 'RUNNING' && liveUrl && (
                            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
                                <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-wider block mb-1">Live URL</span>
                                <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-300 hover:text-emerald-500 dark:hover:text-emerald-200 text-sm font-medium flex items-center gap-2 break-all">
                                    <LinkIcon size={14} />
                                    {liveUrl}
                                    <ExternalLink size={12} className="ml-auto opacity-50" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Закрыть
                    </button>

                    {(status === 'NONE' || status === 'FAILED' || status === 'PORT_OCCUPIED') && (
                        <button
                            onClick={handleDeploy}
                            disabled={isTriggering || (validationErrors.length > 0 && !ignoreValidation)}
                            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${validationErrors.length > 0 && !ignoreValidation ? 'bg-zinc-700' : (validationErrors.length > 0 ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500')}`}
                        >
                            <PlayCircle size={16} />
                            {validationErrors.length > 0 && ignoreValidation ? 'Всё равно развернуть' : 'Развернуть'}
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
