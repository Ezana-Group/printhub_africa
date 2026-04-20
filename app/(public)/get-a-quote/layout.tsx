import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get a 3D Printing Quote Kenya | PrintHub",
  description:
    "Upload your STL, OBJ, 3MF, or STEP files and get a fast 3D printing quote in Kenya. FDM and resin printing with nationwide delivery.",
  keywords: [
    "3D printing quote Kenya",
    "3D printing quote Nairobi",
    "upload STL Kenya",
    "rapid prototyping quote Kenya",
    "resin printing quote Kenya",
    "FDM printing quote Kenya",
  ],
  alternates: {
    canonical: "/get-a-quote",
  },
  openGraph: {
    title: "Get a 3D Printing Quote Kenya | PrintHub",
    description:
      "Request a custom 3D printing quote in Kenya. Upload your model files and receive pricing quickly.",
    url: "/get-a-quote",
  },
};

const QUOTE_FAQ = [
  {
    question: "How fast can I get a 3D printing quote in Kenya?",
    answer:
      "Most quote requests are reviewed within 2 business hours during working hours. Complex multi-part jobs can take slightly longer.",
  },
  {
    question: "Which file types can I upload for a 3D print quote?",
    answer:
      "You can upload STL, OBJ, 3MF, STEP, and related 3D model formats directly in the quote form.",
  },
  {
    question: "Do you deliver 3D printed orders outside Nairobi?",
    answer:
      "Yes. PrintHub delivers across Kenya, with same-day or next-day options in Nairobi depending on the job and timeline.",
  },
];

export default function GetAQuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: QUOTE_FAQ.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
      {children}
    </>
  );
}
