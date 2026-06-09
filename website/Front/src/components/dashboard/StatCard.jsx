export default function StatCard({ label, value, icon: Icon, accent = 'text-purple-400', isText = false, pulse = false }) {
  return (
    <div className="relative p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
        <div className="relative">
          <Icon className={`w-4 h-4 ${accent}`} />
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>
      </div>
      <div className={`font-semibold text-white ${isText ? 'text-sm sm:text-base' : 'text-xl sm:text-2xl'}`}>
        {value}
      </div>
    </div>
  );
}
