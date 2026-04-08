"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  finishingLabel,
  supportRemovalLabel,
  turnaroundLabel,
} from "@/lib/quote-spec-labels";

type Specs = Record<string, unknown> & {
  largeFormat?: boolean;
  dimensions?: { width?: number; height?: number; unit?: string };
  material?: string;
  materialName?: string;
  materialSlug?: string;
  color?: string;
  quantity?: number;
  weightGrams?: number;
  weightG?: number;
  printTimeHours?: number;
  printTimeHrs?: number;
  infillPercent?: number;
  layerHeightMm?: number;
  supportCode?: string;
  supportRemovalCode?: string;
  finishingCode?: string;
  turnaroundCode?: string;
  postProcessing?: boolean;
  areaSqm?: number;
  lamination?: string;
  finishing?: string;
  projectType?: string;
  preferredColours?: string;
  hasBrandLogo?: boolean;
  useCase?: string;
  quantityNeeded?: number;
  budgetRange?: string;
  deadline?: string;
};

function DefRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <>
      <dt className="text-muted-foreground text-sm py-1.5 pr-4 border-b border-border/50">{label}</dt>
      <dd className="text-sm py-1.5 border-b border-border/50">{value}</dd>
    </>
  );
}

export function QuoteSubmissionDetails({
  type,
  specifications,
  description,
  projectName,
}: {
  type: string;
  specifications: Specs | null;
  description: string | null;
  projectName: string | null;
}) {
  const spec = specifications ?? ({} as Specs);

  if (type === "large_format") {
    const dims = (spec.dimensions as { width?: number; height?: number; unit?: string }) ?? {};
    const dimStr = (dims.width != null || dims.height != null)
      ? `${[dims.width, dims.height].filter(Boolean).join(" × ")} ${dims.unit ?? "cm"}`
      : null;
    return (
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Submission details — Large Format</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-0 text-sm">
            {dimStr && <DefRow label="Dimensions" value={dimStr} />}
            {spec.material && <DefRow label="Material" value={String(spec.material)} />}
            {spec.quantity != null && <DefRow label="Quantity" value={String(spec.quantity)} />}
            {spec.lamination && <DefRow label="Lamination" value={String(spec.lamination)} />}
            {spec.finishing && <DefRow label="Finishing" value={String(spec.finishing)} />}
            {spec.areaSqm != null && <DefRow label="Area" value={`${spec.areaSqm} m²`} />}
          </dl>
          {description && (
            <div className="rounded-lg border border-blue-200 bg-[#F0F9FF] p-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">📝 Special instructions</p>
              <p className="text-sm whitespace-pre-wrap">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === "three_d_print") {
    if (spec.isMultiPart && Array.isArray(spec.parts)) {
      return (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Submission details — 3D Print ({spec.parts.length} parts)</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {spec.parts.map((p: any, i: number) => {
                const weight = p.weightGrams ?? p.weightG;
                const time = p.printTimeHours ?? p.printTimeHrs;
                const materialStr = p.materialName || p.material || p.materialSlug;

                return (
                  <div key={i} className="flex flex-col rounded-xl border border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3 border-b border-border/50 pb-2">
                       <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8440A]/10 text-[#E8440A]">
                         <span className="text-xs font-bold">{i + 1}</span>
                       </span>
                       <span className="font-semibold text-sm">Part {i + 1}: {materialStr}</span>
                    </div>
                    <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-0 text-xs">
                      {materialStr && <DefRow label="Material" value={String(materialStr)} />}
                      {p.color && <DefRow label="Colour" value={String(p.color)} />}
                      {weight != null && <DefRow label="Weight" value={`${weight} g`} />}
                      {time != null && <DefRow label="Print time" value={`${time} hours`} />}
                      {p.quantity != null && <DefRow label="Quantity" value={String(p.quantity)} />}
                      {p.postProcessing && <DefRow label="Post-processing" value="Yes" />}
                      {p.infillPercent != null && <DefRow label="Infill" value={`${p.infillPercent}%`} />}
                    </dl>
                  </div>
                );
              })}
            </div>
            {description && (
              <div className="rounded-lg border border-blue-200 bg-[#F0F9FF] p-3 mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">📝 Special instructions</p>
                <p className="text-sm whitespace-pre-wrap">{description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    const weight = spec.weightGrams ?? spec.weightG;
    const time = spec.printTimeHours ?? spec.printTimeHrs;
    const materialStr = spec.materialName || spec.material;
    const colorStr = spec.color ? (
      <span className="inline-flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded-full bg-slate-800 border border-slate-400" aria-hidden />
        {String(spec.color)}
      </span>
    ) : null;
    const supportStr = spec.supportCode === "NONE" || !spec.supportCode ? "None" : String(spec.supportCode);
    const supportRemovalStr = supportRemovalLabel(spec.supportRemovalCode as string) || spec.supportRemovalCode;
    const finishingStr = finishingLabel(spec.finishingCode as string) || spec.finishingCode;
    const turnaroundStr = turnaroundLabel(spec.turnaroundCode as string) || spec.turnaroundCode;

    return (
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Submission details — 3D Print</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-0 text-sm">
            {materialStr && <DefRow label="Material" value={String(materialStr)} />}
            {spec.color && <DefRow label="Colour" value={colorStr} />}
            {weight != null && <DefRow label="Weight" value={`${weight} g`} />}
            {time != null && <DefRow label="Print time" value={`${time} hours`} />}
            {spec.quantity != null && <DefRow label="Quantity" value={String(spec.quantity)} />}
            {spec.infillPercent != null && <DefRow label="Infill density" value={`${spec.infillPercent}%`} />}
            {spec.layerHeightMm != null && <DefRow label="Layer height" value={`${spec.layerHeightMm} mm`} />}
            <DefRow label="Supports" value={supportStr} />
            {(spec.supportRemovalCode || spec.supportCode) && (
              <DefRow label="Support removal" value={supportRemovalStr} />
            )}
            {(finishingStr || spec.finishingCode) && (
              <DefRow label="Finishing" value={finishingStr} />
            )}
            {(turnaroundStr || spec.turnaroundCode) && (
              <DefRow label="Turnaround preference" value={turnaroundStr} />
            )}
            {spec.postProcessing && <DefRow label="Post-processing" value="Yes" />}
          </dl>
          {description && (
            <div className="rounded-lg border border-blue-200 bg-[#F0F9FF] p-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">📝 Special instructions</p>
              <p className="text-sm whitespace-pre-wrap">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === "design_and_print") {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Submission details — I Have an Idea</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-0 text-sm">
            {projectName && <DefRow label="Project name" value={projectName} />}
            {spec.projectType && <DefRow label="Project type" value={String(spec.projectType)} />}
            {spec.preferredColours && <DefRow label="Preferred colours" value={String(spec.preferredColours)} />}
            {spec.hasBrandLogo != null && <DefRow label="Brand/logo" value={spec.hasBrandLogo ? "Yes" : "No"} />}
            {spec.useCase && <DefRow label="Use case" value={String(spec.useCase)} />}
            {spec.quantityNeeded != null && <DefRow label="Quantity" value={String(spec.quantityNeeded)} />}
            {spec.budgetRange && <DefRow label="Budget range" value={String(spec.budgetRange)} />}
            {spec.deadline && <DefRow label="Deadline" value={String(spec.deadline)} />}
          </dl>
          {description && (
            <div className="rounded-lg border border-blue-200 bg-[#F0F9FF] p-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">📝 Idea description</p>
              <p className="text-sm whitespace-pre-wrap">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
