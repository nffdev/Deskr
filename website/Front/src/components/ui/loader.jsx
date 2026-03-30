import { Loader2 } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-800">
      <Loader2 className="h-10 w-10 animate-spin text-white" />
    </div>
  );
}
