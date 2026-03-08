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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-zinc-800/60">
                    <h2 className="text-xl font-bold text-white tracking-tight">Project Settings</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 cursor-pointer hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={localSettings.authEnabled}
                                onChange={(e) => setLocalSettings({ ...localSettings, authEnabled: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-950 bg-zinc-900"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-50">Enable Authentication (JWT)</div>
                                <div className="text-xs text-zinc-400 mt-1">Generates Spring Security, JWT utilities, and an AuthController for secure API access.</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 cursor-pointer hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={localSettings.generateFrontend}
                                onChange={(e) => setLocalSettings({ ...localSettings, generateFrontend: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-950 bg-zinc-900"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-50">Generate Frontend (React + Vite)</div>
                                <div className="text-xs text-zinc-400 mt-1">Automatically generates a full React admin dashboard alongside the backend API.</div>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-zinc-800/60">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-transparent hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 transition-colors"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
