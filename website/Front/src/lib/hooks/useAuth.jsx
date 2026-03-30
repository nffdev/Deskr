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
	const [isLoading, setIsLoading] = useState(false);
	const { user, updateUser } = useAuth();
	const location = useLocation();

	const auth = localStorage.getItem('token');

	useEffect(() => {
		if (!location.pathname.startsWith('/dash/dashboard') || !auth || (user && user.id)) return;
		setIsLoading(true);

		async function getUser() {
			const data = await fetch(`${BASE_API}/v${API_VERSION}/users/@me`, { method: 'GET', headers: { 'Authorization': `Bearer ${auth}` } }).then(response => response.json()).catch(() => null);

			if (data?.id) {
				updateUser(data);
			}
			setIsLoading(false);
		}

		getUser();
	}, [location.pathname]);

	if (location.pathname.startsWith('/auth/') && auth) return <Navigate to="/dash/dashboard" replace />;

	if (!location.pathname.startsWith('/dash/dashboard')) return <>{children}</>;
	if (user && user.id) return <>{children}</>;
	if (!auth) return <Login />;

	return isLoading ? <FullPageLoader /> : user ? <>{children}</> : <Login />;
}

function Layout({ children }) {
	return <>
		{/* <Header /> */}
        <div className="flex">
			{/* <Sidebar /> */}
			<div className="flex items-center justify-between w-full h-full">
				{children}
			</div>
		</div>
	</>
}