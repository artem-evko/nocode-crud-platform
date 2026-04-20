import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ProjectSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ProjectSettings;
    onSave: (settings: ProjectSettings) => void;
}

export interface ProjectSettings {
    authEnabled: boolean;
    generateFrontend: boolean;
}

export default function ProjectSettingsModal({ isOpen, onClose, settings, onSave }: ProjectSettingsProps) {
    const [localSettings, setLocalSettings] = useState<ProjectSettings>(settings);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-zinc-800/60">
                    <h2 className="text-xl font-bold tracking-tight">Настройки проекта</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={localSettings.authEnabled}
                                onChange={(e) => setLocalSettings({ ...localSettings, authEnabled: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-white dark:focus:ring-offset-zinc-950 bg-white dark:bg-zinc-900"
                            />
                            <div>
                                <div className="text-sm font-medium">Включить Авторизацию (JWT)</div>
                                <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Генерирует Spring Security, утилиты JWT и AuthController для безопасного доступа к API.</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={localSettings.generateFrontend}
                                onChange={(e) => setLocalSettings({ ...localSettings, generateFrontend: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-white dark:focus:ring-offset-zinc-950 bg-white dark:bg-zinc-900"
                            />
                            <div>
                                <div className="text-sm font-medium">Сгенерировать Фронтенд (React + Vite)</div>
                                <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Автоматически генерирует полноценный дашборд администратора на React вместе с Backend API.</div>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-200 dark:border-zinc-800/60">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 rounded-lg transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-colors"
                        >
                            Сохранить настройки
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
