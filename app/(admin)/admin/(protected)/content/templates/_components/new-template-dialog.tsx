"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";

interface NewTemplateDialogProps {
  type: "email" | "whatsapp";
}

export function NewTemplateDialog({ type }: NewTemplateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    subject: "",
    body: "",
    category: "UTILITY",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = `/api/admin/content/templates/${type}`;
      const body = type === "email" 
        ? { 
            name: formData.name, 
            slug: formData.slug, 
            description: formData.description, 
            subject: formData.subject, 
            bodyHtml: formData.body 
          }
        : { 
            name: formData.name, 
            slug: formData.slug, 
            description: formData.description, 
            category: formData.category, 
            bodyText: formData.body 
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to create ${type} template`);
      }

      setOpen(false);
      router.refresh();
      // Reset form
      setFormData({ name: "", slug: "", description: "", subject: "", body: "", category: "UTILITY" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setFormData(prev => ({ ...prev, name, slug }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New {type === "email" ? "Email" : "WhatsApp"} Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New {type === "email" ? "Email" : "WhatsApp"} Template</DialogTitle>
            <DialogDescription>
              Add a new automated {type} message template. Slugs must be unique.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Order Confirmation"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="col-span-3 font-mono text-xs"
                placeholder="order-confirmation"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Optional description"
              />
            </div>
            
            {type === "email" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="col-span-3"
                  placeholder="Email subject line"
                  required
                />
              </div>
            )}

            {type === "whatsapp" && (
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <div className="col-span-3">
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
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right pt-2">
                {type === "email" ? "HTML Body" : "Message Text"}
              </Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                className="col-span-3 min-h-[150px] font-mono text-xs"
                placeholder={type === "email" ? "<div>Hello {{name}}...</div>" : "Hello {{name}}, your order..."}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
