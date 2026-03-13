import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8 },
  meta: { fontSize: 9, color: "#666", marginBottom: 12 },
  sectionTitle: { fontSize: 12, marginTop: 14, marginBottom: 6 },
  body: { fontSize: 10, marginBottom: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#888" },
});

export type QuotePDFData = {
  businessName: string;
  businessAddress: string;
  quoteNumber: string;
  typeLabel: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  projectName: string | null;
  description: string | null;
  quotedAmount: number | null;
  quoteBreakdown: string | null;
  validityDays: number | null;
};

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const d = data;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{d.businessName}</Text>
        <Text style={styles.meta}>{d.businessAddress}</Text>

        <Text style={styles.sectionTitle}>QUOTATION</Text>
        <Text style={styles.meta}>Quote # {d.quoteNumber} · {d.typeLabel} · Date: {d.date}</Text>

        <Text style={styles.sectionTitle}>Prepared for</Text>
        <Text style={styles.body}>{d.customerName}</Text>
        <Text style={styles.body}>{d.customerEmail}</Text>
        {d.customerPhone && <Text style={styles.body}>{d.customerPhone}</Text>}

        {d.projectName && (
          <>
            <Text style={styles.sectionTitle}>Project</Text>
            <Text style={styles.body}>{d.projectName}</Text>
          </>
        )}
        {d.description && (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{d.description}</Text>
          </>
        )}
        {d.quotedAmount != null && d.quotedAmount > 0 && (
          <>
            <Text style={styles.sectionTitle}>Quote total</Text>
            <Text style={styles.body}>KES {d.quotedAmount.toLocaleString()}</Text>
          </>
        )}
        {d.quoteBreakdown && (
          <>
            <Text style={styles.sectionTitle}>Breakdown</Text>
            <Text style={styles.body}>{d.quoteBreakdown}</Text>
          </>
        )}
        {d.validityDays != null && d.validityDays > 0 && (
          <Text style={[styles.meta, { marginTop: 16 }]}>Valid for {d.validityDays} days from date of issue.</Text>
        )}

        <Text style={styles.footer} fixed>
          {d.businessName} · This quotation is valid as per the terms above.
        </Text>
      </Page>
    </Document>
  );
}
