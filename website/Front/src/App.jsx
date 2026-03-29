import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthWrapper } from "@/lib/hooks/useAuth";
import { UserContextProvider } from "@/lib/contexts/userContext";
import useRouter from "@/lib/hooks/useRouter";

export default function App() {
  const routes = useRouter();

  return (
    <BrowserRouter>
      <UserContextProvider>
        <AuthWrapper>
          <Routes>
            {routes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            <Route path="*" element={<h1>404: Not found</h1>} />
          </Routes>
        </AuthWrapper>
      </UserContextProvider>
    </BrowserRouter>
  );
}