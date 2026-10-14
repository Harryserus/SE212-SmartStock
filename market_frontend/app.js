const API_BASE = window.SMARTSTOCK_API_URL || "http://localhost:3000/api";
const pages = ["Dashboard", "Sales", "Products", "Inventory", "Purchase Orders", "Suppliers", "Supplier Issues", "Reports"];
let activePage = "Dashboard";
let toastTimer;
const nav = document.getElementById("main-nav");
const contentRoot = document.getElementById("page-content");

const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const money = value => new Intl.NumberFormat(undefined,{style:"currency",currency:"USD"}).format(Number(value || 0));
const dateText = value => value ? new Date(value).toLocaleString() : "—";

async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  return data;
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
function badge(value, kind = "") {
  const safe = esc(value || "—");
  const cls = kind || String(value || "").toLowerCase().replace(/[^a-z]+/g,"-");
  return '<span class="status '+esc(cls)+'">'+safe+'</span>';
}
function metrics(items) {
  return '<div class="metrics">'+items.map(m=>'<div class="metric-card '+(m.warn?'warning':'')+'"><div class="metric-top"><span>'+esc(m.label)+'</span><span class="metric-icon">'+esc(m.icon||"")+'</span></div><div class="metric-value">'+esc(m.value)+'</div><div class="metric-foot">'+esc(m.note||"")+'</div></div>').join("")+'</div>';
}
function heading(title, subtitle, action) {
  return '<div class="page-heading"><div><div class="eyebrow">SMARTSTOCK WORKSPACE</div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div><div class="heading-actions">'+(action?'<button class="button primary" data-modal="'+esc(action)+'"><span class="plus">＋</span><span>'+esc(action)+'</span></button>':'')+'</div></div>';
}
function table(headers, rows, title, subtitle, action) {
  return '<div class="panel table-panel"><div class="panel-header"><div><div class="panel-title">'+esc(title)+'</div><div class="panel-subtitle">'+esc(subtitle)+'</div></div><div class="table-tools"><input class="table-search" placeholder="⌕ Search..." data-filter-table aria-label="Search table">'+(action?'<button class="button primary" data-modal="'+esc(action)+'">＋ '+esc(action)+'</button>':'')+'</div></div><div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+ (rows.length?rows.map(row=>'<tr>'+row.map(cell=>'<td>'+cell+'</td>').join("")+'</tr>').join(""):'<tr><td colspan="'+headers.length+'" class="muted">No records found.</td></tr>')+'</tbody></table></div></div>';
}
function selectOptions(rows, idKey, nameKey, placeholder) {
  return '<option value="">'+esc(placeholder)+'</option>'+rows.map(row=>'<option value="'+esc(row[idKey])+'">'+esc(row[nameKey])+'</option>').join("");
}
function productLabel(p) { return '<div class="table-product"><span class="tiny-product">▧</span><b>'+esc(p.productName)+'</b></div>'; }

async function render(page = activePage) {
  activePage = page;
  document.title = "SmartStock — " + page;
  document.getElementById("topbar-page").textContent = page;
  nav.innerHTML = '<div class="nav-list">'+pages.map((p,i)=>'<a href="#" class="nav-link '+(p===page?'active':'')+'" data-page="'+esc(p)+'"><span class="nav-icon">'+["◫","↗","▧","▤","⇄","♙","⚑","▥"][i]+'</span><span class="nav-text">'+esc(p)+'</span></a>').join("")+'</div>';
  contentRoot.innerHTML = '<div class="panel"><div class="panel-title">Loading '+esc(page)+'…</div></div>';
  try {
    contentRoot.innerHTML = await pageView(page);
    bindTableSearch();
  } catch (error) {
    contentRoot.innerHTML = heading(page,"Could not load this page.")+'<div class="inventory-alert"><span class="alert-badge">!</span><span>'+esc(error.message)+'<br>Check that the backend and MySQL are running.</span><button class="button" data-retry>Try again</button></div>';
  }
}
async function pageView(page, reportQuery = "") {
  if (page === "Dashboard") {
    const [summary, low, top] = await Promise.all([api("/management/overview"),api("/inventory/low-stock"),api("/management/top-products")]);
    const rows=top.slice(0,5).map(p=>[productLabel(p),esc(p.quantitySold),money(p.salesRevenue)]);
    return heading("Dashboard","Store performance and activity at a glance.")+
      metrics([{label:"Today's revenue",value:money(summary.todayRevenue),icon:"↗",note:"Recorded sales today"},{label:"Transactions",value:summary.todayTransactions,icon:"▤",note:"Sales today"},{label:"Low-stock products",value:low.length,icon:"⚑",note:"At or below reorder level",warn:low.length>0}])+
      table(["BEST SELLING PRODUCT","UNITS SOLD","SALES REVENUE"],rows,"Best sellers",reportPeriod)+
      table(["LOW-STOCK PRODUCT","ON HAND","REORDER LEVEL"],low.slice(0,6).map(p=>[productLabel(p),esc(p.quantityInStock),esc(p.reorderLevel)]),"Needs attention","Products at or below reorder level");
  }
  if (page === "Products") {
    const products=await api("/products");
    return heading("Products","View and add products in the catalog.","Add product")+
      table(["PRODUCT","BARCODE","CATEGORY","UNIT PRICE","ON HAND","REORDER LEVEL"],products.map(p=>[productLabel(p),esc(p.barcode||"—"),esc(p.categoryName||"—"),money(p.unitPrice),esc(p.quantityInStock),esc(p.reorderLevel)]),"Product catalog","Products stored in MySQL");
  }
  if (page === "Inventory") {
    const rows=await api("/inventory");
    return heading("Inventory","Review and adjust current stock.","Adjust stock")+
      metrics([{label:"Products tracked",value:rows.length,icon:"▤",note:"Inventory records"},{label:"Low stock",value:rows.filter(x=>x.lowStock).length,icon:"⚑",note:"At or below reorder level",warn:rows.some(x=>x.lowStock)}])+
      table(["PRODUCT","ON HAND","REORDER LEVEL","LAST UPDATED","STATUS",""],rows.map(p=>[productLabel(p),esc(p.quantityInStock),esc(p.reorderLevel),dateText(p.lastUpdated),badge(p.lowStock?"Low stock":"In stock"),'<button class="row-actions" data-adjust="'+esc(p.productId)+'" data-name="'+esc(p.productName)+'" data-quantity="'+esc(p.quantityInStock)+'" data-reorder="'+esc(p.reorderLevel)+'">Adjust</button>']),"Current inventory","Adjustments update the inventory record");
  }
  if (page === "Sales") {
    const rows=await api("/sales");
    return heading("Sales","Review recorded sales and create a transaction.","New sale")+
      metrics([{label:"Sales recorded",value:rows.length,icon:"↗",note:"All recorded transactions"},{label:"Total recorded revenue",value:money(rows.reduce((sum,s)=>sum+Number(s.totalAmount),0)),icon:"＄",note:"After item discounts"}])+
      table(["SALE","DATE & TIME","EMPLOYEE","PAYMENT METHOD","TOTAL"],rows.map(s=>[esc("#"+s.saleId),dateText(s.saleDateTime),esc(s.employeeName),esc(s.paymentMethod),money(s.totalAmount)]),"Transactions","Values are loaded from the API");
  }
  if (page === "Purchase Orders") {
    const orders=await api("/purchase-orders");
    const rows=await Promise.all(orders.map(async o=>{const detail=await api("/purchase-orders/"+o.purchaseOrderId);const count=detail.items.reduce((n,i)=>n+Number(i.quantityOrdered),0);return [esc("#"+o.purchaseOrderId),esc(o.supplierName),dateText(o.orderDate),esc(count),badge(o.status),o.status==="received"||o.status==="cancelled"?"—":'<button class="row-actions" data-receive="'+esc(o.purchaseOrderId)+'">Receive remaining</button>'];}));
    return heading("Purchase Orders","Track orders and record received stock.","New purchase order")+
      table(["ORDER","SUPPLIER","ORDER DATE","UNITS ORDERED","STATUS",""],rows,"Purchase orders","Receiving an order also adds received units to inventory");
  }
  if (page === "Suppliers") {
    const rows=await api("/suppliers");
    return heading("Suppliers","Manage supplier contact details.","Add supplier")+
      table(["SUPPLIER","CONTACT","PHONE","EMAIL"],rows.map(s=>[esc(s.supplierName),esc(s.contactName||"—"),esc(s.phone||"—"),esc(s.email||"—")]),"Supplier directory","Suppliers stored in MySQL");
  }
  if (page === "Supplier Issues") {
    const issues=await api("/management/supplier-issues");
    return heading("Supplier Issues","Track delivery problems through resolution.","Report an issue")+
      metrics([{label:"Issues recorded",value:issues.length,icon:"⚑",note:"All issue records"},{label:"Open issues",value:issues.filter(i=>i.status==="open"||i.status==="in_progress").length,icon:"!",note:"Need follow-up",warn:true}])+
      table(["ISSUE","SUPPLIER","PURCHASE ORDER","DATE","TYPE","STATUS",""],issues.map(i=>[esc("#"+i.issueId),esc(i.supplierName),esc("#"+i.purchaseOrderId),dateText(i.issueDate),esc(i.issueType),badge(i.status),i.status==="resolved"||i.status==="closed"?"—":'<button class="row-actions" data-issue-status="'+esc(i.issueId)+'" data-status="resolved">Resolve</button>']),"Issue log","Supplier issues stored in MySQL");
  }
  const [top,slow]=await Promise.all([api("/management/top-products"+reportQuery),api("/management/slow-products"+reportQuery)]);
  const reportPeriod=reportQuery ? "Selected date range" : "Last 30 days";
  return heading("Reports","Best-selling and slow-moving product reports.")+
    '<div class="filter-row"><label>From <input type="date" id="report-start"></label><label>To <input type="date" id="report-end"></label><button class="button" data-run-report>Apply dates</button></div>'+
    table(["PRODUCT","UNITS SOLD","REVENUE"],top.map(p=>[productLabel(p),esc(p.quantitySold),money(p.salesRevenue)]),"Best sellers","Last 30 days")+
    table(["PRODUCT","UNITS SOLD"],slow.map(p=>[productLabel(p),esc(p.quantitySold)]),"Slow-moving products",reportPeriod);
}

function bindTableSearch(){
  document.querySelectorAll("[data-filter-table]").forEach(input=>input.addEventListener("input",()=>{
    const q=input.value.toLowerCase();
    input.closest(".table-panel").querySelectorAll("tbody tr").forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(q));
  }));
}
async function showModal(type, data = {}) {
  let form;
  if(type==="Add product"){
    const [categories]=await Promise.all([api("/categories")]);
    form='<label>Product name<input name="productName" required maxlength="100"></label><label>Barcode<input name="barcode" maxlength="50"></label><label>Category<select name="categoryId" required>'+selectOptions(categories,"categoryId","categoryName","Select category")+'</select></label><label>Unit price<input name="unitPrice" type="number" min="0" step="0.01" required></label><label>Starting quantity<input name="quantityInStock" type="number" min="0" step="1" value="0" required></label><label>Reorder level<input name="reorderLevel" type="number" min="0" step="1" value="0" required></label>';
  } else if(type==="Adjust stock"){
    form='<input type="hidden" name="productId" value="'+esc(data.productId)+'"><p>Adjusting stock for <b>'+esc(data.productName)+'</b></p><label>Quantity in stock<input name="quantityInStock" type="number" min="0" step="1" value="'+esc(data.quantityInStock)+'" required></label><label>Reorder level<input name="reorderLevel" type="number" min="0" step="1" value="'+esc(data.reorderLevel)+'" required></label>';
  } else if(type==="New sale"){
    const [products,employees]=await Promise.all([api("/products"),api("/employees")]);
    form='<label>Employee<select name="employeeId" required>'+selectOptions(employees,"employeeId","employeeName","Select employee")+'</select></label><label>Payment method<select name="paymentMethod" required><option value="">Select payment method</option><option value="cash">Cash</option><option value="card">Card</option><option value="qr_payment">QR payment</option></select></label><label>Product<select name="productId" required>'+selectOptions(products,"productId","productName","Select product")+'</select></label><label>Quantity<input name="quantity" type="number" min="1" step="1" value="1" required></label><label>Discount amount<input name="discountAmount" type="number" min="0" step="0.01" value="0" required></label>';
  } else if(type==="Add supplier"){
    form='<label>Supplier name<input name="supplierName" required maxlength="100"></label><label>Contact name<input name="contactName" maxlength="100"></label><label>Phone<input name="phone" maxlength="20"></label><label>Email<input name="email" type="email" maxlength="100"></label>';
  } else if(type==="New purchase order"){
    const [suppliers,employees,products]=await Promise.all([api("/suppliers"),api("/employees"),api("/products")]);
    form='<label>Supplier<select name="supplierId" required>'+selectOptions(suppliers,"supplierId","supplierName","Select supplier")+'</select></label><label>Employee<select name="employeeId" required>'+selectOptions(employees,"employeeId","employeeName","Select employee")+'</select></label><label>Order date<input name="orderDate" type="date" required></label><label>Expected delivery<input name="expectedDeliveryDate" type="date"></label><label>Product<select name="productId" required>'+selectOptions(products,"productId","productName","Select product")+'</select></label><label>Quantity ordered<input name="quantityOrdered" type="number" min="1" step="1" value="1" required></label><label>Purchase unit price<input name="purchaseUnitPrice" type="number" min="0" step="0.01" required></label>';
  } else if(type==="Report an issue"){
    const [orders,employees]=await Promise.all([api("/purchase-orders"),api("/employees")]);
    form='<label>Purchase order<select name="purchaseOrderId" required>'+selectOptions(orders,"purchaseOrderId","purchaseOrderId","Select order")+'</select></label><label>Employee<select name="employeeId" required>'+selectOptions(employees,"employeeId","employeeName","Select employee")+'</select></label><label>Issue type<select name="issueType" required><option value="">Select type</option><option>Damaged goods</option><option>Missing items</option><option>Incorrect items</option></select></label><label>Issue date<input name="issueDate" type="date" required value="'+new Date().toISOString().slice(0,10)+'"></label><label>Description<textarea name="description" maxlength="255"></textarea></label>';
  } else return;
  const backdrop=document.createElement("div");
  backdrop.className="modal-backdrop";
  backdrop.innerHTML='<form class="modal" data-modal-form="'+esc(type)+'"><div class="eyebrow">SMARTSTOCK</div><h2>'+esc(type)+'</h2><p>Save this information to the connected database.</p><div class="form-grid">'+form+'</div><div class="modal-actions"><button type="button" class="button" data-close>Cancel</button><button class="button primary" type="submit">Save</button></div></form>';
  document.body.appendChild(backdrop);
}
async function submitModal(form){
  const values=Object.fromEntries(new FormData(form).entries());
  const n=(v)=>Number(v);
  const type=form.dataset.modalForm;
  if(type==="Add product"){
    await api("/products",{method:"POST",body:JSON.stringify({...values,unitPrice:n(values.unitPrice),categoryId:n(values.categoryId),quantityInStock:n(values.quantityInStock),reorderLevel:n(values.reorderLevel),barcode:values.barcode||null})});
  } else if(type==="Adjust stock"){
    await api("/inventory/"+encodeURIComponent(values.productId),{method:"PUT",body:JSON.stringify({quantityInStock:n(values.quantityInStock),reorderLevel:n(values.reorderLevel)})});
  } else if(type==="New sale"){
    await api("/sales",{method:"POST",body:JSON.stringify({employeeId:n(values.employeeId),paymentMethod:values.paymentMethod,items:[{productId:n(values.productId),quantity:n(values.quantity),discountAmount:n(values.discountAmount)}]})});
  } else if(type==="Add supplier"){
    await api("/suppliers",{method:"POST",body:JSON.stringify({...values,contactName:values.contactName||null,phone:values.phone||null,email:values.email||null})});
  } else if(type==="New purchase order"){
    await api("/purchase-orders",{method:"POST",body:JSON.stringify({supplierId:n(values.supplierId),employeeId:n(values.employeeId),orderDate:values.orderDate,expectedDeliveryDate:values.expectedDeliveryDate||null,items:[{productId:n(values.productId),quantityOrdered:n(values.quantityOrdered),purchaseUnitPrice:n(values.purchaseUnitPrice)}]})});
  } else if(type==="Report an issue"){
    await api("/supplier-issues",{method:"POST",body:JSON.stringify({...values,purchaseOrderId:n(values.purchaseOrderId),employeeId:n(values.employeeId),description:values.description||null})});
  }
  document.querySelector(".modal-backdrop")?.remove();
  showToast(type+" saved.");
  await render(activePage);
}
async function receiveOrder(id){
  if(!window.confirm("Receive all remaining units on this purchase order and add them to inventory?"))return;
  const order=await api("/purchase-orders/"+id);
  const items=order.items.filter(i=>Number(i.quantityOrdered)>Number(i.quantityReceived))
    .map(i=>({productId:i.productId,quantityReceived:Number(i.quantityOrdered)-Number(i.quantityReceived)}));
  if(!items.length)throw new Error("This order has no remaining units.");
  await api("/purchase-orders/"+id+"/receive",{method:"POST",body:JSON.stringify({items})});
  await api("/purchase-orders/"+id+"/status",{method:"PATCH",body:JSON.stringify({status:"received"})});
  showToast("Received stock and updated inventory.");
  await render(activePage);
}
async function updateIssue(id,status){
  await api("/supplier-issues/"+id+"/status",{method:"PATCH",body:JSON.stringify({status})});
  showToast("Supplier issue updated.");
  await render(activePage);
}

document.addEventListener("click",async e=>{
  const pageLink=e.target.closest("[data-page]");
  const modalButton=e.target.closest("[data-modal]");
  const close=e.target.closest("[data-close]");
  const adjust=e.target.closest("[data-adjust]");
  const receive=e.target.closest("[data-receive]");
  const issue=e.target.closest("[data-issue-status]");
  try{
    if(pageLink){e.preventDefault();await render(pageLink.dataset.page);}
    else if(modalButton){await showModal(modalButton.dataset.modal);}
    else if(close||e.target.classList.contains("modal-backdrop"))document.querySelector(".modal-backdrop")?.remove();
    else if(adjust)await showModal("Adjust stock",adjust.dataset);
    else if(receive)await receiveOrder(receive.dataset.receive);
    else if(issue)await updateIssue(issue.dataset.issueStatus,issue.dataset.status);
    else if(e.target.closest("[data-retry]"))await render(activePage);
    else if(e.target.closest("[data-run-report]")){
      const params=new URLSearchParams();
      const from=document.getElementById("report-start")?.value,to=document.getElementById("report-end")?.value;
      if(from)params.set("startDate",from);if(to)params.set("endDate",to);
      const qs=params.toString()?"?"+params.toString():"";
      showToast("Report date filters applied.");
      contentRoot.innerHTML=await pageView("Reports",qs);
      bindTableSearch();
      if(from)document.getElementById("report-start").value=from;
      if(to)document.getElementById("report-end").value=to;
    }
  }catch(error){showToast(error.message);}
});
document.addEventListener("submit",async e=>{
  if(!e.target.matches("[data-modal-form]"))return;
  e.preventDefault();
  const button=e.target.querySelector('[type="submit"]');button.disabled=true;button.textContent="Saving…";
  try{await submitModal(e.target);}catch(error){showToast(error.message);button.disabled=false;button.textContent="Save";}
});
document.addEventListener("input",e=>{
  if(e.target.id==="global-search"){
    const q=e.target.value.toLowerCase();
    contentRoot.querySelectorAll("tbody tr").forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(q));
  }
});
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();document.getElementById("global-search").focus();}
});
document.getElementById("today-date").textContent=new Intl.DateTimeFormat("en",{month:"short",day:"numeric",year:"numeric"}).format(new Date());
render();
