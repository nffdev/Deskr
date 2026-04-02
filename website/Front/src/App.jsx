import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthWrapper } from "@/lib/hooks/useAuth";
import { UserContextProvider } from "@/lib/contexts/userContext";
import useRouter from "@/lib/hooks/useRouter";
import NotFound from "@/routes/NotFound";
import { Toaster } from "@/components/ui/sonner";

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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthWrapper>
      </UserContextProvider>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}