"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUploader } from "@/components/upload/FileUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { UploadedFileResult } from "@/components/upload/FileUploader";
import { Box } from "lucide-react";

type Tab = "3d";

export default function UploadPage() {
  const [tab, setTab] = useState<Tab>("3d");
  const [, setUploaded3d] = useState<UploadedFileResult[]>([]);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-slate-900">Upload your files</h1>
      <p className="text-slate-600 mt-2">
        Upload your 3D model files, then request a quote.
      </p>

      <div className="mt-8 flex w-full gap-3 overflow-x-auto rounded-xl bg-slate-50 p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setTab("3d")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            tab === "3d"
              ? "bg-[#CC3D00] text-white shadow-sm"
              : "bg-[#E3F2FD] text-[#1565C0] hover:brightness-95"
          }`}
        >
          <Box className="h-4 w-4" />
          3D Print
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
          ) : null}
        </CardHeader>
        <CardContent>
          {tab === "3d" && (
            <>
              <FileUploader
                context="CUSTOMER_3D_PRINT"
                accept={[
                  "model/stl",
                  "model/obj",
                  "model/3mf",
                  "application/octet-stream",
                  "application/sla",
                  ".stl",
                  ".obj",
                  ".3mf",
                  ".step",
                  ".stp",
                ]}
                maxSizeMB={500}
                maxFiles={5}
                label="Upload your 3D model files"
                hint="STL, OBJ, 3MF, STEP · Max 500MB per file · Up to 5 files"
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
