import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSettings } from "@/lib/auth-guard";

// Renders the HTML with some dummy data for preview purposes
function renderPreviewHTML(bodyHtml: string) {
  // Replace common placeholders with dummy data
  return bodyHtml
    .replace(/\{\{\w*name\w*\}\}/gi, "John Doe")
    .replace(/\{\{\w*amount\w*\}\}/gi, "KES 10,500.00")
    .replace(/\{\{\w*date\w*\}\}/gi, "15 Oct 2024")
    .replace(/\{\{\w*orderNumber\w*\}\}/gi, "ORD-12345");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdminSettings();
    const { bodyHtml } = await req.json();

    const rendered = renderPreviewHTML(bodyHtml || "");

    return NextResponse.json({ html: rendered });
  } catch (error) {
    console.error("[PDF_PREVIEW_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdminSettings();
    const { slug } = await params;
    
    // Fallback if accessed via GET. Useful for the "Preview" button in the list page
    const template = await prisma.pdfTemplate.findUnique({ where: { slug } });
    
    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    const rendered = renderPreviewHTML(template.bodyHtml || "");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview: ${template.name}</title>
        <style>
          body {
            background-color: #f1f5f9;
            margin: 0;
            padding: 2rem;
            display: flex;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            background: white;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            padding: 2rem;
            box-sizing: border-box;
          }
          @media print {
            body {
              background: none;
              padding: 0;
            }
            .a4-page {
              box-shadow: none;
              width: 100%;
              min-height: auto;
              padding: 0;
            }
          }
        </style>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div class="a4-page prose prose-sm max-w-none">
          ${rendered}
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("[PDF_PREVIEW_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
