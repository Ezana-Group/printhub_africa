"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, Sparkles, AlertCircle, CheckCircle2, Play, Pause, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface AdminCatalogueBatchClientProps {
  initialProducts: any[];
}

export function AdminCatalogueBatchClient({ initialProducts }: AdminCatalogueBatchClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const progressValue = products.length > 0 ? (processedCount / products.length) * 100 : 0;

  const enhanceProduct = async (product: any) => {
    try {
      const res = await fetch("/api/admin/catalogue/enhance-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id })
      });
      if (res.ok) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const startBatchProcessing = async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    setFailedCount(0);

    const batchSize = 10;
    const delay = 2000;

    for (let i = 0; i < products.length; i += batchSize) {
      if (!isProcessing) break; // Allow pause if implemented

      const batch = products.slice(i, i + batchSize);
      setCurrentIdx(i);

      // Process batch
      const results = await Promise.all(batch.map(p => enhanceProduct(p)));
      
      const successCount = results.filter(r => r).length;
      setProcessedCount(prev => prev + successCount);
      setFailedCount(prev => prev + (batch.length - successCount));

      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsProcessing(false);
    toast.success("Batch processing completed!");
    router.refresh();
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Sparkles className="w-8 h-8 mr-3 text-[#FF4D00]" />
            Batch AI Enhancement
          </h1>
          <p className="text-slate-600 mt-1">
            Generate AI-optimized descriptions for products currently lacking them.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push("/admin/catalogue")}
          >
            Back to Catalogue
          </Button>
          <Button 
            className="bg-[#FF4D00] hover:bg-[#E64500] text-white"
            onClick={startBatchProcessing}
            disabled={isProcessing || products.length === 0}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Enhance All ({products.length} Items)
          </Button>
        </div>
      </div>

      {isProcessing && (
        <Card className="mb-8 border-[#FF4D00]/20 bg-[#FF4D00]/5 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Processing {currentIdx + 1} - {Math.min(currentIdx + 10, products.length)} of {products.length}
              </span>
              <span className="text-sm font-bold text-[#FF4D00]">
                {Math.round(progressValue)}%
              </span>
            </div>
            <Progress value={progressValue} className="h-2 mb-4" />
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> {processedCount} Successful
              </span>
              <span className="text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" /> {failedCount} Failed
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Queue ({products.length} products)</CardTitle>
          <CardDescription>
            These products will be enhanced using their images and existing basic descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-sm font-medium uppercase tracking-wider">
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-center">Images</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{product.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline">{product.category.name}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      {product.externalModel ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px]">Imported</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[10px]">Manual</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium">{product.images?.length || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-[#FF4D00] hover:text-[#E64500] hover:bg-[#FF4D00]/5"
                        onClick={() => enhanceProduct(product)}
                      >
                        Enhance Single
                      </Button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      <RotateCcw className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      No products remaining in enhancement queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
