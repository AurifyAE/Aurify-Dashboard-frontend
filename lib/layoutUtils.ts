export const WIDGET_LABEL_MAP: Record<string, string> = {
  logo: 'Merchant Logo',
  commodityTable: 'Commodity Table',
  spotRates: 'Spot Rates',
  worldClock: 'World Clocks',
  systemClock: 'System Clock (Date)',
  footer: 'Footer (Powered by)',
};

export const getDefaultColumns = (themeId: string) => {
  if (themeId === 'theme2') {
    return {
      left: ['systemClock', 'commodityTable', 'worldClock'],
      right: ['logo', 'spotRates', 'footer'],
    };
  }
  if (themeId === 'theme3') {
    return {
      left: ['systemClock', 'worldClock', 'spotRates', 'footer'],
      right: ['logo', 'commodityTable'],
    };
  }
  // Theme 1 / Default
  return {
    left: ['logo', 'commodityTable'],
    right: ['systemClock', 'worldClock', 'spotRates', 'footer'],
  };
};
