import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-slate-50 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="text-center relative z-10 px-6">
                <h1 className="text-[120px] md:text-[180px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-400 to-zinc-800 select-none">
                    404
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 -mt-4">
                    Страница не найдена
                </h2>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                    Запрашиваемая страница не существует или была перемещена.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-sm font-semibold transition-colors border border-zinc-800 hover:border-zinc-700"
                    >
                        <ArrowLeft size={16} />
                        Назад
                    </button>
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Home size={16} />
                        К проектам
                    </button>
                </div>
            </div>
        </div>
    );
}
