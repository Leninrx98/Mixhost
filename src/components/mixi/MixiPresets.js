export const MIXI_PRESETS = [
  // MIXI (Pulpo Morado)
  { id: "mixi_classic", character: "mixi", name: "Mixi Clásico", skin: "Classic", image: "/avatars/mixi/classic.png" },
  { id: "mixi_shiny", character: "mixi", name: "Mixi Shiny", skin: "Shiny Gold", image: "/avatars/mixi/shiny.png" },
  { id: "mixi_cyber", character: "mixi", name: "Mixi Cyber", skin: "Cyber Neon", image: "/avatars/mixi/cyber.png" },
  { id: "mixi_fire", character: "mixi", name: "Mixi Fuego", skin: "Inferno", image: "/avatars/mixi/fire.png" },

  // GLO (Pulpo Azul 3D)
  { id: "glo_classic", character: "glo", name: "Glo Clásico", skin: "Classic 3D", image: "/avatars/glo/classic.png" },
  { id: "glo_shiny", character: "glo", name: "Glo Shiny", skin: "Golden Star", image: "/avatars/glo/shiny.png" },
  { id: "glo_cyber", character: "glo", name: "Glo Cyber", skin: "Cyan Void", image: "/avatars/glo/cyber.png" },
  { id: "glo_fire", character: "glo", name: "Glo Radiactivo", skin: "Toxic Green", image: "/avatars/glo/fire.png" },

  // ROXY (Pulpo Rosa Lazo)
  { id: "roxy_classic", character: "roxy", name: "Roxy Clásica", skin: "Classic Pink", image: "/avatars/roxy/classic.png" },
  { id: "roxy_shiny", character: "roxy", name: "Roxy Shiny", skin: "Crown Princess", image: "/avatars/roxy/shiny.png" },
  { id: "roxy_cyber", character: "roxy", name: "Roxy Menta", skin: "Fresh Mint", image: "/avatars/roxy/cyber.png" },
  { id: "roxy_fire", character: "roxy", name: "Roxy Atardecer", skin: "Sunset Flame", image: "/avatars/roxy/fire.png" }
];

export const getPresetById = (id) => {
  return MIXI_PRESETS.find((p) => p.id === id) || MIXI_PRESETS[0];
};
