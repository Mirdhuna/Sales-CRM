import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateQuotePdf = (quote) => {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("QUOTE", 14, 20);

    doc.setFontSize(11);
    doc.text(`Topic: ${quote.topic}`, 14, 35);
    doc.text(`Status: ${quote.status}`, 14, 42);

    autoTable(doc, {
        startY: 55,
        head: [[
            "Product",
            "Qty",
            "Price",
            "Discount",
            "Tax",
            "Total"
        ]],
        body: quote.products.map(p => [
            p.product_name,
            p.quantity,
            p.price_per_unit,
            p.manual_discount,
            p.tax_amount,
            (
                p.quantity * p.price_per_unit
                - p.manual_discount
                + p.tax_amount
            ).toFixed(2)
        ])
    });

    doc.text(
        `Grand Total: ${quote.total_amount}`,
        14,
        doc.lastAutoTable.finalY + 20
    );

    doc.save(`Quote-${quote.quote_id}.pdf`);
};