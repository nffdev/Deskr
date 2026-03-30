import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6 items-center justify-center w-full h-screen bg-gray-800 text-white">
            <h1 className="text-8xl font-extrabold">404</h1>
            <p className="text-xl text-muted-foreground">Cette page n'existe pas.</p>
            <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
    );
}
