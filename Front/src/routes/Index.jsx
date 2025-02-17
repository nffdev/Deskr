import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-12 items-center justify-center">
            <h1 className="text-5xl font-extrabold">Template React</h1>
            <Button onClick={() => navigate('/auth/register')}><span className="mt-1">Start</span></Button>
        </div>
    )
}