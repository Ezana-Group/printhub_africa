"use client";

import { useState } from "react";

export function JsonViewer({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return <span className="text-muted-foreground text-xs italic">No details</span>;

  const jsonString = JSON.stringify(data, null, 2);
  const isShort = jsonString.length < 50;

  if (isShort) {
    return <pre className="text-xs font-mono bg-muted/30 p-1.5 rounded">{jsonString}</pre>;
  }

  return (
    <div>
      <button 
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium text-primary hover:underline"
      >
        {expanded ? "Hide Details" : "View Details"}
      </button>
      {expanded && (
        <pre className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded-md overflow-x-auto max-w-[300px] border">
          {jsonString}
        </pre>
      )}
    </div>
  );
}
