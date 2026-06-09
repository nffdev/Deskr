import { useNavigate } from "react-router-dom";
import { Monitor, ArrowLeft } from "lucide-react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden flex flex-col">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.08] blur-[120px]" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-purple-500/[0.05] blur-[120px]" />
            </div>
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px'
            }} />

            <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-6xl w-full mx-auto">
                <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Deskr</span>
                </button>
            </nav>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
                <h1 className="text-[6rem] sm:text-[9rem] font-extrabold leading-none tracking-tighter bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent">
                    404
                </h1>

                <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-md">
                    This page doesn't exist, or the connection has dropped.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium hover:brightness-110 transition shadow-lg shadow-purple-500/20"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.04] transition"
                    >
                        Go back
                    </button>
                </div>
            </main>

            <footer className="relative z-10 py-6 text-center text-xs text-gray-600">
                Deskr · error 404
            </footer>
        </div>
    );
}
