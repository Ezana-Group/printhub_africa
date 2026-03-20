"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Heading2,
  Minus,
  Quote,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export interface SmartTextEditorHandle {
  insertText: (text: string) => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const iconSize = 16;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5 bg-muted/30">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough size={iconSize} />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading"
      >
        <Heading2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <Minus size={iconSize} />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        onClick={setLink}
        active={editor.isActive("link")}
        title="Link"
      >
        <LinkIcon size={iconSize} />
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={iconSize} />
      </ToolbarButton>
    </div>
  );
}

export const SmartTextEditor = forwardRef<SmartTextEditorHandle, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Write your message…", minHeight = "180px" }, ref) => {
    const [mode, setMode] = useState<"rich" | "html">("rich");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (mode === "rich" && editor) {
          editor.chain().focus().insertContent(text).run();
        } else if (mode === "html" && textareaRef.current) {
          const el = textareaRef.current;
          const start = el.selectionStart ?? 0;
          const end = el.selectionEnd ?? 0;
          const current = el.value;
          const next = current.slice(0, start) + text + current.slice(end);
          onChange(next);
          // Set cursor position after insertion
          setTimeout(() => {
            const pos = start + text.length;
            el.setSelectionRange(pos, pos);
            el.focus();
          }, 0);
        }
      },
    }));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-3 py-2`,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync external value changes (e.g. after send clears the field)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (!value) {
        editor.commands.clearContent();
      } else {
        // Only update if it's actually different to avoid cursor jumps
        const currentHtml = editor.getHTML();
        if (value !== currentHtml && value !== "<p></p>" && currentHtml !== "<p></p>") {
             let selection;
             try { selection = editor.state.selection; } catch {}
             editor.commands.setContent(value, { emitUpdate: false });
             if (selection) {
                try { editor.commands.setTextSelection(selection); } catch {}
             }
        }
      }
    }
  }, [value, editor]);

  return (
    <div className="rounded-md border bg-background overflow-hidden flex flex-col">
      <div className="flex items-center justify-between border-b bg-muted/10 px-2 pr-4">
        {mode === "rich" && editor ? (
          <Toolbar editor={editor} />
        ) : (
          <div className="py-2.5 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Raw HTML Editor
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("rich")}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium border ${
              mode === "rich"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium border ${
              mode === "html"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            HTML
          </button>
        </div>
      </div>
      
      {mode === "rich" ? (
        editor ? <EditorContent editor={editor} /> : null
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-y p-3 outline-none font-mono text-sm"
          style={{ minHeight }}
          spellCheck={false}
        />
      )}
    </div>
  );
});

SmartTextEditor.displayName = "SmartTextEditor";
