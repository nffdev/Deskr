import { useNavigate } from "react-router-dom";
import { Monitor, ArrowRight, Shield, Zap, Eye } from "lucide-react";

export default function Home() {
    const navigate = useNavigate();

    const features = [
        { icon: Eye, title: "Real-time Viewing", desc: "Stream remote screens with low latency" },
        { icon: Monitor, title: "Multi-Monitor", desc: "Switch between multiple displays seamlessly" },
        { icon: Zap, title: "Fast Builds", desc: "Build C# and C++ clients in seconds" },
        { icon: Shield, title: "Secure", desc: "JWT authentication & encrypted connections" },
    ];

    return (
        <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.07] blur-[120px]" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-purple-500/[0.05] blur-[120px]" />
                <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-600/[0.04] blur-[100px]" />
            </div>
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px'
            }} />

            <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl mx-auto">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Monitor className="w-4.5 h-4.5 text-purple-400" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Deskr</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Sign in
                    </button>
                    <button
                        onClick={() => navigate('/auth/register')}
                        className="px-4 py-2 text-sm font-medium bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/20 hover:bg-purple-600/30 transition-colors"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            <main className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10">
                <section className="flex flex-col items-center text-center pt-20 sm:pt-32 pb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-purple-300">Now in Beta</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        Remote Desktop
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                            Made Simple
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
                        Monitor and control your devices from anywhere. Build custom clients, view screens in real-time, and manage connections effortlessly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={() => navigate('/auth/register')}
                            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                        >
                            Start for Free
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate('/auth/login')}
                            className="w-full sm:w-auto px-8 py-3.5 text-sm font-medium rounded-xl border border-white/[0.08] bg-gray-900/50 text-gray-300 hover:border-white/[0.12] hover:text-white transition-all"
                        >
                            Sign in
                        </button>
                    </div>
                </section>

                <section className="py-10 sm:py-16">
                    <div className="bg-gray-900/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-1 shadow-2xl shadow-purple-500/5">
                        <div className="bg-gray-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
                            <div className="absolute top-3 right-3 flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                            </div>
                            <div className="relative flex flex-col items-center gap-4">
                                <Monitor className="w-16 h-16 text-purple-400/30" />
                                <p className="text-sm text-gray-600">Live remote session preview</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16 sm:py-24">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need</h2>
                        <p className="text-sm sm:text-base text-gray-500">Built for developers who need remote access done right.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/20 transition-all group">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                                    <Icon className="w-5 h-5 text-purple-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-16 sm:py-24">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/[0.05] to-violet-600/[0.05]" />
                        <div className="relative">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to get started?</h2>
                            <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-md mx-auto">Create your account and start managing your remote devices in minutes.</p>
                            <button
                                onClick={() => navigate('/auth/register')}
                                className="px-8 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:brightness-110 transition-all inline-flex items-center gap-2"
                            >
                                Create Account
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 border-t border-white/[0.06] py-8 mt-8">
                <div className="max-w-6xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Deskr</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                        <a href="/legal/notice" className="hover:text-gray-300">Legal Notice</a>
                        <a href="/legal/terms" className="hover:text-gray-300">Terms</a>
                        <a href="/legal/privacy" className="hover:text-gray-300">Privacy</a>
                    </div>
                    <p className="text-xs text-gray-600">Built with purpose. Open source.</p>
                </div>
            </footer>
        </div>
    );
}
