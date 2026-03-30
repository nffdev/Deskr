import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Monitor, ArrowRight } from "lucide-react";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center w-full h-screen px-6 bg-gray-800 text-white">
            <div className="flex flex-col items-center gap-6 w-full max-w-md">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-600/20 rounded-2xl flex items-center justify-center">
                    <Monitor className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Deskr</h1>
                <p className="text-sm sm:text-base text-gray-400 text-center">Remote desktop management made simple.</p>
                <Button
                    className="w-full sm:w-auto px-8 py-6 text-base sm:text-lg mt-4"
                    onClick={() => navigate('/dash/dashboard')}
                >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
    )
}
