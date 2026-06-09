import { useNavigate } from 'react-router-dom';
import { Monitor, Radio, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/utils';

export default function ClientCard({ connection }) {
  const navigate = useNavigate();
  const online = connection.isActive;

  return (
    <div className="p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl flex items-center gap-3 sm:gap-4 hover:border-white/[0.12] transition-colors">
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gray-800/50 rounded-lg flex items-center justify-center shrink-0">
        <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-950 ${online ? 'bg-green-500' : 'bg-gray-600'}`}>
          {online && <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm sm:text-base text-white truncate">{connection.deviceInfo || 'Unknown device'}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
          <span className="truncate">{connection.ip}</span>
          <span className={online ? 'text-green-400' : 'text-gray-500'}>
            {online ? 'Online' : `Offline · ${timeAgo(connection.lastHeartbeat || connection.timestamp)}`}
          </span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          disabled={!online}
          onClick={() => navigate('/dash/remote')}
          className="h-9 w-9 text-gray-400 hover:bg-white/[0.04] hover:text-purple-300"
          title="Open remote"
        >
          <Radio className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!online}
          onClick={() => navigate('/dash/shell')}
          className="h-9 w-9 text-gray-400 hover:bg-white/[0.04] hover:text-purple-300"
          title="Open shell"
        >
          <Terminal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
