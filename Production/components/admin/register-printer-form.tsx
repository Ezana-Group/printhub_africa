"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRINTER_TYPES = [
  { value: "LARGE_FORMAT", label: "Large format" },
  { value: "FDM", label: "FDM (3D)" },
  { value: "RESIN", label: "Resin (3D)" },
  { value: "HYBRID", label: "Hybrid (3D)" },
];

const STEPS = ["Identity", "Specs", "Financial", "Schedule"];

export function RegisterPrinterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [printerType, setPrinterType] = useState<"LARGE_FORMAT" | "FDM" | "RESIN" | "HYBRID">("LARGE_FORMAT");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [maxPrintWidthM, setMaxPrintWidthM] = useState<number | "">("");
  const [buildVolumeX, setBuildVolumeX] = useState<number | "">("");
  const [buildVolumeY, setBuildVolumeY] = useState<number | "">("");
  const [buildVolumeZ, setBuildVolumeZ] = useState<number | "">("");
  const [powerWatts, setPowerWatts] = useState<number | "">(0);
  const [electricityRateKesKwh, setElectricityRateKesKwh] = useState<number | "">(24);
  const [productionSpeed, setProductionSpeed] = useState<number | "">("");
  const [highQualitySpeed, setHighQualitySpeed] = useState<number | "">("");
  const [setupTimeHours, setSetupTimeHours] = useState<number | "">(0.25);
  const [postProcessingTimeHours, setPostProcessingTimeHours] = useState<number | "">("");
  const [compatibleMaterials, setCompatibleMaterials] = useState("");

  const [purchasePriceKes, setPurchasePriceKes] = useState<number | "">("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [expectedLifespanHours, setExpectedLifespanHours] = useState<number | "">("");
  const [annualMaintenanceKes, setAnnualMaintenanceKes] = useState<number | "">(0);
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState("");
  const [hoursUsedTotal, setHoursUsedTotal] = useState<number | "">(0);

  const [nextScheduledMaintDate, setNextScheduledMaintDate] = useState("");
  const [maintenanceIntervalHours, setMaintenanceIntervalHours] = useState<number | "">("");

  const isLF = printerType === "LARGE_FORMAT";

  const validateStep0 = () => {
    if (!name.trim()) {
      setError("Printer name is required.");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep1 = () => {
    const power = Number(powerWatts);
    if (isNaN(power) || power < 0) {
      setError("Power (W) must be ≥ 0.");
      return false;
    }
    if (isLF && productionSpeed !== "" && Number(productionSpeed) <= 0) {
      setError("Production speed (sqm/hr) must be positive for large format.");
      return false;
    }
    if (!isLF && productionSpeed !== "" && Number(productionSpeed) <= 0) {
      setError("Production speed (cm³/hr) must be positive.");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    const price = Number(purchasePriceKes);
    if (price < 0 || isNaN(price)) {
      setError("Purchase price must be ≥ 0.");
      return false;
    }
    const lifespan = Number(expectedLifespanHours);
    if (lifespan <= 0 || isNaN(lifespan)) {
      setError("Expected lifespan (hours) must be positive.");
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep0() || !validateStep1() || !validateStep2()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/inventory/assets/printers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetTag: assetTag.trim() || undefined,
          name: name.trim(),
          manufacturer: manufacturer.trim() || null,
          model: model.trim() || null,
          serialNumber: serialNumber.trim() || null,
          printerType,
          location: location.trim() || null,
          notes: notes.trim() || null,
          maxPrintWidthM: maxPrintWidthM === "" ? null : Number(maxPrintWidthM),
          buildVolumeX: buildVolumeX === "" ? null : Number(buildVolumeX),
          buildVolumeY: buildVolumeY === "" ? null : Number(buildVolumeY),
          buildVolumeZ: buildVolumeZ === "" ? null : Number(buildVolumeZ),
          powerWatts: Number(powerWatts) || 0,
          electricityRateKesKwh: Number(electricityRateKesKwh) || 24,
          productionSpeed: Number(productionSpeed) || (isLF ? 15 : 18),
          highQualitySpeed: highQualitySpeed === "" ? null : Number(highQualitySpeed),
          setupTimeHours: Number(setupTimeHours) ?? 0.25,
          postProcessingTimeHours: postProcessingTimeHours === "" ? null : Number(postProcessingTimeHours),
          compatibleMaterials: compatibleMaterials
            ? compatibleMaterials.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          purchasePriceKes: Number(purchasePriceKes) ?? 0,
          purchaseDate: purchaseDate || null,
          supplierName: supplierName.trim() || null,
          expectedLifespanHours: Number(expectedLifespanHours) || (isLF ? 20_000 : 5_000),
          annualMaintenanceKes: Number(annualMaintenanceKes) || 0,
          warrantyExpiryDate: warrantyExpiryDate || null,
          hoursUsedTotal: Number(hoursUsedTotal) || 0,
          nextScheduledMaintDate: nextScheduledMaintDate || null,
          maintenanceIntervalHours: maintenanceIntervalHours === "" ? null : Number(maintenanceIntervalHours),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create printer");
      }
      const asset = await res.json();
      router.push(`/admin/inventory/hardware/printers/${asset.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register printer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              className={`rounded px-2 py-1 text-sm ${i === step ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
        <CardTitle>{STEPS[step]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HP Latex 800" />
            </div>
            <div>
              <Label htmlFor="assetTag">Asset tag (optional, auto-generated if empty)</Label>
              <Input id="assetTag" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} placeholder="ASSET-LF-001" />
            </div>
            <div>
              <Label htmlFor="printerType">Type</Label>
              <select
                id="printerType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value as typeof printerType)}
              >
                {PRINTER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="serialNumber">Serial number</Label>
              <Input id="serialNumber" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Workshop A" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {isLF ? (
              <>
                <div>
                  <Label htmlFor="maxPrintWidthM">Max print width (m)</Label>
                  <Input id="maxPrintWidthM" type="number" step="0.01" value={maxPrintWidthM} onChange={(e) => setMaxPrintWidthM(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <Label htmlFor="productionSpeed">Production speed (sqm/hr)</Label>
                  <Input id="productionSpeed" type="number" step="0.1" value={productionSpeed} onChange={(e) => setProductionSpeed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="15" />
                </div>
                <div>
                  <Label htmlFor="highQualitySpeed">High-quality speed (sqm/hr, optional)</Label>
                  <Input id="highQualitySpeed" type="number" step="0.1" value={highQualitySpeed} onChange={(e) => setHighQualitySpeed(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Build volume X (mm)</Label>
                  <Input type="number" step="0.1" value={buildVolumeX} onChange={(e) => setBuildVolumeX(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <Label>Build volume Y (mm)</Label>
                  <Input type="number" step="0.1" value={buildVolumeY} onChange={(e) => setBuildVolumeY(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <Label>Build volume Z (mm)</Label>
                  <Input type="number" step="0.1" value={buildVolumeZ} onChange={(e) => setBuildVolumeZ(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div>
                  <Label htmlFor="productionSpeed">Production speed (cm³/hr)</Label>
                  <Input id="productionSpeed" type="number" step="0.1" value={productionSpeed} onChange={(e) => setProductionSpeed(e.target.value === "" ? "" : Number(e.target.value))} placeholder="18" />
                </div>
                <div>
                  <Label htmlFor="postProcessingTimeHours">Post-processing time (hours)</Label>
                  <Input id="postProcessingTimeHours" type="number" step="0.05" value={postProcessingTimeHours} onChange={(e) => setPostProcessingTimeHours(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="compatibleMaterials">Compatible materials (comma-separated)</Label>
                  <Input id="compatibleMaterials" value={compatibleMaterials} onChange={(e) => setCompatibleMaterials(e.target.value)} placeholder="PLA, PETG, ABS" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="powerWatts">Power (W) *</Label>
              <Input id="powerWatts" type="number" min="0" value={powerWatts} onChange={(e) => setPowerWatts(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="electricityRateKesKwh">Electricity rate (KES/kWh)</Label>
              <Input id="electricityRateKesKwh" type="number" step="0.01" value={electricityRateKesKwh} onChange={(e) => setElectricityRateKesKwh(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="setupTimeHours">Setup time (hours)</Label>
              <Input id="setupTimeHours" type="number" step="0.05" value={setupTimeHours} onChange={(e) => setSetupTimeHours(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="purchasePriceKes">Purchase price (KES) *</Label>
              <Input id="purchasePriceKes" type="number" min="0" value={purchasePriceKes} onChange={(e) => setPurchasePriceKes(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase date</Label>
              <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="supplierName">Supplier</Label>
              <Input id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="expectedLifespanHours">Expected lifespan (hours) *</Label>
              <Input id="expectedLifespanHours" type="number" min="1" value={expectedLifespanHours} onChange={(e) => setExpectedLifespanHours(e.target.value === "" ? "" : Number(e.target.value))} placeholder={isLF ? "20000" : "5000"} />
            </div>
            <div>
              <Label htmlFor="annualMaintenanceKes">Annual maintenance (KES)</Label>
              <Input id="annualMaintenanceKes" type="number" min="0" value={annualMaintenanceKes} onChange={(e) => setAnnualMaintenanceKes(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="hoursUsedTotal">Hours used so far</Label>
              <Input id="hoursUsedTotal" type="number" min="0" value={hoursUsedTotal} onChange={(e) => setHoursUsedTotal(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="warrantyExpiryDate">Warranty expiry</Label>
              <Input id="warrantyExpiryDate" type="date" value={warrantyExpiryDate} onChange={(e) => setWarrantyExpiryDate(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nextScheduledMaintDate">Next scheduled maintenance date</Label>
              <Input id="nextScheduledMaintDate" type="date" value={nextScheduledMaintDate} onChange={(e) => setNextScheduledMaintDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="maintenanceIntervalHours">Maintenance interval (hours)</Label>
              <Input id="maintenanceIntervalHours" type="number" min="0" value={maintenanceIntervalHours} onChange={(e) => setMaintenanceIntervalHours(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 500" />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating…" : "Register printer"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
