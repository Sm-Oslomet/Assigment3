# Invoice Studio

A simple static invoice generator built with Vite, vanilla JavaScript and jsPDF for an AI-assisted development assignment. Enter a customer, create invoice line items, calculate totals and download an invoice as a PDF. Seller settings and the next invoice number are kept in the browser's localStorage.

## Requirements
- Node.js 22 or later (with npm)
- VS Code or another text editor

## Run locally
```powershell
npm install
npm run dev
```
Open the URL shown by Vite (usually http://localhost:5173).

## Test production build
```powershell
npm run build
npm run preview
```

## Features
- Seller/company settings that persist in the current browser
- Customer name, address and optional email
- Invoice and delivery dates, due date and location
- Add/remove line items; automatic subtotal, VAT and total
- PDF download with invoice details and bank account
- Local incrementing invoice number after PDF generation
- Mobile-friendly layout

## Publish to GitHub Pages
1. Create a new public repository on GitHub (do not initialize with a README).
2. In the VS Code terminal from this project folder, run:
```powershell
git init
git add .
git commit -m "Build invoice generator prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```
3. On GitHub, open **Settings → Pages → Build and deployment** and choose **GitHub Actions** as the source.
4. Check **Actions** for the automated build/deploy. The generated Pages URL is your demo link.

The included `.github/workflows/deploy.yml` runs the build and deployment after pushes to `main`.

## Demo checklist
1. Open **Company settings**, enter **fictional/sample company details**, save.
2. Enter a fictional customer and address.
3. Add two items with quantities and unit prices. Check the total changes.
4. Select a VAT rate only when appropriate to your example.
5. Click **Create & download PDF** and open the downloaded file.
6. Reload the page; saved company settings remain.

## Important limitations
This is an **educational prototype, not accounting software**. Invoice numbers and seller settings are stored in localStorage. They may be reset, deleted, or duplicated across browsers and devices; there is no immutable invoice ledger, archival mechanism, customer database, correction/credit-note process, audit history, EHF, or regulatory compliance guarantee. Export or securely archive real invoices elsewhere, and use appropriate certified/validated accounting software for real business invoicing. User-entered details are not transmitted to an application server, but anyone using the same browser profile may access locally saved settings. Do not publish real customer/company/bank data in GitHub or demo recordings. Ensure VAT rates and obligations are verified independently; VAT is not automatically assessed.

## Assignment description
**Invoice Studio** is a lightweight web application for generating PDF invoices. Users can store their seller details, enter customer information, add multiple products/services with prices and quantities, calculate invoice totals, and download a finished invoice. The project demonstrates how generative AI can help develop, test and iterate on a practical application without a backend.

## AI development note
The initial app structure and functionality were generated with AI assistance, then can be reviewed, tested and refined manually. In your submission, describe the AI prompts and modifications you actually made; do not claim testing you did not perform.
