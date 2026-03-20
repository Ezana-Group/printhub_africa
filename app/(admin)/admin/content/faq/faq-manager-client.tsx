"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";

type Category = {
  id: string;
  name: string;
  slug: string;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
    isPopular: boolean;
  }>;
};

export function FaqManagerClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const questions = initialCategories.flatMap((c) =>
    c.faqs.map((f) => ({ ...f, categoryName: c.name, categoryId: c.id }))
  );
  const filtered =
    categoryFilter === "all"
      ? questions
      : questions.filter((q) => q.categoryId === categoryFilter);

  const openAdd = () => {
    setEditingId(null);
    setCategoryId(initialCategories[0]?.id ?? "");
    setQuestion("");
    setAnswer("");
    setIsPopular(false);
    setIsActive(true);
    setSheetOpen(true);
  };

  const openEdit = (faq: (typeof questions)[0]) => {
    setEditingId(faq.id);
    setCategoryId(faq.categoryId);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsPopular(faq.isPopular);
    setIsActive(faq.isActive);
    setSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || !categoryId) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/content/faq/questions/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId,
            question: question.trim(),
            answer: answer.trim(),
            isPopular,
            isActive,
          }),
        });
        if (!res.ok) throw new Error("Failed");
      } else {
        const res = await fetch("/api/admin/content/faq/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId,
            question: question.trim(),
            answer: answer.trim(),
            isPopular,
            isActive,
          }),
        });
        if (!res.ok) throw new Error("Failed");
      }
      router.refresh();
      setSheetOpen(false);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/content/faq/questions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Category:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="all">All</option>
          {initialCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}>+ Add question</Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit question" : "Add question"}</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <Label>Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  required
                >
                  {initialCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Question</Label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Answer (HTML allowed)</Label>
                <div className="mt-1">
                  <SmartTextEditor
                    value={answer}
                    onChange={setAnswer}
                    placeholder="Rich text / markdown"
                    minHeight="200px"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                />
                <Label htmlFor="popular">Mark as popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Question</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Popular</th>
              <th className="text-left p-3 font-medium">Active</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 max-w-xs truncate">{f.question}</td>
                <td className="p-3 text-muted-foreground">{f.categoryName}</td>
                <td className="p-3">{f.isPopular ? "Yes" : ""}</td>
                <td className="p-3">{f.isActive ? "Yes" : "No"}</td>
                <td className="p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(f)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(f.id)}
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
