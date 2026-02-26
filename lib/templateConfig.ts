export type TemplateElementKey = "spotRate" | "commodities";

export interface TemplateElementToggle {
  key: TemplateElementKey;
  enabled: boolean;
}

export interface TemplateConfig {
  templateId: string;

  // Style
  backgroundColor: string;
  textColor: string;
  fontFamily: string;

  // Assets
  logoUrl?: string;
  backgroundImageUrl?: string;

  // Element toggles
  elements: TemplateElementToggle[];

  // Layout positions/sizes (Fabric JSON)
  canvasState?: any;
}

export const defaultTemplateConfig = (templateId: string): TemplateConfig => ({
  templateId,
  backgroundColor: "#0b1120",
  textColor: "#ffffff",
  fontFamily: "Inter",
  logoUrl: undefined,
  backgroundImageUrl: undefined,
  elements: [
    { key: "spotRate", enabled: true },
    { key: "commodities", enabled: true },
  ],
  canvasState: undefined,
});

