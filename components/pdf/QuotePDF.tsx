import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  brand: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  meta: { fontSize: 9, color: "#64748b", marginBottom: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", marginTop: 24, marginBottom: 8, color: "#1e293b", textTransform: "uppercase" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f1f5f9", paddingVertical: 8, fontSize: 10 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: "#334155", paddingBottom: 6, marginBottom: 4, fontSize: 9, fontWeight: "bold", color: "#475569" },
  cellDescription: { flex: 3 },
  cellRight: { flex: 1, textAlign: "right" },
  totalsContainer: { marginTop: 30, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, fontSize: 10, color: "#475569" },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", fontSize: 14, fontWeight: "bold", color: "#0f172a", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10, marginTop: 6 },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, fontSize: 8, color: "#94a3b8", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#f1f5f9", paddingTop: 10 },
  validity: { fontSize: 9, color: "#ef4444", marginTop: 20, fontWeight: "bold" },
});

export type QuotePDFData = {
  businessName: string;
  businessAddress: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  items: { 
    description: string; 
    quantity: number; 
    unitPrice: number; 
    total: number;
    notes?: string;
  }[];
  subtotal: number;
  taxAmount: number;
  shippingEstimate: number;
  grandTotal: number;
  includeTax: boolean;
};

export function QuotePDF({ data }: { data: QuotePDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{data.businessName}</Text>
            <Text style={styles.meta}>{data.businessAddress}</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>PRO-FORMA QUOTE</Text>
            <Text style={styles.meta}>Quote #: {data.quoteNumber}</Text>
            <Text style={styles.meta}>Date: {data.date}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Quotation For</Text>
          <Text style={[styles.meta, { color: "#1e293b", fontWeight: "bold", fontSize: 11 }]}>{data.customerName}</Text>
          <Text style={styles.meta}>{data.customerEmail}</Text>
          <Text style={styles.meta}>{data.customerAddress}</Text>
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <View style={styles.cellDescription}><Text>Description</Text></View>
          <View style={styles.cellRight}><Text>Qty</Text></View>
          <View style={styles.cellRight}><Text>Unit Price</Text></View>
          <View style={styles.cellRight}><Text>Total (KES)</Text></View>
        </View>

        {data.items.map((item, index) => (
          <View key={index} style={styles.row}>
            <View style={styles.cellDescription}>
              <Text style={{ fontWeight: "bold" }}>{item.description}</Text>
              {item.notes && <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>{item.notes}</Text>}
            </View>
            <View style={styles.cellRight}><Text>{item.quantity}</Text></View>
            <View style={styles.cellRight}><Text>{item.unitPrice.toLocaleString()}</Text></View>
            <View style={styles.cellRight}><Text>{item.total.toLocaleString()}</Text></View>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>KES {data.subtotal.toLocaleString()}</Text>
          </View>
          {data.includeTax && (
            <View style={styles.totalRow}>
              <Text>VAT (16%)</Text>
              <Text>{data.taxAmount.toLocaleString()}</Text>
            </View>
          )}
          {data.shippingEstimate > 0 && (
            <View style={styles.totalRow}>
              <Text>Est. Shipping</Text>
              <Text>{data.shippingEstimate.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text>Total Estimate</Text>
            <Text>KES {data.grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.validity}>This quote is valid until: {data.validUntil}</Text>
        
        <View style={{ marginTop: 20 }}>
            <Text style={[styles.meta, { color: "#475569", lineHeight: 1.5 }]}>
                Notes: Prices are inclusive of all standard printing charges. Design modifications requested after approval may incur additional costs. Production begins only after a 50% deposit or full payment is confirmed.
            </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          {data.businessName} · This is a computer-generated quotation and does not constitute a tax invoice. All orders are subject to our standard terms and conditions.
        </Text>
      </Page>
    </Document>
  );
}
