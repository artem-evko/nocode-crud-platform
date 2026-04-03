import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Blocks, Zap, Database, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="border-b border-zinc-800/50 backdrop-blur-xl bg-[#0a0a0a]/80 fixed top-0 w-full z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <Blocks className="text-indigo-500" />
                        <span>NoCode<span className="text-zinc-500">Platform</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Войти
                        </button>
                        <button 
                            onClick={() => navigate('/register')}
                            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors shadow-lg"
                        >
                            Регистрация
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-24 px-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="max-w-5xl mx-auto text-center relative z-10 pt-20 pb-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-tight">
                        Создавайте Enterprise приложения <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            Без Написания Кода.
                        </span>
                    </h1>
                    <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Спроектируйте модель данных, настройте визуальную бизнес-логику и интерфейс. Платформа самостоятельно сгенерирует Spring Boot и React код, упакует в Docker и развернёт его для вас.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => navigate('/register')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                        >
                            Начать разработку <ArrowRight size={20} />
                        </button>
                        <button 
                            onClick={() => window.scrollTo({ top: document.getElementById('features')?.offsetTop, behavior: 'smooth' })}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors"
                        >
                            Узнать больше
                        </button>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 border-t border-zinc-800/50 bg-black/40">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Архитектура Нового Поколения</h2>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Мы не просто визуализируем данные, мы генерируем настоящий масштабируемый исходный код.</p>
                </div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={<Database className="text-emerald-400" size={32} />}
                        title="Моделирование Данных"
                        description="Визуально проектируйте схемы БД. Мы автоматически генерируем JPA сущности, репозитории, миграции Liquibase и поднимаем изолированный PostgreSQL."
                    />
                    <FeatureCard 
                        icon={<Cpu className="text-rose-400" size={32} />}
                        title="Динамический UI & Логика"
                        description="Собирайте интерфейс из готовых React-компонентов. Связывайте кнопки с визуальными цепочками действий (Action Flows) без строчки кода."
                    />
                    <FeatureCard 
                        icon={<ShieldCheck className="text-violet-400" size={32} />}
                        title="Изолированный Деплой"
                        description="Платформа использует Traefik Reverse Proxy и Docker-in-Docker для безопасного развертывания каждого сгенерированного проекта на уникальном локальном поддомене."
                    />
                </div>
            </section>

            {/* How it Works Section */}
            <section className="py-24 px-6 bg-indigo-950/10 border-t border-zinc-800/50 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <Zap className="text-cyan-400 mb-6" size={48} />
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-16 text-center">Как это работает?</h2>
                    
                    <div className="flex flex-col md:flex-row gap-8 w-full">
                        <StepCard number="1" title="Настройте Схему" text="Добавьте таблицы, колонки, укажите права доступа (RBAC) в визуальном конструкторе." />
                        <StepCard number="2" title="Соберите Интерфейс" text="Перетащите графики, таблицы и формы на холст. Настройте внешний вид через стили." />
                        <StepCard number="3" title="Создайте Логику" text="Соедините триггеры с действиями (Обновление БД, HTTP запрос) визуальными связями." />
                        <StepCard number="4" title="Запуск в 1 Клик" text="Нажмите 'Развернуть' и платформа сгенерирует, скомпилирует и поднимет Docker-контейнеры." />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-zinc-500 border-t border-zinc-800/50">
                <p>&copy; 2026 No-Code Platform.</p>
            </footer>
        </div>
    );
}

function StepCard({ number, title, text }: { number: string, title: string, text: string }) {
    return (
        <div className="flex-1 bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="text-6xl font-black text-white/5 absolute -top-2 -right-2 group-hover:text-indigo-500/10 transition-colors">{number}</div>
            <h3 className="text-xl font-bold mb-3 mt-4">{title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{text}</p>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm hover:bg-zinc-900 transition-colors">
            <div className="w-14 h-14 bg-black rounded-xl border border-zinc-800 flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-zinc-400 leading-relaxed">{description}</p>
        </div>
    );
}
