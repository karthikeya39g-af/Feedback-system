
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

// Helper to format date
const formatDate = () => new Date().toISOString().split('T')[0];

/**
 * Generate PDF Report
 * @param {Array} columns - Array of column titles
 * @param {Array} data - Array of arrays (rows) matching columns
 * @param {String} title - Title of the report
 * @param {String} fileName - Name of the file to save
 */
// Helper to load image as base64 and get dimensions
const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({
                dataUrl: canvas.toDataURL('image/png'),
                width: img.width,
                height: img.height
            });
        };
        img.onerror = (e) => {
            console.error("Image load error for url:", url, e);
            reject(e);
        };
    });
};

/**
 * Generate PDF Report
 */
export const generatePDF = async (columns, data, title, fileName) => {
    try {
        const doc = new jsPDF('l');

        // Add Logo
        try {
            const { dataUrl, width, height } = await loadImage('/nnrglogo.png');

            // Calculate dimensions to fit page width (minus margins)
            const margin = 10;
            const pageWidth = doc.internal.pageSize.getWidth();
            const maxImgWidth = pageWidth - (margin * 2);
            const ratio = maxImgWidth / width;
            const imgWidth = width * ratio;
            const imgHeight = height * ratio;

            doc.addImage(dataUrl, 'PNG', margin, 10, imgWidth, imgHeight);

            // Adjust start Y for text based on image height
            var currentY = 10 + imgHeight + 10;
        } catch (e) {
            console.warn("Logo load failed", e);
            var currentY = 20;
        }

        // Header Text - Removed as requested
        /*
        doc.setFontSize(16);
        doc.setTextColor(40);
        // Adjust text position based on logo, or keep fixed if logo is small enough
        doc.text("Nalla Narasimha Reddy Education Society's Group of Institutions", 40, 18); // Check if this overlaps
        doc.setFontSize(14);
        doc.text("Department of Data Science", 40, 25);
        */

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(title, 14, currentY);

        doc.setFontSize(10);
        doc.text(`Generated on: ${formatDate()}`, 14, currentY + 6);

        // Main Table
        autoTable(doc, {
            head: [columns],
            body: data,
            startY: 50,
            theme: 'grid',
            styles: { fontSize: 8, cellWidth: 'wrap' },
            headStyles: { fillColor: [66, 66, 66] },
            columnStyles: {
                [columns.length - 1]: { cellWidth: 'auto' }
            }
        });

        doc.save(`${fileName}.pdf`);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert(`Failed to generate PDF: ${error.message}`);
    }
};

/**
 * Generate Excel Report
 */
export const generateExcel = (data, fileName) => {
    // Create Header Rows
    const header = [
        // ["Nalla Narasimha Reddy Education Society's Group of Institutions"],
        // ["Department of Data Science"],
        [fileName.replace(/_/g, ' ')], // Title from filename
        [`Generated on: ${formatDate()}`],
        [] // Empty row
    ];

    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add Header
    XLSX.utils.sheet_add_aoa(worksheet, header, { origin: "A1" });

    // Add Data starting from A6
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A6", skipHeader: false });

    // Auto-adjust column width
    const wscols = Object.keys(data[0] || {}).map(k => ({ wch: 25 }));
    // Comments wider
    const commentsIdx = Object.keys(data[0] || {}).indexOf('Comments');
    if (commentsIdx !== -1) wscols[commentsIdx] = { wch: 60 };

    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Generate Word Document
 */
export const generateWord = async (columns, data, title, fileName) => {
    try {
        let titleChildren = [
            /*
            new TextRun({ text: "Nalla Narasimha Reddy Education Society's Group of Institutions", bold: true, size: 28, break: 1 }),
            new TextRun({ text: "Department of Data Science", bold: true, size: 24, break: 1 }),
            */
            new TextRun({ text: title, bold: true, size: 24, break: 1 }), // Reduced break
            new TextRun({ text: `Generated on: ${formatDate()}`, size: 20, break: 1 }),
        ];

        try {
            console.log("Attempting to load logo for Word...");
            const { dataUrl, width, height } = await loadImage('/nnrglogo.png');
            // Fetch blob from data URL
            const res = await fetch(dataUrl);
            const buff = await res.arrayBuffer();

            // Calculate dimensions preserving aspect ratio for Word (roughly 96dpi)
            // Target full width approx 550pt
            const maxW = 550;
            const ratio = maxW / width;
            const finalW = width * ratio;
            const finalH = height * ratio;


            const imageRun = new ImageRun({
                data: buff,
                transformation: { width: finalW, height: finalH },
                type: "png"
            });

            // Prepend image to children
            titleChildren = [imageRun, ...titleChildren];
        } catch (e) {
            console.warn("Word logo failed", e);
        }

        const children = [
            new Paragraph({
                children: titleChildren,
                spacing: { after: 400, alignment: "center" },
            })
        ];

        // Table similar to before
        const tableHeader = new TableRow({
            children: columns.map(col => new TableCell({
                width: { size: 100 / columns.length, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ text: col, bold: true })],
                shading: { fill: "E0E0E0" }
            })),
        });

        const tableRows = data.map(row => new TableRow({
            children: row.map(cell => new TableCell({
                width: { size: 100 / columns.length, type: WidthType.PERCENTAGE },
                children: [new Paragraph(String(cell || '-'))],
            })),
        }));

        children.push(new Table({
            rows: [tableHeader, ...tableRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        }));

        const doc = new Document({
            sections: [{ properties: {}, children }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fileName}.docx`);
    } catch (e) {
        console.error("Word Gen Error", e);
        alert("Failed to generate Word doc");
    }
};
