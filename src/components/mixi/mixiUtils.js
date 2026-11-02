// Clave para guardar en el navegador
const MIXI_STORAGE_KEY = 'mixhost_user_mixi';

// Configuración por defecto si el usuario nunca ha creado uno
export const DEFAULT_MIXI = {
  bodyColor: '#8B5CF6',
  spotsColor: '#F472B6',
  eyeColor: '#38BDF8',
  hat: 'none',
  headphones: false,
  glasses: false
};

// Cargar la configuración guardada
export const getSavedMixi = () => {
  try {
    const saved = localStorage.getItem(MIXI_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_MIXI;
  } catch (error) {
    console.error('Error al cargar Mixi de localStorage:', error);
    return DEFAULT_MIXI;
  }
};

// Guardar la nueva configuración
export const saveMixi = (config) => {
  try {
    localStorage.setItem(MIXI_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error al guardar Mixi en localStorage:', error);
  }
};