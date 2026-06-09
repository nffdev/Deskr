import { useEffect, useState, useContext } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { UserContext } from "@/lib/contexts/userContext";
import { FullPageLoader } from "@/components/ui/loader";
import { BASE_API, API_VERSION } from "../../config.json";
import Login from "../../routes/auth/Login";

export function useAuth() {
	return useContext(UserContext);
}

export function AuthWrapper({ children }) {
	const [checked, setChecked] = useState(false);
	const { user, updateUser } = useAuth();
	const location = useLocation();

	useEffect(() => {
		let cancelled = false;
		async function probe() {
			try {
				const res = await fetch(`${BASE_API}/v${API_VERSION}/users/@me`, {
					method: 'GET',
					credentials: 'include'
				});
				if (!cancelled && res.ok) {
					const data = await res.json();
					if (data?.id) updateUser(data);
				}
			} catch {}
			if (!cancelled) setChecked(true);
		}
		probe();
		return () => { cancelled = true; };
	}, []);

	if (!checked) return <FullPageLoader />;

	const isAuthed = !!(user && user.id);

	if (location.pathname.startsWith('/auth/') && isAuthed) {
		return <Navigate to="/dash/dashboard" replace />;
	}

	if (!location.pathname.startsWith('/dash/dashboard')) return <>{children}</>;

	if (isAuthed) return <>{children}</>;
	return <Login />;
}
