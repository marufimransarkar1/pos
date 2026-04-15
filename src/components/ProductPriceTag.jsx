// components/ProductPriceTag.jsx
import React, { forwardRef } from "react";
import Barcode from "react-barcode";

const ProductPriceTag = forwardRef(({ product, settings }, ref) => {
  const { name, barcode, description, sellingPrice, sku } = product;
  const sym = settings?.currencySymbol || "$";
  const taxRate = settings?.taxRate || 0;
  const shopName = settings?.businessName || "My Store";
  const taxLabel = settings?.taxName || "Tax";

  const priceWithTax = sellingPrice * (1 + taxRate);
  const barcodeValue = barcode || sku || "0000000000";

  const styles = {
    container: {
      width: "2.5in",
      padding: "0.15in",
      paddingTop: "0.3in", // ← top spacing preserved on page breaks
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      backgroundColor: "#ffffff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box",
      margin: "0 auto 0.2in auto", // ← bottom margin only (separates tags on same page)
      pageBreakInside: "avoid",
      breakInside: "avoid",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      textAlign: "center",
      marginBottom: "10px",
    },
    shopName: {
      fontSize: "16px",
      fontWeight: "700",
      margin: "0 0 2px",
      color: "#0f172a",
      letterSpacing: "-0.01em",
    },
    subHeader: {
      fontSize: "9px",
      color: "#64748b",
      margin: 0,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    productSection: {
      marginBottom: "8px",
    },
    productName: {
      fontSize: "16px",
      fontWeight: "600",
      margin: "0 0 4px",
      color: "#1e293b",
      lineHeight: 1.3,
    },
    description: {
      fontSize: "10px",
      color: "#475569",
      margin: "0 0 6px",
      lineHeight: 1.4,
    },
    priceRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      borderBottom: "1px dashed #cbd5e1",
      paddingBottom: "8px",
      marginBottom: "10px",
    },
    priceLabel: {
      fontSize: "11px",
      color: "#64748b",
      fontWeight: "500",
    },
    priceValue: {
      fontSize: "22px",
      fontWeight: "700",
      color: "#0f172a",
      letterSpacing: "-0.02em",
    },
    barcodeWrapper: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginTop: "4px",
      maxWidth: "100%",
      overflow: "hidden",
    },
    barcodeText: {
      fontSize: "10px",
      color: "#64748b",
      marginTop: "4px",
      letterSpacing: "1px",
      fontFamily: "monospace",
    },
    footer: {
      marginTop: "8px",
      fontSize: "8px",
      color: "#94a3b8",
      textAlign: "center",
      borderTop: "1px solid #f1f5f9",
      paddingTop: "6px",
    },
  };

  return (
    <div ref={ref} style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.shopName}>{shopName}</h2>
        <p style={styles.subHeader}>Price Tag</p>
      </div>

      <div style={styles.productSection}>
        <h3 style={styles.productName}>{name}</h3>
        {description && <p style={styles.description}>{description}</p>}
      </div>

      <div style={styles.priceRow}>
        <span style={styles.priceLabel}>Price (incl. {taxLabel})</span>
        <span style={styles.priceValue}>
          {sym}
          {priceWithTax.toFixed(2)}
        </span>
      </div>

      <div style={styles.barcodeWrapper}>
        <Barcode
          value={barcodeValue}
          format="CODE128"
          renderer="canvas" // 1. Change from SVG to Canvas for sharper lines
          width={2} // 2. Increased from 1.6 to 2 for thicker bars
          height={50} // 3. Slightly taller bars help scanners line up
          margin={10} // 4. Added "Quiet Zone" (white space) around the barcode
          background="#ffffff" // 5. Explicitly set pure white background
          lineColor="#000000" // 6. Explicitly set pure black bars
          displayValue={false}
        />
        <span style={styles.barcodeText}>{barcodeValue}</span>
      </div>

      <div style={styles.footer}>Thank you for shopping with us!</div>
    </div>
  );
});

ProductPriceTag.displayName = "ProductPriceTag";

export default ProductPriceTag;
