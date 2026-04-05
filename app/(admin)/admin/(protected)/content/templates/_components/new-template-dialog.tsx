"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";

// Interface not used anymore but keeping for backwards comp just in case
interface NewTemplateDialogProps {}

export function NewTemplateDialog({ defaultType = "email" }: { defaultType?: "email" | "whatsapp" | "pdf" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<"email" | "whatsapp" | "pdf">(defaultType);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "UTILITY",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === "email") {
        const res = await fetch(`/api/admin/content/templates/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            subject: `New ${formData.name}`,
            bodyHtml: `<div><p>Hello {{firstName}},</p><p>This is a new template.</p></div>`,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create email template");
        setOpen(false);
        router.push(`/admin/content/email-templates/${formData.slug}`);
      } else if (type === "whatsapp") {
        const res = await fetch(`/api/admin/content/templates/whatsapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            category: formData.category,
            bodyText: `Hello {{firstName}}, this is a new message.`,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create WhatsApp template");
        setOpen(false);
        router.push(`/admin/content/templates/whatsapp/${formData.slug}`);
      } else if (type === "pdf") {
        const res = await fetch(`/api/admin/content/templates/pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            bodyHtml: `<div className="pdf-body"><h1>${formData.name}</h1><p>Body content...</p></div>`,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create PDF template");
        setOpen(false);
        router.push(`/admin/content/pdf-templates/${formData.slug}`);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setFormData(prev => ({ ...prev, name, slug }));
  };

  // Update internal type state when defaultType prop changes
  useEffect(() => {
    setType(defaultType);
  }, [defaultType]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Select the type of template to create and provide basic details. You can design the content in the next step.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="space-y-2">
              <Label>Template Type</Label>
              <div className="flex gap-2">
                {(["email", "whatsapp", "pdf"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${type === t ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {t === "email" ? "Email" : t === "whatsapp" ? "WhatsApp" : "PDF"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Order Confirmation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (Unique ID)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="font-mono text-sm bg-slate-50"
                  placeholder="order-confirmation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Internal description for this template..."
                  className="resize-none h-20"
                />
              </div>

              {type === "whatsapp" && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    options={[
                      { value: "UTILITY", label: "Utility" },
                      { value: "MARKETING", label: "Marketing" },
                      { value: "AUTHENTICATION", label: "Authentication" },
                    ]}
                    placeholder="Select Category"
                  />
                  <p className="text-[11px] text-slate-500">WhatsApp requires templates to be categorized for billing.</p>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <DialogFooter className="mt-6 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to editor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
