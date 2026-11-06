import React from "react";
import { getPresetById } from "./MixiPresets";

export default function MixiAvatar({ config, size = 36, className = "" }) {
  // Si config es un string (id del preset) o un objeto con avatarId / image
  let imageSrc = "/avatars/mixi/classic.png";

  if (typeof config === "string") {
    imageSrc = getPresetById(config).image;
  } else if (config?.image) {
    imageSrc = config.image;
  } else if (config?.avatarId) {
    imageSrc = getPresetById(config.avatarId).image;
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full bg-slate-950 border border-purple-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm shadow-purple-500/20 ${className}`}
    >
      <img
        src={imageSrc}
        alt="Avatar"
        className="w-full h-full object-contain pointer-events-none p-0.5"
        onError={(e) => {
          e.target.src = "/avatars/mixi/classic.png";
        }}
      />
    </div>
  );
}
