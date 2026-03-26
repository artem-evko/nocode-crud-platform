import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface ProjectFormData {
    id?: string;
    name: string;
    groupId: string;
    artifactId: string;
    version: string;
    basePackage: string;
    specText?: string;
    authEnabled?: boolean;
    generateFrontend?: boolean;
}

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ProjectFormData) => Promise<void>;
    initialData?: ProjectFormData | null;
}

const defaultData: ProjectFormData = {
    name: '',
    groupId: 'com.example',
    artifactId: 'demo',
    version: '1.0.0',
    basePackage: 'com.example.demo',
    specText: '{}'
};

export default function ProjectModal({ isOpen, onClose, onSave, initialData }: ProjectModalProps) {
    const [formData, setFormData] = useState<ProjectFormData>(defaultData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isBasePackagePristine, setIsBasePackagePristine] = useState(true);

    useEffect(() => {
        if (isBasePackagePristine && formData.groupId && formData.artifactId) {
            const sanitizedArtifactId = formData.artifactId.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            const generatedPackage = `${formData.groupId}.${sanitizedArtifactId}`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
            if (generatedPackage && formData.basePackage !== generatedPackage) {
                setFormData(prev => ({ ...prev, basePackage: generatedPackage }));
            }
        }
    }, [formData.groupId, formData.artifactId, isBasePackagePristine]);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || defaultData);
            setError('');
            setIsBasePackagePristine(!initialData);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onSave(formData);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Не удалось сохранить проект. Пожалуйста, проверьте введенные данные.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-zinc-800/60">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {initialData ? 'Редактировать проект' : 'Новый проект'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Название проекта</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                                placeholder="My Awesome API"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Group ID</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.groupId}
                                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Artifact ID</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.artifactId}
                                    onChange={(e) => setFormData({ ...formData, artifactId: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 cursor-pointer hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.authEnabled || false}
                                onChange={(e) => setFormData({ ...formData, authEnabled: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-950 bg-zinc-900"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-50">Включить Авторизацию (JWT)</div>
                                <div className="text-xs text-zinc-400 mt-1">Автоматически генерирует безопасную систему входа и защищает ваш REST API.</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 cursor-pointer hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.generateFrontend || false}
                                onChange={(e) => setFormData({ ...formData, generateFrontend: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-950 bg-zinc-900"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-50">Сгенерировать Фронтенд (React + Vite)</div>
                                <div className="text-xs text-zinc-400 mt-1">Создает готовый к использованию дашборд администратора, подключенный к вашему API.</div>
                            </div>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Базовый пакет</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.basePackage}
                                    onChange={(e) => {
                                        setFormData({ ...formData, basePackage: e.target.value });
                                        setIsBasePackagePristine(false);
                                    }}
                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Версия</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.version}
                                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-zinc-800/60">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-transparent hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-lg transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                        >
                            {loading ? (
                                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                            ) : null}
                            {initialData ? 'Сохранить изменения' : 'Создать проект'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
