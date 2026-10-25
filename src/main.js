import { jsPDF } from 'jspdf';
import './style.css';

const SETTINGS_KEY = 'invoice-studio-company-v1';
const COUNTER_KEY = 'invoice-studio-next-number-v1';
const $ = (selector) => document.querySelector(selector);
const today = () => new Date().toLocaleDateString('en-CA');
const dueInDays = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (n) => new Intl.NumberFormat('nb-NO', {minimumFractionDigits:2, maximumFractionDigits:2}).format(n) + ' kr';
const savedCompany = (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; } })();
const initialNumber = Number.parseInt(localStorage.getItem(COUNTER_KEY) || '1001', 10);
let nextNumber = Number.isSafeInteger(initialNumber) && initialNumber > 0 ? initialNumber : 1001;
let items = [{description:'',quantity:1,price:''}];
const companyFields = ['companyName','orgNumber','companyAddress','companyPostal','companyEmail','companyPhone','bankAccount'];

$('#app').innerHTML = `
<header class="topbar"><div class="shell topbar-content"><div class="brand"><span class="brandmark">▤</span><div>Invoice<span class="brandlight">Studio</span><small>Simple invoicing, beautifully done.</small></div></div><span class="status">● Local workspace</span></div></header>
<main class="shell">
<div class="heading"><div><p class="eyebrow">INVOICE WORKSPACE</p><h1>Create an invoice</h1><p class="subheading">Fill in the details, check your totals, and download your PDF.</p></div><button type="button" class="btn btn-outline" id="settingsToggle">⚙ Company settings</button></div>
<div id="notice" role="status" aria-live="polite"></div>
<section class="panel settings-panel hidden" id="settingsPanel"><div class="panelhead"><div><h2>Your company details</h2><p>Saved on this device and automatically added to your invoices.</p></div><button type="button" class="icon-btn" id="closeSettings" aria-label="Close settings">✕</button></div>
<div class="form-grid">
<label>Company / seller name <span>*</span><input id="companyName" autocomplete="organization" placeholder="Your Company AS"/></label>
<label>Organization number<input id="orgNumber" placeholder="123 456 789"/></label>
<label>Street address <span>*</span><input id="companyAddress" placeholder="Company street 1"/></label>
<label>Postal code and city <span>*</span><input id="companyPostal" placeholder="0150 Oslo"/></label>
<label>Email<input id="companyEmail" type="email" placeholder="billing@example.com"/></label>
<label>Phone<input id="companyPhone" placeholder="+47 123 45 678"/></label>
<label>Bank account number <span>*</span><input id="bankAccount" placeholder="1234.56.78901"/></label>
</div><div class="buttonline"><button type="button" class="btn btn-primary" id="saveSettings">Save company details</button><span class="helper">Use sample data only when sharing a demo.</span></div></section>
<div class="layout"><div class="stack">
<section class="panel"><div class="panelhead"><div><div class="step">01 / DETAILS</div><h2>Invoice information</h2></div></div><div class="form-grid"><label>Invoice number <span>*</span><input id="invoiceNumber" readonly title="Automatically allocated after a successful PDF download"/></label><label>Invoice date <span>*</span><input id="invoiceDate" type="date"/></label><label>Due date <span>*</span><input id="dueDate" type="date"/></label><label>Delivery date <span>*</span><input id="deliveryDate" type="date"/></label><label class="span2">Delivery location<input id="deliveryLocation" placeholder="Oslo / online / at customer location"/></label></div></section>
<section class="panel"><div class="panelhead"><div><div class="step">02 / CUSTOMER</div><h2>Bill to</h2></div></div><div class="form-grid"><label>Customer name <span>*</span><input id="customerName" placeholder="Customer or business name"/></label><label>Customer number (optional)<input id="customerNumber" placeholder="e.g. 10025"/></label><label>Customer email<input id="customerEmail" type="email" placeholder="customer@example.com"/></label><label class="span2">Street address <span>*</span><input id="customerAddress" placeholder="Customer street 5"/></label><label class="span2">Postal code and city <span>*</span><input id="customerPostal" placeholder="5003 Bergen"/></label></div></section>
<section class="panel"><div class="panelhead"><div><div class="step">03 / ITEMS</div><h2>Products & services</h2></div><span class="lightpill" id="itemCount">1 item</span></div><div class="items-head"><span>Description</span><span>Quantity</span><span>Unit price (NOK)</span><span></span></div><div id="items"></div><button type="button" class="add-btn" id="addItem">+ Add another item</button><div class="taxrow"><label for="vatRate">VAT rate (only if applicable)</label><select id="vatRate"><option value="0">0% — No VAT</option><option value="25">25%</option><option value="15">15%</option><option value="12">12%</option></select></div><p class="helper">Prices are excluding VAT. Select VAT only when the seller is registered and the rate applies.</p></section>
<section class="panel"><div class="panelhead"><div><div class="step">04 / OPTIONAL</div><h2>Additional note</h2></div></div><label class="full">Notes for customer<textarea id="notes" rows="3" placeholder="Thank you for your business."></textarea></label></section>
</div><aside class="stack aside"><section class="panel summary"><div class="step">YOUR INVOICE</div><h2>Overview</h2><div class="preview-company" id="sellerPreview">Add your company details to get started.</div><div class="summary-divider"></div><div class="summary-row"><span>Subtotal</span><strong id="subtotal">0,00 kr</strong></div><div class="summary-row"><span id="vatLabel">VAT (0%)</span><strong id="vatAmount">0,00 kr</strong></div><div class="summary-total"><span>Total due</span><strong id="total">0,00 kr</strong></div><button type="button" id="generate" class="btn btn-primary generate">↓ Create & download PDF</button><p class="summary-tip">Your PDF is created in your browser. No data is sent to a server.</p></section><section class="note-panel"><strong>Before you generate</strong><p>Check company details, dates, bank account, and VAT. This is a learning prototype, not a full bookkeeping system.</p></section></aside></div>
<footer>Invoice Studio · Educational prototype · Data stored locally in your browser</footer></main>`;

function flash(text, type='success') { const n=$('#notice'); n.textContent=text; n.className=`notice ${type}`; n.scrollIntoView({behavior:'smooth',block:'nearest'}); }
function company() { return Object.fromEntries(companyFields.map(k=>[k, $(`#${k}`).value.trim()])); }
function sellerPreview() { const c=company(); $('#sellerPreview').innerHTML = c.companyName ? `<strong>${escapeHtml(c.companyName)}</strong><span>${escapeHtml(c.companyAddress)}</span><span>${escapeHtml(c.companyPostal)}</span>` : 'Add your company details to get started.'; }
function saveCompany() { const c=company(); if (!c.companyName || !c.companyAddress || !c.companyPostal || !c.bankAccount) return flash('Complete all required company fields before saving.', 'error'); localStorage.setItem(SETTINGS_KEY, JSON.stringify(c)); sellerPreview(); flash('Company information saved in this browser.'); $('#settingsPanel').classList.add('hidden'); }
function renderItems() { $('#items').innerHTML = items.map((it,i)=>`<div class="item-row" data-index="${i}"><input class="item-description" aria-label="Item ${i+1} description" data-field="description" placeholder="Product or service" value="${escapeHtml(it.description)}"/><input aria-label="Item ${i+1} quantity" data-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(it.quantity)}"/><input aria-label="Item ${i+1} unit price" data-field="price" type="number" min="0" step="0.01" placeholder="0.00" value="${escapeHtml(it.price)}"/><button class="remove-btn" type="button" data-remove="${i}" aria-label="Remove item ${i+1}" ${items.length===1?'disabled':''}>✕</button></div>`).join(''); $('#itemCount').textContent=`${items.length} item${items.length===1?'':'s'}`; calculate(); }
function calculate() { const subtotal = items.reduce((sum,x)=>sum+(Number(x.quantity)||0)*(Number(x.price)||0),0); const rate=Number($('#vatRate').value); const vat=Math.round((subtotal*rate/100+Number.EPSILON)*100)/100; $('#subtotal').textContent=money(subtotal); $('#vatLabel').textContent=`VAT (${rate}%)`; $('#vatAmount').textContent=money(vat); $('#total').textContent=money(subtotal+vat); return {subtotal,vat,total:subtotal+vat,rate}; }
function requireField(id, label) { const v=$(`#${id}`).value.trim(); if(!v) throw new Error(`Please enter ${label}.`); return v; }
function validate() { const c=company(); ['companyName','companyAddress','companyPostal','bankAccount'].forEach(k=>{if(!c[k]) throw new Error('Complete your company settings first, including your bank account.');}); const customer={name:requireField('customerName','the customer name'),address:requireField('customerAddress','the customer street address'),postal:requireField('customerPostal','the customer postal code and city'),email:$('#customerEmail').value.trim()}; ['invoiceDate','dueDate','deliveryDate'].forEach(k=>requireField(k,k.replace(/([A-Z])/g,' $1').toLowerCase())); if($('#dueDate').value < $('#invoiceDate').value) throw new Error('Due date must not be before invoice date.'); for(const [i,it] of items.entries()){if(!it.description.trim())throw new Error(`Enter a description for item ${i+1}.`);if(it.quantity===''||!Number.isFinite(Number(it.quantity))||Number(it.quantity)<=0)throw new Error(`Quantity for item ${i+1} must be greater than zero.`);if(it.price===''||!Number.isFinite(Number(it.price))||Number(it.price)<0)throw new Error(`Price for item ${i+1} must be zero or greater.`);} const totals=calculate();if(!Number.isFinite(totals.total)||totals.total>999999999)throw new Error('Invoice total is out of supported range.'); if(totals.rate>0&&!c.orgNumber)throw new Error('Enter an organization number in company settings when selecting VAT.'); return {c,customer,totals}; }
const pdfText = (x) => String(x||'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u2022/g,'-');
function generatePdf() { try {
const {c,customer,totals}=validate(); const doc=new jsPDF({unit:'mm',format:'a4'}); const W=210,left=18,right=192; let y=18; const line=(a,b,c,d)=>{doc.line(a,b,c,d);};
function pageGuard(height=12) {if(y+height>277){doc.addPage();y=20;}}
function write(text,x,yy,opt={}) {doc.text(pdfText(text),x,yy,opt);}
function wrap(text,x,width,leading=5,fs=10) {doc.setFontSize(fs);const lines=doc.splitTextToSize(pdfText(text),width); for(const l of lines){pageGuard(leading);write(l,x,y);y+=leading;}}
// PDF header: seller at the top; customer and metadata beneath, followed by invoice title.
const AMBER=[156,88,12], DARK=[48,37,22], MUTED=[108,97,81], LIGHT=[250,241,222];
const color=(rgb)=>doc.setTextColor(...rgb);
const detailLines=(lines,x,startY,width=82,leading=5)=>{
  let yy=startY;doc.setFont('helvetica','normal');doc.setFontSize(9.5);color(MUTED);
  for(const value of lines.filter(Boolean)){
    for(const segment of doc.splitTextToSize(pdfText(value),width)){write(segment,x,yy);yy+=leading;}
  }
  return yy;
};
const registration=c.orgNumber?`Org.nr: ${c.orgNumber}${totals.rate>0?' MVA':''}`:'';
// Seller, top left. Company name is visually dominant.
doc.setFont('helvetica','bold');doc.setFontSize(16);color(DARK);
const sellerName=doc.splitTextToSize(pdfText(c.companyName),130);
let sellerY=24;
for(const value of sellerName){write(value,left,sellerY);sellerY+=7;}
const sellerBottom=detailLines([registration,c.companyAddress,c.companyPostal,c.companyEmail,c.companyPhone],left,sellerY+1,115);
const sectionY=Math.max(62,sellerBottom+12);
// Customer details, left column.
doc.setFont('helvetica','bold');doc.setFontSize(12);color(DARK);
let buyerY=sectionY;
for(const value of doc.splitTextToSize(pdfText(customer.name),86)){write(value,left,buyerY);buyerY+=6;}
const buyerBottom=detailLines([customer.address,customer.postal,customer.email],left,buyerY+1,86);
// Invoice metadata, right column, stacked vertically.
// Anchor both metadata labels and values to the PDF's right margin.
// Keep the original description, quantity, unit price, amount and totals layout unchanged.
const metaX=116;
let metaY=sectionY;
function metaRow(label,value){
  doc.setFont('helvetica','normal');doc.setFontSize(9);color(MUTED);
  write(label,right,metaY,{align:'right'});
  doc.setFont('helvetica','bold');doc.setFontSize(9.5);color(DARK);
  const values=doc.splitTextToSize(pdfText(value),right-metaX);
  for(const [i,v] of values.entries())write(v,right,metaY+4+i*4.5,{align:'right'});
  // Keep the label/value pairing tight, with a small gap before the next pair.
  metaY+=Math.max(10,5+values.length*4.5);
}
metaRow('Invoice number',String(nextNumber));
if($('#customerNumber').value.trim())metaRow('Customer number',$('#customerNumber').value.trim());
metaRow('Invoice date',$('#invoiceDate').value);
metaRow('Due date',$('#dueDate').value);
metaRow('Delivery date',$('#deliveryDate').value);
y=Math.max(buyerBottom,metaY)+7;
// Invoice title comes AFTER seller/customer/metadata.
pageGuard(34);
doc.setFont('helvetica','bold');doc.setFontSize(27);color(AMBER);
write('INVOICE',left,y);y+=5;
doc.setDrawColor(...AMBER);doc.setLineWidth(0.85);line(left,y,right,y);doc.setLineWidth(0.2);
y+=13;
if($('#deliveryLocation').value.trim()){
  doc.setFont('helvetica','bold');doc.setFontSize(9);color(AMBER);
  write('DELIVERY LOCATION',left,y);y+=6;
  doc.setFont('helvetica','normal');color(MUTED);
  for(const part of doc.splitTextToSize(pdfText($('#deliveryLocation').value.trim()),170)){
    pageGuard(5);write(part,left,y);y+=5;
  }
  y+=6;
}
// Preserve the ORIGINAL four-column PDF table layout: four independent fields.
// Coordinates are in millimeters on an A4 page; each numeric column is right-aligned.
const tableColumns = {description: left + 3, quantity: 125, unitPrice: 157, amount: right - 3};
const header = () => {
  doc.setFillColor(250,241,222); // amber tint: color only, not layout
  doc.rect(left,y,174,11,'F');
  doc.setFont('helvetica','bold');
  doc.setTextColor(117,68,13);
  doc.setFontSize(9);
  write('DESCRIPTION',tableColumns.description,y+7);
  write('QTY',tableColumns.quantity,y+7,{align:'right'});
  write('UNIT PRICE',tableColumns.unitPrice,y+7,{align:'right'});
  write('AMOUNT',tableColumns.amount,y+7,{align:'right'});
  doc.setFont('helvetica','normal');
  y+=14;
};
pageGuard(28);
header();
items.forEach(it => {
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  // Original description width, height and row spacing.
  const descriptionLines=doc.splitTextToSize(pdfText(it.description),89);
  const height=Math.max(descriptionLines.length*5+5,13);
  pageGuard(height+6);
  if(y===20)header();
  doc.setTextColor(48,37,22);
  descriptionLines.forEach((txt,index)=>write(txt,tableColumns.description,y+6+index*5));
  // These are separate cells, not one combined quantity × price expression.
  write(String(it.quantity),tableColumns.quantity,y+6,{align:'right'});
  write(money(Number(it.price)),tableColumns.unitPrice,y+6,{align:'right'});
  write(money(Number(it.quantity)*Number(it.price)),tableColumns.amount,y+6,{align:'right'});
  y+=height;
  doc.setDrawColor(232,219,196);
  line(left,y,right,y);
});
y+=10;pageGuard(42);const amount=(label,value,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(bold?12:10);doc.setTextColor(48,37,22);write(label,111,y);write(money(value),right,y,{align:'right'});y+=bold?10:8;};amount('Subtotal',totals.subtotal);amount(`VAT (${totals.rate}%)`,totals.vat);doc.setDrawColor(156,88,12);line(111,y-3,right,y-3);y+=5;amount('TOTAL DUE',totals.total,true);
pageGuard(35);y+=6;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(156,88,12);write('PAYMENT DETAILS',left,y);y+=8;doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(72,58,38);wrap(`Bank account: ${c.bankAccount}`,left,174,5,10);wrap(`Payment reference: Invoice ${nextNumber}`,left,174,5,10);
if($('#notes').value.trim()){y+=7;pageGuard(24);doc.setFont('helvetica','bold');doc.setFontSize(10);write('NOTES',left,y);doc.setFont('helvetica','normal');y+=7;wrap($('#notes').value.trim(),left,174,5,10);}
const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setDrawColor(232,219,196);line(left,283,right,283);doc.setFontSize(8);doc.setTextColor(127,138,150);write('Generated with Invoice Studio',left,289);write(`Page ${p} of ${pages}`,right,289,{align:'right'});}
const filename=`invoice-${nextNumber}.pdf`;doc.save(filename);nextNumber++;localStorage.setItem(COUNTER_KEY,String(nextNumber));$('#invoiceNumber').value=nextNumber;flash(`PDF generated: ${filename}. Invoice number advanced to ${nextNumber}.`);
} catch(err){flash(err instanceof Error?err.message:'Could not generate PDF.','error');} }

for(const id of companyFields) $(`#${id}`).value=savedCompany[id]||'';
$('#invoiceNumber').value=nextNumber;$('#invoiceDate').value=today();$('#dueDate').value=dueInDays(14);$('#deliveryDate').value=today();sellerPreview();renderItems();
$('#settingsToggle').addEventListener('click',()=>$('#settingsPanel').classList.toggle('hidden'));
$('#closeSettings').addEventListener('click',()=>$('#settingsPanel').classList.add('hidden'));
$('#saveSettings').addEventListener('click',saveCompany);
companyFields.forEach(id=>$(`#${id}`).addEventListener('input',sellerPreview));
$('#addItem').addEventListener('click',()=>{items.push({description:'',quantity:1,price:''});renderItems();});
$('#items').addEventListener('input',(event)=>{const el=event.target;if(!el.dataset.field)return;const idx=Number(el.closest('.item-row').dataset.index);items[idx][el.dataset.field]=el.value;calculate();});
$('#items').addEventListener('click',(event)=>{const btn=event.target.closest('[data-remove]');if(!btn||items.length===1)return;items.splice(Number(btn.dataset.remove),1);renderItems();});
$('#vatRate').addEventListener('change',calculate);
$('#generate').addEventListener('click',generatePdf);
