
import { calculatePrintCost, DEFAULT_PRINTER_SETTINGS } from './lib/3d-calculator-engine';

const mat = { name: 'PETG', code: 'PETG', costPerKgKes: 3500 };
const job = {
  name: 'Ripple Lamp Shade',
  material: 'PETG',
  weightGrams: 88.36,
  printTimeHours: 4.2,
  postProcessing: false,
  quantity: 1,
};

const settings = { ...DEFAULT_PRINTER_SETTINGS, profitMarginPercent: 20 };

const cost = calculatePrintCost(job, settings, [mat]);

console.log('Production Cost:', cost.totalProductionCost);
console.log('Selling Price (Inc VAT):', cost.sellingPriceIncVat);
console.log('Subtotal (Ex VAT):', cost.sellingPriceExVat);
console.log('VAT (16%):', cost.vatAmount);
