import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6 items-center justify-center w-full h-screen px-6 bg-gray-800 text-white">
            <h1 className="text-6xl sm:text-8xl font-extrabold">404</h1>
            <p className="text-lg sm:text-xl text-muted-foreground text-center">Cette page n'existe pas.</p>
            <Button className="w-full sm:w-auto px-8" onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
    );
}
