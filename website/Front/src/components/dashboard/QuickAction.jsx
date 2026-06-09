export default function QuickAction({ icon: Icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl text-left hover:border-purple-500/30 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
          <Icon className="w-4 h-4 text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-[11px] text-gray-500 truncate">{desc}</p>
        </div>
      </div>
    </button>
  );
}
