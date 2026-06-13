import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Monitor, Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BASE_API, API_VERSION } from "../../config.json";

export default function Register() {
    const [datas, setDatas] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(null);

    async function register() {
        if (!datas.username) return setError('Username is required.');
        if (!datas.email) return setError('Email is required.');
        if (!datas.password) return setError('Password is required.');
        if (!datas.confirmPassword) return setError('Please confirm your password.');
        if (datas.password !== datas.confirmPassword) return setError('Passwords are not matching.');
        if (!acceptedTerms) return setError('You must accept the Terms and Privacy Policy.');

        setLoading(true);
        setError('');
        fetch(`${BASE_API}/v${API_VERSION}/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datas)
        })
            .then(response => response.json().then(json => ({ ok: response.ok, json })))
            .then(({ ok, json }) => {
                if (ok && json.success) {
                    window.location.replace('/dash/dashboard');
                } else {
                    setError(json.message || 'An error occured.');
                }
            })
            .catch(() => setError('An error occured.'))
            .finally(() => setLoading(false));
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') register();
    }

    const fields = [
        { key: 'username', label: 'Username', type: 'text', placeholder: 'johndoe', icon: User },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', icon: Mail },
        { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••', icon: Lock },
        { key: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: '••••••••', icon: Lock },
    ];

    return (
        <div className="relative flex items-center justify-center w-full min-h-screen overflow-hidden bg-gray-950">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.07] blur-[120px]" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-purple-500/[0.05] blur-[120px]" />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-600/[0.04] blur-[80px]" />
            </div>

            <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px'
            }} />

            <Link
                to="/"
                className="absolute top-5 left-5 sm:top-6 sm:left-6 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </Link>

            <div className="relative z-10 w-full max-w-[420px] mx-4 sm:mx-6 my-8">
                <div className="flex flex-col items-center mb-8 sm:mb-10">
                    <div className="relative mb-5">
                        <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl scale-150" />
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <Monitor className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Create your account
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1.5">
                        Get started with Deskr
                    </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black/20">
                    {error && (
                        <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3.5 sm:space-y-4">
                        {fields.map(({ key, label, type, placeholder, icon: Icon }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">{label}</label>
                                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                                    focused === key
                                        ? 'border-purple-500/50 bg-gray-800/80 shadow-[0_0_0_3px_rgba(139,92,246,0.1)]'
                                        : 'border-white/[0.08] bg-gray-800/50 hover:border-white/[0.12]'
                                }`}>
                                    <Icon className={`w-4 h-4 ml-3.5 shrink-0 transition-colors ${focused === key ? 'text-purple-400' : 'text-gray-500'}`} />
                                    <input
                                        type={type}
                                        value={datas[key]}
                                        onChange={(e) => setDatas(prev => ({ ...prev, [key]: e.target.value }))}
                                        onFocus={() => setFocused(key)}
                                        onBlur={() => setFocused(null)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={placeholder}
                                        className="w-full bg-transparent text-sm text-white placeholder:text-gray-600 px-3 py-3 outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex items-start gap-2.5">
                        <Checkbox
                            id="accept-terms"
                            checked={acceptedTerms}
                            onCheckedChange={(v) => setAcceptedTerms(v === true)}
                            className="mt-0.5 border-white/[0.15] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <label htmlFor="accept-terms" className="text-xs text-gray-400 leading-relaxed cursor-pointer select-none">
                            I have read and agree to the{' '}
                            <Link to="/legal/terms" target="_blank" className="text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline">Terms</Link>
                            {' '}and the{' '}
                            <Link to="/legal/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline">Privacy Policy</Link>.
                        </label>
                    </div>

                    <button
                        onClick={register}
                        disabled={loading || !acceptedTerms}
                        className="group w-full mt-5 relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </>
                            )}
                        </span>
                    </button>
                </div>

                <p className="text-center mt-6 sm:mt-8 text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/auth/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
