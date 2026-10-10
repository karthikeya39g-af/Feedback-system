
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// Note: jsPDF in Node might require a polyfill for some browser basics if not using a specific node build, 
// but often works for basic text. If 'jspdf' fails in node, we might need 'jspdf/dist/jspdf.node.min.js' 
// or similar. Let's try standard import first. 
// Actually, standard jsPDF is often browser-only. 
// Let's check if we can use it. If not, we might need to use a different approach or rely on 'docx' which works in Node.
// 'docx' is safer for Node environment. Let's produce a DOCX and a PDF if possible, or just DOCX and ask user to convert?
// The user ASKED for PDF. 
// Let's try to use jspdf. usually `new jsPDF()` works in node if we verify the import.
// require('jspdf') usually returns the constructor.

// Let's assume ES modules are enabled or we use CommonJS. The project seems to use "type": "module" ? 
// Checking package.json... it doesn't say "type": "module", but vite uses ES6. 
// server/index.js likely uses CommonJS or ES6? 
// Let's use CommonJS for the script to be safe with `node`.

// Wait, file extensions in this project are .js and use `import` (e.g. reportGenerator.js).
// But `reportGenerator.js` is frontend code (src/).
// `server/index.js` likely uses `require`. I should check `server/index.js` to see the module system used in backend files.
// However, I'll write this script as a standalone. I'll try ES6 import first (mjs) or standard require.

const generatePdf = () => {
    try {
        const doc = new jsPDF();
        const content = fs.readFileSync('System_Documentation.md', 'utf8');
        const lines = content.split('\n');

        let y = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const pageWidth = doc.internal.pageSize.width;
        const localMaxWidth = pageWidth - (margin * 2);

        doc.setFont("helvetica", "normal");

        lines.forEach((line) => {
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }

            // Headers
            if (line.startsWith('# ')) {
                doc.setFontSize(24);
                doc.setFont("helvetica", "bold");
                const text = line.replace('# ', '');
                const splitText = doc.splitTextToSize(text, localMaxWidth);
                doc.text(splitText, margin, y);
                y += (splitText.length * 10) + 5;
            }
            else if (line.startsWith('## ')) {
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                const text = line.replace('## ', '');
                const splitText = doc.splitTextToSize(text, localMaxWidth);
                doc.text(splitText, margin, y);
                y += (splitText.length * 8) + 5;
            }
            else if (line.startsWith('### ')) {
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                const text = line.replace('### ', '');
                const splitText = doc.splitTextToSize(text, localMaxWidth);
                doc.text(splitText, margin, y);
                y += (splitText.length * 7) + 3;
            }
            // List Items
            else if (line.startsWith('- ')) {
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                const text = '• ' + line.replace('- ', '');
                const splitText = doc.splitTextToSize(text, localMaxWidth - 5);
                doc.text(splitText, margin + 5, y);
                y += (splitText.length * 6) + 2;
            }
            // Normal Text
            else if (line.trim().length > 0) {
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                const splitText = doc.splitTextToSize(line, localMaxWidth);
                doc.text(splitText, margin, y);
                y += (splitText.length * 6) + 2;
            }
            // Empty Lines
            else {
                y += 5;
            }
        });

        doc.save('FeedbackSystem_Documentation.pdf');
        console.log("PDF generated successfully: FeedbackSystem_Documentation.pdf");
    } catch (e) {
        console.error("Error generating PDF:", e);
    }
}

generatePdf();
