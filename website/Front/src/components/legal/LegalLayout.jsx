import { Link } from "react-router-dom";
import { Monitor, ArrowLeft } from "lucide-react";

export default function LegalLayout({ title, updatedAt, children }) {
    return (
        <div className="relative min-h-screen bg-gray-950 text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.05] blur-[120px]" />
            </div>

            <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-3xl mx-auto">
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Deskr</span>
                </Link>
                <Link to="/" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
            </nav>

            <main className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 pb-20">
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
                    {updatedAt && (
                        <p className="text-xs text-gray-400 mt-2">Last updated: {updatedAt}</p>
                    )}
                </header>

                <article className="prose prose-invert max-w-none text-sm sm:text-base text-gray-300 leading-relaxed space-y-6">
                    {children}
                </article>

                <footer className="mt-12 pt-6 border-t border-white/[0.06] flex gap-4 text-xs text-gray-400">
                    <Link to="/legal/notice" className="hover:text-white">Legal Notice</Link>
                    <Link to="/legal/terms" className="hover:text-white">Terms</Link>
                    <Link to="/legal/privacy" className="hover:text-white">Privacy</Link>
                </footer>
            </main>
        </div>
    );
}
