import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Blocks, Zap, Database, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans">
            {/* Navigation */}
            <nav className="border-b border-zinc-800/50 backdrop-blur-xl bg-black/50 fixed top-0 w-full z-50">
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
                            Log in
                        </button>
                        <button 
                            onClick={() => navigate('/register')}
                            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
                        >
                            Sign up
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="max-w-4xl mx-auto text-center relative z-10 pt-20 pb-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-tight">
                        Build Microservices <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            Without Writing Code.
                        </span>
                    </h1>
                    <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Design your data models, orchestrate UI components, and deploy full-stack Spring Boot & React applications dynamically inside isolated Docker containers.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => navigate('/register')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                        >
                            Start Building Now <ArrowRight size={20} />
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors"
                        >
                            View Docs
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={<Database className="text-emerald-400" size={32} />}
                        title="Relational Data Modeling"
                        description="Visually construct your database schemas. We handle the JPA entities, Liquibase migrations, and PostgreSQL provisioning."
                    />
                    <FeatureCard 
                        icon={<ShieldCheck className="text-violet-400" size={32} />}
                        title="Docker-in-Docker Deploy"
                        description="Press a button and watch your app spin up in its own secure, isolated NGINX + Spring Boot container architecture."
                    />
                    <FeatureCard 
                        icon={<Cpu className="text-rose-400" size={32} />}
                        title="Dynamic UI Builder"
                        description="Drag and drop React components. Connect them to your backend data seamlessly with integrated Tailwind styling."
                    />
                </div>
            </main>
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
