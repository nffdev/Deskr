import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BASE_API, API_VERSION } from "../../config.json";

export default function Login() {
    const [datas, setDatas] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function login() {
        if (!datas.email) return setError('Email is required.');
        if (!datas.password) return setError('Password is required.');

        setLoading(true);
        setError('');
        fetch(`${BASE_API}/v${API_VERSION}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datas)
        })
            .then(response => response.json())
            .then(json => {
                if (json.token) {
                    localStorage.setItem('token', json.token);
                    window.location.replace('/dash/dashboard');
                } else {
                    setError(json.message || 'An error occured.');
                }
            })
            .catch(() => setError('An error occured.'))
            .finally(() => setLoading(false));
    }

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen px-4 sm:px-6 py-8 bg-gray-800 text-white">
            <div className="flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md">
                <h1 className="text-center text-2xl sm:text-4xl font-extrabold">Se connecter</h1>
                {error ? <p className="text-red-500 mt-6 sm:mt-10 text-sm sm:text-base text-center">{error}</p> : null}
                <label htmlFor="email" className={`relative w-full ${error ? 'mt-2' : 'mt-8 sm:mt-12'}`}>
                    <Input
                        className="text-black w-full"
                        onChange={(e) => setDatas(prev => ({ ...prev, email: e.target.value }))}
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Email"
                    />
                </label>
                <label htmlFor="password" className="relative w-full mt-3 sm:mt-4">
                    <Input
                        className="text-black w-full"
                        onChange={(e) => setDatas(prev => ({ ...prev, password: e.target.value }))}
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Mot de passe"
                    />
                </label>
                <Button
                    className="w-full mt-6 sm:mt-10 py-5 sm:py-6 text-base"
                    onClick={() => login()}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Se connecter'}
                </Button>
            </div>
            <div className="mt-6 sm:mt-8">
                <Link to="/auth/register" className="text-sm sm:text-base text-muted-foreground font-light">
                    Je n'ai pas encore de compte
                </Link>
            </div>
        </div>
    )
}
