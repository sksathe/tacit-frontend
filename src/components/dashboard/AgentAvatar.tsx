import type { TacitAgent } from "@/data/agents";
import { useState } from "react";

interface AgentAvatarProps {
  agent: TacitAgent;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AgentAvatar({ agent, size = "md" }: AgentAvatarProps) {
  const [failed, setFailed] = useState(false);

  const sizeClasses =
    size === "sm"
      ? "w-8 h-8"
      : size === "xl"
      ? "w-20 h-20"
      : size === "lg"
      ? "w-14 h-14"
      : "w-10 h-10";

  const iconClasses = size === "xl" ? "text-3xl" : "text-xl";

  const showImage = agent.image && !failed;

  return (
    <div className={`${sizeClasses} rounded-full bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden`}>
      {showImage ? (
        <img
          src={agent.image}
          alt={agent.name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={iconClasses} aria-hidden>
          {agent.icon}
        </span>
      )}
    </div>
  );
}

