"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUploader } from "@/components/upload/FileUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { UploadedFileResult } from "@/components/upload/FileUploader";
import { Box, FileCode } from "lucide-react";

type Tab = "3d" | "large_format";

export default function UploadPage() {
  const [tab, setTab] = useState<Tab>("3d");
  const [uploaded3d, setUploaded3d] = useState<UploadedFileResult[]>([]);
  const [uploadedLf, setUploadedLf] = useState<UploadedFileResult[]>([]);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-slate-900">Upload your files</h1>
      <p className="text-slate-600 mt-2">
        Choose 3D print or large format, then upload your design files. You can request a quote after uploading.
      </p>

      <div className="mt-8 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("3d")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "3d"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Box className="h-4 w-4" />
          3D Print
        </button>
        <button
          type="button"
          onClick={() => setTab("large_format")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "large_format"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileCode className="h-4 w-4" />
          Large Format
        </button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          {tab === "3d" ? (
            <>
              <h2 className="text-lg font-semibold">3D model files</h2>
              <p className="text-sm text-slate-500">
                STL, OBJ, 3MF, STEP · Max 500MB per file · Up to 5 files
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Large format design files</h2>
              <p className="text-sm text-slate-500">
                AI, PDF, PSD, EPS, PNG, SVG, TIFF · Max 500MB per file · Up to 3 files
              </p>
            </>
          )}
        </CardHeader>
        <CardContent>
          {tab === "3d" && (
            <>
              <FileUploader
                context="CUSTOMER_3D_PRINT"
                accept={[
                  "model/stl",
                  "model/obj",
                  "application/octet-stream",
                  "application/sla",
                ]}
                maxSizeMB={500}
                maxFiles={5}
                label="Upload your 3D model files"
                description="STL, OBJ, 3MF, STEP · Max 500MB per file · Up to 5 files"
                onUploadComplete={setUploaded3d}
              />
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>✓ STL — most common, recommended</div>
                <div>✓ OBJ — with textures</div>
                <div>✓ 3MF — Bambu Lab native format</div>
                <div>✓ STEP — engineering/CAD files</div>
              </div>
            </>
          )}
          {tab === "large_format" && (
            <>
              <FileUploader
                context="CUSTOMER_LARGE_FORMAT"
                accept={[
                  "application/pdf",
                  "image/png",
                  "image/jpeg",
                  "image/tiff",
                  "image/svg+xml",
                  "application/postscript",
                  "image/vnd.adobe.photoshop",
                  "application/dxf",
                ]}
                maxSizeMB={500}
                maxFiles={3}
                label="Upload your print file"
                description="AI, PDF, PSD, EPS, PNG (300dpi+), SVG, TIFF · Max 500MB"
                onUploadComplete={setUploadedLf}
              />
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <strong>For best results:</strong>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-slate-600">
                  <li>Resolution: minimum 100dpi at print size (300dpi preferred)</li>
                  <li>Colour mode: CMYK for prints, RGB for backlit/lightbox</li>
                  <li>Include 5mm bleed on all sides</li>
                  <li>Embed all fonts or convert to outlines</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/get-a-quote">Get a quote with these files →</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
