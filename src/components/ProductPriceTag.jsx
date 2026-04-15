// components/ProductPriceTag.jsx
import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';

const ProductPriceTag = forwardRef(({ product, settings }, ref) => {
  const { name, barcode, description, sellingPrice, sku } = product;
  const sym = settings?.currencySymbol || '$';
  const taxRate = settings?.taxRate || 0;
  const shopName = settings?.businessName || 'My Store';
  const taxLabel = settings?.taxName || 'Tax';

  const priceWithTax = sellingPrice * (1 + taxRate);
  const barcodeValue = barcode || sku || '0000000000';

  const styles = {
    container: {
      width: '2.5in', // This is quite narrow for 20+ characters
      padding: '0.1in',
      paddingTop: '0.2in',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box',
      margin: '0 auto 0.2in auto',
      pageBreakInside: 'avoid',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // Center everything
    },
    // ... (other styles remain similar, but ensure text doesn't overflow)
    productName: {
      fontSize: '14px',
      fontWeight: '700',
      textAlign: 'center',
      margin: '4px 0',
    },
    priceValue: {
      fontSize: '20px',
      fontWeight: '800',
      margin: '8px 0',
    },
    barcodeWrapper: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: '5px 0',
    }
  };

  return (
    <div ref={ref} style={styles.container}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '12px', margin: 0 }}>{shopName}</h2>
      </div>

      <h3 style={styles.productName}>{name}</h3>

      <div style={styles.priceValue}>
        {sym}{priceWithTax.toFixed(2)}
      </div>

      <div style={styles.barcodeWrapper}>
        <Barcode
          value={barcodeValue}
          format="CODE128"
          renderer="img"      // 'img' is best for mobile printing compatibility
          width={1.2}         // REDUCED: Allows more characters to fit without blurring
          height={40}         // Sufficient height for scanning
          margin={0}
          background="#ffffff"
          lineColor="#000000"
          displayValue={false}
        />
        <span style={{ fontSize: '9px', fontFamily: 'monospace', marginTop: '4px' }}>
          {barcodeValue}
        </span>
      </div>

      <div style={{ fontSize: '8px', marginTop: '8px', color: '#94a3b8' }}>
        Thank you!
      </div>
    </div>
  );
});

ProductPriceTag.displayName = 'ProductPriceTag';

export default ProductPriceTag;