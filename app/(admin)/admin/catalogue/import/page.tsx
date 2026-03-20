"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LicenceBadge } from "@/components/catalogue/LicenceBadge";
import { Loader2, Search, ExternalLink, CheckCircle, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
                ) : error.error === "FETCH_FAILED" ? (
                  <p>Could not reach this URL. Check the link and try again.</p>
                ) : error.error === "CLOUDFLARE_BYPASS_FAILED" ? (
                  <p>This site blocks automated imports. Please use the manual entry form below.</p>
                ) : error.error === "NAME_NOT_FOUND" ? (
                  <p>Could not extract product name automatically. Please fill it in manually below.</p>
                ) : (
                  <p>An unexpected error occurred.</p>
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

function ApiSearchSection() {
  const [platform, setPlatform] = useState("THINGIVERSE");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  const handleSearch = async (isNewSearch = true) => {
    if (!term) return;
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
      <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Platform</label>
          <select 
            className="w-full border rounded-md px-3 py-2 bg-transparent"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="THINGIVERSE">Thingiverse</option>
            <option value="MYMINIFACTORY">MyMiniFactory</option>
            <option value="CGTRADER">CGTrader</option>
          </select>
        </div>
        <div className="flex-[2] min-w-[300px]">
          <label className="block text-sm font-medium mb-2">Search Term</label>
          <div className="flex gap-2">
            <input 
              className="flex-1 border rounded-md px-3 py-2"
              placeholder="Search for models..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(true)}
            />
            <button 
              className="bg-primary text-white px-6 py-2 rounded-md disabled:opacity-50 flex items-center gap-2"
              onClick={() => handleSearch(true)}
              disabled={loading}
            >
              {loading && page === 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>
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
                  {item.thumbnailUrl && <img src={item.thumbnailUrl} className="w-full h-full object-cover" />}
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
  });

  React.useEffect(() => {
    // Auto-detect platform from URL
    try {
      const hostname = new URL(initialUrl).hostname.toLowerCase();
      if (hostname.includes("printables.com")) setFormData(prev => ({ ...prev, platform: "PRINTABLES" }));
      else if (hostname.includes("thingiverse.com")) setFormData(prev => ({ ...prev, platform: "THINGIVERSE" }));
      else if (hostname.includes("cults3d.com")) setFormData(prev => ({ ...prev, platform: "CULTS3D" }));
      else if (hostname.includes("creazilla.com")) setFormData(prev => ({ ...prev, platform: "CREAZILLA" }));
      else if (hostname.includes("myminifactory.com")) setFormData(prev => ({ ...prev, platform: "MYMINIFACTORY" }));
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
          imageUrls: formData.imageUrls.split("\n").filter(Boolean).map(url => url.trim()),
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

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Print Info (Layer height, material, etc.)</label>
        <textarea 
          rows={2}
          className="w-full border rounded-md px-3 py-2"
          value={formData.printInfo}
          onChange={(e) => setFormData(p => ({ ...p, printInfo: e.target.value }))}
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Image URLs (one per line)</label>
        <textarea 
          rows={4}
          className="w-full border rounded-md px-3 py-2 font-mono text-xs"
          placeholder="Paste direct image URLs here..."
          value={formData.imageUrls}
          onChange={(e) => setFormData(p => ({ ...p, imageUrls: e.target.value }))}
        />
        <p className="text-[10px] text-muted-foreground mt-1">Right-click image on source site → Copy image address.</p>
      </div>

      <div>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Designer Name</label>
          <input 
            className="w-full border rounded-md px-3 py-2"
            value={formData.designerName}
            onChange={(e) => setFormData(p => ({ ...p, designerName: e.target.value }))}
          />
        </div>
        <div>
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
