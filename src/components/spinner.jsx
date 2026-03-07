import { Sparkles } from "lucide-react";

export default function Spinner () {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0f] font-['DM_Sans']">
            <div className="relative w-24 h-24 flex items-center justify-center animate-in fade-in duration-500">
                <div className="absolute inset-0 rounded-full border-[3px] border-white/5 border-t-indigo-500 animate-[spin_1.5s_linear_infinite]"></div>
                <div className="absolute inset-3 rounded-full border-[3px] border-white/5 border-l-purple-500 border-b-purple-500 animate-[spin_2s_linear_infinite_reverse]"></div>
                <div className="absolute inset-6 rounded-full border-[3px] border-white/5 border-r-indigo-400 animate-[spin_1s_linear_infinite]"></div>
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                <Sparkles size={20} className="text-white relative z-10 animate-pulse" />
            </div>
        </div>
    );
}