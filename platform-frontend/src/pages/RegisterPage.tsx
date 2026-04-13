import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Blocks, EyeOff, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../api/client';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error("Пароли не совпадают");
            return;
        }
        
        if (formData.username.length < 3 || formData.password.length < 5) {
            toast.error("Имя пользователя (мин. 3 символа) и пароль (мин. 5 символов) обязательны");
            return;
        }

        setIsLoading(true);

        try {
            await apiClient.post('/auth/register', {
                username: formData.username,
                password: formData.password
            });
            
            toast.success("Аккаунт успешно создан!");
            navigate('/login');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Ошибка при регистрации');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="absolute top-6 left-6">
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 font-medium text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} /> На главную
                </button>
            </div>
            
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
                        <Blocks className="text-indigo-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Создать аккаунт</h1>
                    <p className="text-zinc-500">Присоединяйтесь к платформе NoCode</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-300">Имя пользователя</label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                                placeholder="developer123"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-300">Пароль</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-950 pl-2"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-300">Подтвердите пароль</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-[0_4px_14px_0_rgba(79,70,229,0.2)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.3)]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Создание аккаунта...
                                </>
                            ) : (
                                'Зарегистрироваться'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-zinc-500">
                        Уже есть аккаунт?{' '}
                        <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300 font-medium">
                            Войти
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
