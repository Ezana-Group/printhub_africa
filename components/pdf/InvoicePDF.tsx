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
  title: { fontSize: 18, marginBottom: 8 },
  meta: { fontSize: 9, color: "#666", marginBottom: 20 },
  sectionTitle: { fontSize: 12, marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4, fontSize: 10 },
  cell: { flex: 1 },
  cellRight: { flex: 1, textAlign: "right" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 4, marginBottom: 4, fontSize: 9, fontWeight: "bold" },
  totals: { marginTop: 16, marginLeft: "auto", width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4, fontSize: 10 },
  totalLast: { flexDirection: "row", justifyContent: "space-between", fontSize: 12, fontWeight: "bold", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 6, marginTop: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#888" },
});

export type InvoicePDFData = {
  businessName: string;
  businessAddress: string;
  kraPin: string | null;
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  billTo: string;
  billToEmail: string;
  billToAddress: string;
  items: { name: string; qty: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  vatAmount: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  vatOnInvoices: boolean;
};

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const d = data;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{d.businessName}</Text>
        <Text style={styles.meta}>{d.businessAddress}</Text>
        {d.kraPin && <Text style={styles.meta}>KRA PIN: {d.kraPin}</Text>}

        <Text style={styles.sectionTitle}>TAX INVOICE</Text>
        <Text style={styles.meta}>Invoice # {d.invoiceNumber} · Order # {d.orderNumber} · Date: {d.date}</Text>

        <Text style={styles.sectionTitle}>Bill to</Text>
        <Text style={styles.meta}>{d.billTo}</Text>
        <Text style={styles.meta}>{d.billToEmail}</Text>
        <Text style={styles.meta}>{d.billToAddress}</Text>

        <View style={styles.tableHeader}>
          <View style={[styles.cell, { flex: 2 }]}><Text>Description</Text></View>
          <View style={styles.cellRight}><Text>Qty</Text></View>
          <View style={styles.cellRight}><Text>Unit (KES)</Text></View>
          <View style={styles.cellRight}><Text>Amount (KES)</Text></View>
        </View>
        {d.items.map((row, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.cell, { flex: 2 }]}><Text>{row.name}</Text></View>
            <View style={styles.cellRight}><Text>{row.qty}</Text></View>
            <View style={styles.cellRight}><Text>{row.unitPrice.toLocaleString()}</Text></View>
            <View style={styles.cellRight}><Text>{row.lineTotal.toLocaleString()}</Text></View>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}><Text>Subtotal</Text><Text>{d.subtotal.toLocaleString()}</Text></View>
          {d.vatOnInvoices && <View style={styles.totalRow}><Text>VAT (16%)</Text><Text>{d.vatAmount.toLocaleString()}</Text></View>}
          {d.shippingCost > 0 && <View style={styles.totalRow}><Text>Shipping</Text><Text>{d.shippingCost.toLocaleString()}</Text></View>}
          {d.discount > 0 && <View style={styles.totalRow}><Text>Discount</Text><Text>-{d.discount.toLocaleString()}</Text></View>}
          <View style={styles.totalLast}><Text>Total</Text><Text>KES {d.totalAmount.toLocaleString()}</Text></View>
        </View>

        <Text style={styles.footer} fixed>
          {d.businessName} · This is a computer-generated tax invoice.
        </Text>
      </Page>
    </Document>
  );
}
