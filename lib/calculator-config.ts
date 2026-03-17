/** Event dispatched when Finance → Business costs are saved so calculators refetch config. */
export const CALCULATOR_CONFIG_INVALIDATE_EVENT = "calculator-config-invalidated";

export interface CalculatorConfigFilament {
  id: string;
  material: string;
  colour?: string;
  costPerKg: number;
  name: string;
}

export interface CalculatorConfig {
  labourRate: number;
  profitMargin: number;
  vatPercent: number;
  monthlyOverhead: number;
  monthlyCapacityHrs: number;
  filaments: CalculatorConfigFilament[];
  /** Fee per unit when "Post-processing / support removal" is selected (3D calculator). */
  postProcessingFeePerUnit?: number;
}
