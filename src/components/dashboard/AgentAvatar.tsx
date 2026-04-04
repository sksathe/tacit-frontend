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
      ? "h-28 w-28 sm:h-32 sm:w-32"
      : size === "lg"
      ? "w-14 h-14"
      : "w-10 h-10";

  const iconClasses = size === "xl" ? "text-4xl" : "text-xl";

  const showImage = agent.image && !failed;

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center overflow-hidden rounded-full border border-border bg-muted/50`}
    >
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

