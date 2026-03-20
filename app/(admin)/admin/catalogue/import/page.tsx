"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";
import { Loader2, Search, ExternalLink, CheckCircle, AlertCircle, Eye, Layers } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FileUploader, UploadedFileResult } from "@/components/upload/FileUploader";
import { Label } from "@/components/ui/label";

export default function ImportDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">3D Model Import System</h1>
      </div>

      <Tabs defaultValue="url">
        <TabsList>
          <TabsTrigger value="url">Import by URL</TabsTrigger>
          <TabsTrigger value="api">Search API Sources</TabsTrigger>
          <TabsTrigger value="queue">Import Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="pt-6">
          <UrlImportSection />
        </TabsContent>

        <TabsContent value="api" className="pt-6">
          <ApiSearchSection />
        </TabsContent>

        <TabsContent value="queue" className="pt-6">
          <ImportQueueSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UrlImportSection() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [error, setError] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await fetch("/api/admin/import/history?limit=10");
    if (res.ok) {
      const data = await res.json();
      setHistory(data.history || []);
    }
  };

  const handleImport = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowManual(false);
    setStatus("Fetching page...");
    
    try {
      const res = await fetch("/api/admin/import/url", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        setError(data);
        // Show manual fallback for most failures
        if (data.error !== "ALREADY_IMPORTED") {
          setShowManual(true);
        }
      } else {
        setResult(data);
        fetchHistory();
      }
    } catch {
      setError({ error: "CLIENT_ERROR" });
      setShowManual(true);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <label className="block text-sm font-medium mb-2">Paste Model URL</label>
        <div className="flex gap-2">
          <input 
            className="flex-1 border rounded-md px-3 py-2"
            placeholder="Paste any model URL from Printables, Cults3D, Creazilla, Thingiverse..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button 
            className="bg-primary text-white px-6 py-2 rounded-md disabled:opacity-50 flex items-center gap-2"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Import
          </button>
        </div>
        
        {loading && <p className="mt-2 text-sm text-muted-foreground animate-pulse">{status}</p>}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Import Failed</p>
              <div className="text-sm space-y-1">
                {error.error === "ALREADY_IMPORTED" ? (
                  <p>This model was already imported. <Link href={`/admin/catalogue/import/${error.existingId}/review`} className="underline">View existing record</Link></p>
                ) : error.error === "FETCH_FAILED" || error.error === "API_FETCH_FAILED" ? (
                  <p>Could not connect to the platform API. Please check your API credentials in Settings or try manual entry below.</p>
                ) : error.error === "API_CONFIG_MISSING" ? (
                  <p>API configuration is missing for this platform. Please set up the required API keys in your environment.</p>
                ) : error.error === "AUTO_IMPORT_NOT_SUPPORTED" ? (
                  <p>Automatic import is not yet supported for this platform. Please fill in the details below manually.</p>
                ) : error.error === "CLOUDFLARE_BYPASS_FAILED" ? (
                  <p>This site blocks automated imports via Cloudflare. Please use the manual entry form below.</p>
                ) : error.error === "NAME_NOT_FOUND" ? (
                  <p>Could not extract product name automatically. Please fill it in manually below.</p>
                ) : (
                  <p>Could not auto-import from this URL. Please use the manual form below.</p>
                )}
                
                {error.detail && (
                  <div className="mt-2 p-2 bg-red-100/50 rounded text-xs font-mono break-all line-clamp-3 overflow-hidden">
                    {error.detail}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="font-medium">Import successful!</p>
            </div>
            <Link href={`/admin/catalogue/import/${result.id}/review`} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
              Review Now
            </Link>
          </div>
        )}

        {showManual && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Manual Fallback Entry
            </h3>
            <ManualFallbackForm 
              initialUrl={url} 
              onSuccess={(id) => {
                setShowManual(false);
                setResult({ id });
                fetchHistory();
              }} 
            />
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent URL Imports</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Source URL</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.platform}</td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    <a href={item.sourceUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1">
                      {item.sourceUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3">{format(new Date(item.importedAt), "MMM d, HH:mm")}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] uppercase font-bold",
                      item.status === "PENDING_REVIEW" ? "bg-amber-100 text-amber-700" :
                      item.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/catalogue/import/${item.id}/review`} className="text-primary hover:underline flex items-center gap-1">
                      <Eye className="w-4 h-4" /> Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p className="p-8 text-center text-muted-foreground">No recent imports found.</p>}
        </div>
      </div>
    </div>
  );
}

type ImportPlatform = 'THINGIVERSE' | 'MYMINIFACTORY' | 'CGTRADER' | 'PRINTABLES' | 'CULTS3D' | 'CREAZILLA' | 'THANGS' | 'OTHER';

type PlatformConfig = {
  value: ImportPlatform;
  label: string;
  hasApi: boolean;
  urlImportSupported: boolean;
  allCommercial: boolean;
  apiKeyEnvVar?: string;
  searchUrl: string;
  notes: string;
  reminder: string;
};

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    value: 'THINGIVERSE',
    label: 'Thingiverse',
    hasApi: true,
    urlImportSupported: true,
    allCommercial: false,
    apiKeyEnvVar: 'THINGIVERSE_APP_TOKEN',
    searchUrl: 'https://www.thingiverse.com/search',
    notes: 'Filter by CC licence in search results.',
    reminder: 'Filter for CC0 or CC BY licences only. Avoid anything with NC in the licence name.',
  },
  {
    value: 'MYMINIFACTORY',
    label: 'MyMiniFactory',
    hasApi: true,
    urlImportSupported: true,
    allCommercial: false,
    apiKeyEnvVar: 'MMF_CLIENT_ID',
    searchUrl: 'https://www.myminifactory.com/search',
    notes: 'Check commercial printing permission per model.',
    reminder: 'Only import models with commercial printing explicitly enabled on the model page.',
  },
  {
    value: 'CGTRADER',
    label: 'CGTrader',
    hasApi: true,
    urlImportSupported: true,
    allCommercial: false,
    apiKeyEnvVar: 'CGTRADER_CLIENT_ID',
    searchUrl: 'https://www.cgtrader.com/3d-print-models/commercial-use',
    notes: 'Requires partner API access request.',
    reminder: 'Royalty-free licence permits commercial printing of physical objects.',
  },
  {
    value: 'PRINTABLES',
    label: 'Printables.com',
    hasApi: false,
    urlImportSupported: true,
    allCommercial: false,
    searchUrl: 'https://www.printables.com/search/models',
    notes: 'No public API. Use URL import.',
    reminder: 'Check licence on each model page. Look for CC0 or CC BY. Avoid Non-Commercial models.',
  },
  {
    value: 'CULTS3D',
    label: 'Cults3D',
    hasApi: false,
    urlImportSupported: true,
    allCommercial: false,
    searchUrl: 'https://cults3d.com/en/tags/commercial+use',
    notes: 'No public API. Use URL import.',
    reminder: 'Use the commercial+use tag filter. Verify each model\'s licence before importing.',
  },
  {
    value: 'CREAZILLA',
    label: 'Creazilla',
    hasApi: false,
    urlImportSupported: true,
    allCommercial: true,
    searchUrl: 'https://creazilla.com/section/3d-model',
    notes: 'All models are free for commercial use.',
    reminder: 'All models are free for commercial, educational and personal use. No restrictions.',
  },
  {
    value: 'THANGS',
    label: 'Thangs',
    hasApi: false,
    urlImportSupported: true,
    allCommercial: false,
    searchUrl: 'https://thangs.com',
    notes: 'No public API. Use URL import.',
    reminder: 'Thangs aggregates from multiple platforms. Always verify the licence at the original source.',
  },
];

function ApiSearchSection() {
  const [platform, setPlatform] = useState<ImportPlatform>("THINGIVERSE");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [apiConfig, setApiConfig] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await fetch("/api/admin/import/config");
      if (res.ok) {
        const data = await res.json();
        setApiConfig(data.config || {});
      }
    };
    fetchConfig();
  }, []);

  const config = PLATFORM_CONFIGS.find(c => c.value === platform) || PLATFORM_CONFIGS[0];
  const isApiMissing = !!(config.hasApi && config.apiKeyEnvVar && !apiConfig[config.apiKeyEnvVar]);

  const handleSearch = async (isNewSearch = true) => {
    if (!term || !config.hasApi || isApiMissing) return;
    setLoading(true);
    const nextPage = isNewSearch ? 1 : page + 1;
    
    try {
      const res = await fetch("/api/admin/import/search", {
        method: "POST",
        body: JSON.stringify({ platform, term, page: nextPage }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setResults(isNewSearch ? data.results : [...results, ...data.results]);
        setPage(nextPage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm font-medium mb-2">Platform</label>
            <select 
              className="w-full border rounded-md px-3 py-2 bg-transparent"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as ImportPlatform);
                setResults([]);
                setPage(1);
              }}
            >
              <optgroup label="── API Search Available ──">
                {PLATFORM_CONFIGS.filter(c => c.hasApi).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </optgroup>
              <optgroup label="── URL Import Only ──">
                {PLATFORM_CONFIGS.filter(c => !c.hasApi).map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label} {c.allCommercial ? "🟢 All commercial" : ""}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {config.hasApi ? (
            <div className="flex-[2] min-w-[300px]">
              <label className="block text-sm font-medium mb-2">Search Term</label>
              <div className="flex gap-2">
                <input 
                  className={cn(
                    "flex-1 border rounded-md px-3 py-2",
                    isApiMissing && "bg-gray-50 opacity-50 cursor-not-allowed"
                  )}
                  placeholder={isApiMissing ? "Search disabled (missing API key)" : "Search for models..."}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(true)}
                  disabled={isApiMissing}
                />
                <button 
                  className="bg-primary text-white px-6 py-2 rounded-md disabled:opacity-50 flex items-center gap-2"
                  onClick={() => handleSearch(true)}
                  disabled={loading || isApiMissing}
                >
                  {loading && page === 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-[2] min-w-[300px]">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-md flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded text-blue-600">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">{config.label} does not have a public API.</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    To import: Browse models on their site, copy the URL, and use the <strong>Import by URL</strong> tab.
                  </p>
                  <a 
                    href={config.searchUrl} 
                    target="_blank" 
                    className="inline-flex items-center gap-1.5 mt-2 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700"
                  >
                    Browse {config.label} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Licence Reminder Banner */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-gray-600">{config.label} Reminder:</span>
            <span>{config.reminder}</span>
          </div>
          {config.allCommercial && (
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Commercially Usable
            </div>
          )}
        </div>

        {isApiMissing && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-800">API Key not configured</p>
              <p className="text-amber-700">
                Set <code>{config.apiKeyEnvVar}</code> in your environment variables to enable search for {config.label}.
                You can still use <strong>URL import</strong> for this platform.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((item) => (
          <div key={item.externalId} className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
            <div className="aspect-video relative bg-gray-100">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">No image</div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col space-y-3">
              <div>
                <h4 className="font-bold line-clamp-1" title={item.name}>{item.name}</h4>
                <p className="text-sm text-muted-foreground truncate">by {item.designerName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LicenceBadge licence={item.licenceType} size="sm" />
              </div>
              <div className="pt-2 mt-auto">
                {item.alreadyImported ? (
                  <span className="inline-block w-full text-center py-2 bg-gray-100 text-gray-500 rounded-md text-sm font-medium">
                    Already Imported
                  </span>
                ) : (
                  <button 
                    className="w-full bg-secondary text-secondary-foreground py-2 rounded-md text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
                    onClick={() => handleSingleImport(item)}
                  >
                    Import Model
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="flex justify-center pb-8">
          <button 
            className="px-8 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
            onClick={() => handleSearch(false)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleSingleImport(item: any) {
    try {
      const res = await fetch("/api/admin/import/url", {
        method: "POST",
        body: JSON.stringify({ url: item.sourceUrl }),
      });
      if (res.ok) {
        // Update local state to show "Already Imported"
        setResults(prev => prev.map(r => r.externalId === item.externalId ? { ...r, alreadyImported: true } : r));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

function ImportQueueSection() {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import/queue");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 w-16 text-center">Preview</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Platform</th>
            <th className="px-4 py-3">Licence</th>
            <th className="px-4 py-3">Imported At</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y text-sm">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="w-12 h-12 rounded bg-gray-100 border overflow-hidden">
                  {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />}
                </div>
              </td>
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">{item.platform}</td>
              <td className="px-4 py-3">
                <LicenceBadge licence={item.licenceType} size="sm" />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{format(new Date(item.importedAt), "MMM d, yyyy")}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/catalogue/import/${item.id}/review`} className="inline-block bg-primary text-white px-3 py-1.5 rounded-md text-xs hover:bg-primary/90">
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">Queue is empty.</div>
      ) : null}
    </div>
  );
}

function ManualFallbackForm({ initialUrl, onSuccess }: { initialUrl: string; onSuccess: (id: string) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    printInfo: "",
    imageUrls: "",
    licenceType: "CC BY",
    designerName: "",
    designerUrl: "",
    platform: "OTHER" as any,
    categoryId: "",
    uploadedImages: [] as string[],
    printSettings: {
      layerHeight: "",
      infill: "",
      material: "",
      supports: "No",
    },
  });
  const [categories, setCategories] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Fetch main shop categories
    const fetchCats = async () => {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    };
    fetchCats();
  }, []);

  React.useEffect(() => {
    // Auto-detect platform and pre-fill name from URL
    try {
      const urlObj = new URL(initialUrl);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname;
      
      let detectedPlatform = "OTHER";
      if (hostname.includes("printables.com")) detectedPlatform = "PRINTABLES";
      else if (hostname.includes("thingiverse.com")) detectedPlatform = "THINGIVERSE";
      else if (hostname.includes("cults3d.com")) detectedPlatform = "CULTS3D";
      else if (hostname.includes("creazilla.com")) detectedPlatform = "CREAZILLA";
      else if (hostname.includes("myminifactory.com")) detectedPlatform = "MYMINIFACTORY";
      else if (hostname.includes("cgtrader.com")) detectedPlatform = "CGTRADER";
      else if (hostname.includes("thangs.com")) detectedPlatform = "THANGS";

      // Attempt to extract name from slug
      // e.g. /model/123-cool-object -> cool-object -> Cool Object
      const slug = pathname.split('/').filter(Boolean).pop() || "";
      // Remove common prefix/suffix like IDs or "thing:123"
      const cleanSlug = slug.replace(/^thing:\d+-?/, "").replace(/^\d+-?/, "").replace(/-?\d+$/, "");
      const name = cleanSlug
        .split(/[-_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      setFormData(prev => ({ 
        ...prev, 
        platform: detectedPlatform as any,
        name: name || prev.name 
      }));
    } catch {}
  }, [initialUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/admin/import/url/manual", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          sourceUrl: initialUrl,
          imageUrls: [
            ...(formData.imageUrls.split("\n").filter(Boolean).map(url => url.trim())),
            ...formData.uploadedImages
          ],
          categoryId: formData.categoryId,
          printInfo: `Layer Height: ${formData.printSettings.layerHeight}\nInfill: ${formData.printSettings.infill}\nMaterial: ${formData.printSettings.material}\nSupports: ${formData.printSettings.supports}\n\n${formData.printInfo}`,
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.id) {
        onSuccess(data.id);
      } else {
        alert(data.error || "Manual import failed");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during manual import.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Source URL</label>
        <input 
          disabled 
          className="w-full bg-gray-50 border rounded-md px-3 py-2 text-muted-foreground"
          value={initialUrl}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Product Name *</label>
        <input 
          required
          className="w-full border rounded-md px-3 py-2"
          value={formData.name}
          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Platform</label>
        <select 
          className="w-full border rounded-md px-3 py-2 bg-transparent"
          value={formData.platform}
          onChange={(e) => setFormData(p => ({ ...p, platform: e.target.value }))}
        >
          <option value="PRINTABLES">Printables</option>
          <option value="THINGIVERSE">Thingiverse</option>
          <option value="CULTS3D">Cults3D</option>
          <option value="CREAZILLA">Creazilla</option>
          <option value="MYMINIFACTORY">MyMiniFactory</option>
          <option value="CGTRADER">CGTrader</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea 
          rows={3}
          className="w-full border rounded-md px-3 py-2"
          value={formData.description}
          onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
        />
      </div>

      <div className="md:col-span-2 p-4 bg-slate-50 border rounded-xl space-y-4">
        <Label className="text-sm font-bold flex items-center gap-2">
          <Layers className="h-4 w-4" /> Print Settings (Table-like info)
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500">Layer Height</label>
            <input 
              placeholder="0.2mm"
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              value={formData.printSettings.layerHeight}
              onChange={(e) => setFormData(p => ({ ...p, printSettings: { ...p.printSettings, layerHeight: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500">Infill</label>
            <input 
              placeholder="15%"
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              value={formData.printSettings.infill}
              onChange={(e) => setFormData(p => ({ ...p, printSettings: { ...p.printSettings, infill: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500">Material</label>
            <input 
              placeholder="PLA/PETG"
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              value={formData.printSettings.material}
              onChange={(e) => setFormData(p => ({ ...p, printSettings: { ...p.printSettings, material: e.target.value } }))}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500">Supports</label>
            <select 
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
              value={formData.printSettings.supports}
              onChange={(e) => setFormData(p => ({ ...p, printSettings: { ...p.printSettings, supports: e.target.value } }))}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Only on bed">Only on bed</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500">Other Print Notes</label>
          <textarea 
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm bg-white"
            placeholder="Additional instructions..."
            value={formData.printInfo}
            onChange={(e) => setFormData(p => ({ ...p, printInfo: e.target.value }))}
          />
        </div>
      </div>

      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Internal Category *</label>
        <select 
          required
          className="w-full border rounded-md px-3 py-2 bg-transparent"
          value={formData.categoryId}
          onChange={(e) => setFormData(p => ({ ...p, categoryId: e.target.value }))}
        >
          <option value="">Select Category...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 space-y-4">
        <Label className="text-base font-bold">Model Images</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">Option A: Upload Files (Recommended)</Label>
            <FileUploader 
              context="catalogue_import"
              accept={["image/png", "image/jpeg", "image/webp"]}
              maxFiles={10}
              onUploadComplete={(files: UploadedFileResult[]) => {
                const urls = files.map(f => f.publicUrl).filter(Boolean) as string[];
                setFormData(p => ({ ...p, uploadedImages: [...p.uploadedImages, ...urls] }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">Option B: External URLs (One per line)</Label>
            <textarea 
              rows={5}
              className="w-full border rounded-md px-3 py-2 font-mono text-[10px]"
              placeholder="Paste direct image URLs here..."
              value={formData.imageUrls}
              onChange={(e) => setFormData(p => ({ ...p, imageUrls: e.target.value }))}
            />
            <p className="text-[10px] text-muted-foreground">Right-click image on source site → Copy image address.</p>
          </div>
        </div>
      </div>

      <div className="md:col-span-1">
        <label className="block text-sm font-medium mb-1">Licence</label>
        <select 
          className="w-full border rounded-md px-3 py-2 bg-transparent"
          value={formData.licenceType}
          onChange={(e) => setFormData(p => ({ ...p, licenceType: e.target.value }))}
        >
          <option value="CC0">CC0 — Public Domain</option>
          <option value="CC BY">CC BY — Attribution</option>
          <option value="CC BY-SA">CC BY-SA — Attribution ShareAlike</option>
          <option value="CC BY-ND">CC BY-ND — No Derivatives</option>
          <option value="CC BY-NC">CC BY-NC — Non-Commercial</option>
          <option value="CC BY-NC-SA">CC BY-NC-SA — Non-Commercial ShareAlike</option>
          <option value="CC BY-NC-ND">CC BY-NC-ND — Non-Commercial No Derivatives</option>
          <option value="Commercial">Commercial/Proprietary</option>
          <option value="GPL">GPL</option>
          <option value="LGPL">LGPL</option>
        </select>
      </div>

      <div className="md:col-span-1 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Designer Name</label>
          <input 
            className="w-full border rounded-md px-3 py-2"
            value={formData.designerName}
            onChange={(e) => setFormData(p => ({ ...p, designerName: e.target.value }))}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Designer URL</label>
          <input 
            className="w-full border rounded-md px-3 py-2"
            value={formData.designerUrl}
            onChange={(e) => setFormData(p => ({ ...p, designerUrl: e.target.value }))}
          />
        </div>
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button 
          type="submit"
          className="bg-primary text-white px-8 py-3 rounded-md disabled:opacity-50 flex items-center gap-2 font-semibold"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Save for Review
        </button>
      </div>
    </form>
  );
}
