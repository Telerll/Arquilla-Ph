let profile = JSON.parse(localStorage.getItem("profile")) || {
  owner: "ArquillaPh",
  property: "ArquillaPh Rental Management System",
  address: "",
  contact: "",
  email: "",
  type: "Mixed Rental"
};

let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
let bills = JSON.parse(localStorage.getItem("bills")) || [];
let requests = JSON.parse(localStorage.getItem("requests")) || [];

let editingTenantId = null;
let editingRoomId = null;
let editingBillId = null;
let editingRequestId = null;

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP"
});

const pageTitles = {
  dashboard: "Dashboard",
  setup: "Property Setup",
  tenants: "Tenants / Guests",
  rooms: "Rooms / Units",
  billing: "Billing",
  invoice: "Invoice / SOA",
  contracts: "Contracts",
  sms: "SMS Templates",
  maintenance: "Maintenance",
  reports: "Reports"
};

function makeId() {
  return crypto.randomUUID();
}

function normalizeData() {
  rooms = rooms.map(room => ({
    id: room.id || makeId(),
    number: room.number || "",
    type: room.type || "Bedspace",
    capacity: Number(room.capacity || 0),
    rateType: room.rateType || (room.type === "Transient" ? "Daily" : "Monthly"),
    rate: Number(room.rate || 0),
    status: room.status || "Available"
  }));

  tenants = tenants.map(tenant => ({
    id: tenant.id || makeId(),
    name: tenant.name || "",
    contact: tenant.contact || "",
    address: tenant.address || "",
    idInfo: tenant.idInfo || "",
    emergency: tenant.emergency || "",
    type: tenant.type || "Bedspace",
    roomId: tenant.roomId || "",
    room: tenant.room || "",
    deck: tenant.deck || "",
    dateAdded: tenant.dateAdded || new Date().toLocaleDateString()
  }));

  bills = bills.map(bill => ({
    id: bill.id || makeId(),
    tenantId: bill.tenantId || "",
    name: bill.name || "",
    room: bill.room || "",
    type: bill.type || "",
    deck: bill.deck || "",
    from: bill.from || "",
    to: bill.to || "",
    period: bill.period || "Current Billing Period",
    rateType: bill.rateType || "Monthly Rent",
    rent: Number(bill.rent || 0),
    advance: Number(bill.advance || 0),
    deposit: Number(bill.deposit || 0),
    water: Number(bill.water || 0),
    electric: Number(bill.electric || 0),
    internet: Number(bill.internet || 0),
    other: Number(bill.other || 0),
    discount: Number(bill.discount || 0),
    total: Number(bill.total || 0),
    status: bill.status || "Unpaid",
    date: bill.date || new Date().toLocaleDateString()
  }));

  requests = requests.map(request => ({
    id: request.id || makeId(),
    tenant: request.tenant || "N/A",
    room: request.room || "N/A",
    issue: request.issue || "",
    priority: request.priority || "Normal",
    status: request.status || "Open",
    date: request.date || new Date().toLocaleDateString()
  }));

  save();
}

normalizeData();

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    switchTab(button.dataset.tab);
  });
});

document.querySelectorAll("[data-tab-jump]").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    switchTab(button.dataset.tabJump);
  });
});

document.addEventListener("click", event => {
  const target = event.target;

  if (target.dataset.editTenant) loadTenantForEdit(target.dataset.editTenant);
  if (target.dataset.deleteTenant) deleteTenant(target.dataset.deleteTenant);

  if (target.dataset.editRoom) loadRoomForEdit(target.dataset.editRoom);
  if (target.dataset.deleteRoom) deleteRoom(target.dataset.deleteRoom);

  if (target.dataset.editBill) loadBillForEdit(target.dataset.editBill);
  if (target.dataset.markPaid) markBillPaid(target.dataset.markPaid);
  if (target.dataset.deleteBill) deleteBill(target.dataset.deleteBill);

  if (target.dataset.editRequest) loadRequestForEdit(target.dataset.editRequest);
  if (target.dataset.markDone) markRequestDone(target.dataset.markDone);
  if (target.dataset.deleteRequest) deleteRequest(target.dataset.deleteRequest);
});

tenantType.addEventListener("change", toggleTenantDeck);
roomType.addEventListener("change", syncRateType);
billTenant.addEventListener("change", fillBillFromTenant);

setupForm.addEventListener("submit", event => {
  event.preventDefault();

  profile = {
    owner: ownerName.value || "ArquillaPh",
    property: propertyName.value || "ArquillaPh Rental Management System",
    address: propertyAddress.value,
    contact: propertyContact.value,
    email: propertyEmail.value,
    type: mainRentalType.value
  };

  save();
  render();
  alert("Property profile saved.");
});

tenantForm.addEventListener("submit", event => {
  event.preventDefault();

  const selectedRoom = rooms.find(room => room.id === tenantRoom.value);
  const selectedTenant = editingTenantId ? tenants.find(tenant => tenant.id === editingTenantId) : null;

  if (tenantType.value === "Bedspace" && tenantRoom.value && !tenantDeck.value) {
    alert("Please select Lower Deck or Upper Deck for bedspace tenant.");
    return;
  }

  if (selectedRoom && isRoomBlockedForTenant(selectedRoom, selectedTenant?.id)) {
    alert("This room is full or under maintenance. Please choose another room.");
    return;
  }

  const tenantData = {
    id: editingTenantId || makeId(),
    name: tenantName.value,
    contact: tenantContact.value,
    address: tenantAddress.value,
    idInfo: tenantId.value,
    emergency: tenantEmergency.value,
    type: tenantType.value,
    roomId: tenantRoom.value,
    room: selectedRoom ? selectedRoom.number : "",
    deck: tenantType.value === "Bedspace" ? tenantDeck.value : "",
    dateAdded: selectedTenant?.dateAdded || new Date().toLocaleDateString()
  };

  if (editingTenantId) {
    tenants = tenants.map(tenant => tenant.id === editingTenantId ? tenantData : tenant);
  } else {
    tenants.push(tenantData);
  }

  editingTenantId = null;
  tenantSubmitBtn.textContent = "Add Tenant / Guest";
  tenantForm.reset();
  toggleTenantDeck();
  save();
  render();
});

roomForm.addEventListener("submit", event => {
  event.preventDefault();

  const existingRoom = editingRoomId ? rooms.find(room => room.id === editingRoomId) : null;

  const roomData = {
    id: editingRoomId || makeId(),
    number: roomNumber.value,
    type: roomType.value,
    capacity: Number(capacity.value || 0),
    rateType: rateType.value,
    rate: Number(rate.value || 0),
    status: roomStatus.value
  };

  if (existingRoom && roomData.capacity < getRoomOccupancy(existingRoom.id)) {
    alert("Capacity cannot be lower than the number of assigned tenants.");
    return;
  }

  if (editingRoomId) {
    rooms = rooms.map(room => room.id === editingRoomId ? roomData : room);
  } else {
    rooms.push(roomData);
  }

  editingRoomId = null;
  roomSubmitBtn.textContent = "Add Room";
  roomForm.reset();
  syncRateType();
  save();
  render();
});

billingForm.addEventListener("submit", event => {
  event.preventDefault();

  const tenant = tenants.find(item => item.id === billTenant.value);

  if (!tenant) {
    alert("Please select a tenant / guest.");
    return;
  }

  const billData = {
    id: editingBillId || makeId(),
    tenantId: tenant.id,
    name: tenant.name,
    room: tenant.room,
    type: tenant.type,
    deck: tenant.deck,
    from: billingFrom.value,
    to: billingTo.value,
    period: `${billingFrom.value} to ${billingTo.value}`,
    rateType: billRateType.value,
    rent: Number(rent.value || 0),
    advance: Number(advance.value || 0),
    deposit: Number(deposit.value || 0),
    water: Number(water.value || 0),
    electric: Number(electric.value || 0),
    internet: Number(internet.value || 0),
    other: Number(other.value || 0),
    discount: Number(discount.value || 0),
    status: paymentStatus.value,
    date: new Date().toLocaleDateString()
  };

  billData.total =
    billData.rent +
    billData.deposit +
    billData.water +
    billData.electric +
    billData.internet +
    billData.other -
    billData.advance -
    billData.discount;

  if (editingBillId) {
    bills = bills.map(bill => bill.id === editingBillId ? billData : bill);
  } else {
    bills.push(billData);
  }

  editingBillId = null;
  billingSubmitBtn.textContent = "Create Bill";
  billingForm.reset();
  save();
  render();
});

maintenanceForm.addEventListener("submit", event => {
  event.preventDefault();

  const requestData = {
    id: editingRequestId || makeId(),
    tenant: requestTenant.value || "N/A",
    room: requestRoom.value || "N/A",
    issue: requestIssue.value,
    priority: requestPriority.value,
    status: requestStatus.value,
    date: new Date().toLocaleDateString()
  };

  if (editingRequestId) {
    requests = requests.map(request => request.id === editingRequestId ? requestData : request);
  } else {
    requests.push(requestData);
  }

  editingRequestId = null;
  maintenanceSubmitBtn.textContent = "Add Request";
  maintenanceForm.reset();
  save();
  render();
});

contractType.addEventListener("change", updateContract);

function save() {
  localStorage.setItem("profile", JSON.stringify(profile));
  localStorage.setItem("tenants", JSON.stringify(tenants));
  localStorage.setItem("rooms", JSON.stringify(rooms));
  localStorage.setItem("bills", JSON.stringify(bills));
  localStorage.setItem("requests", JSON.stringify(requests));
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(button => button.classList.remove("active"));

  document.getElementById(tabName).classList.add("active");

  const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeButton) activeButton.classList.add("active");

  pageTitle.textContent = pageTitles[tabName] || "Dashboard";
  render();
}

function render() {
  renderProfile();
  populateRoomDropdown();
  populateBillTenantDropdown();
  populateMaintenanceRoomDropdown();
  renderDashboard();
  renderTenants();
  renderRooms();
  renderBilling();
  renderInvoice();
  renderReports();
  renderSmsTemplates();
  renderMaintenance();
  toggleTenantDeck();
  updateContract();
}

function renderProfile() {
  appBrand.textContent = profile.owner;
  dashboardPropertyName.textContent = profile.property;
  propertySubtitle.textContent = `${profile.type} management${profile.address ? " - " + profile.address : ""}`;

  ownerName.value = profile.owner;
  propertyName.value = profile.property;
  propertyAddress.value = profile.address;
  propertyContact.value = profile.contact;
  propertyEmail.value = profile.email;
  mainRentalType.value = profile.type;
}

function populateRoomDropdown() {
  const currentValue = tenantRoom.value;

  tenantRoom.innerHTML = `<option value="">Assign room / unit</option>` + rooms.map(room => {
    const available = getAvailableSlots(room);
    const assignedToCurrentTenant = tenants.some(tenant => {
      return tenant.id === editingTenantId && tenant.roomId === room.id;
    });

    const disabled =
      !assignedToCurrentTenant &&
      (room.status === "Maintenance" || room.status === "Reserved" || available <= 0);

    const label = `Room ${room.number} - ${room.type} (${available} slot/s)`;

    return `<option value="${room.id}" ${disabled ? "disabled" : ""}>${label}</option>`;
  }).join("");

  if (rooms.some(room => room.id === currentValue)) {
    tenantRoom.value = currentValue;
  }
}

function populateBillTenantDropdown() {
  const currentValue = billTenant.value;

  billTenant.innerHTML = `<option value="">Select tenant / guest</option>` + tenants.map(tenant => {
    const roomText = tenant.room ? ` - Room ${tenant.room}` : "";
    return `<option value="${tenant.id}">${tenant.name}${roomText}</option>`;
  }).join("");

  if (tenants.some(tenant => tenant.id === currentValue)) {
    billTenant.value = currentValue;
  }
}

function populateMaintenanceRoomDropdown() {
  const currentValue = requestRoom.value;

  requestRoom.innerHTML = `<option value="">Select room / unit</option>` + rooms.map(room => {
    const status = getDisplayRoomStatus(room);
    return `<option value="${room.number}">Room ${room.number} - ${room.type} (${status})</option>`;
  }).join("");

  requestRoom.value = currentValue;
}

function toggleTenantDeck() {
  if (tenantType.value === "Bedspace") {
    tenantDeckField.style.display = "grid";
    tenantDeck.disabled = false;
  } else {
    tenantDeck.value = "";
    tenantDeck.disabled = true;
    tenantDeckField.style.display = "none";
  }
}

function syncRateType() {
  rateType.value = roomType.value === "Transient" ? "Daily" : "Monthly";
}

function fillBillFromTenant() {
  const tenant = tenants.find(item => item.id === billTenant.value);
  if (!tenant) return;

  const room = rooms.find(item => item.id === tenant.roomId);

  if (room) {
    billRateType.value = room.rateType === "Daily" ? "Daily Fee" : "Monthly Rent";
    rent.value = room.rate;
  }
}

function getRoomOccupancy(roomId) {
  return tenants.filter(tenant => tenant.roomId === roomId).length;
}

function getAvailableSlots(room) {
  return Math.max(Number(room.capacity || 0) - getRoomOccupancy(room.id), 0);
}

function getDisplayRoomStatus(room) {
  if (room.status === "Maintenance" || room.status === "Reserved") return room.status;
  return getAvailableSlots(room) <= 0 ? "Occupied" : "Available";
}

function isRoomBlockedForTenant(room, currentTenantId = null) {
  if (room.status === "Maintenance") return true;

  const assignedCount = tenants.filter(tenant => {
    if (tenant.id === currentTenantId) return false;
    return tenant.roomId === room.id;
  }).length;

  return assignedCount >= Number(room.capacity || 0);
}

function renderDashboard() {
  const availableSlotsCount = rooms.reduce((sum, room) => {
    if (room.status === "Maintenance" || room.status === "Reserved") return sum;
    return sum + getAvailableSlots(room);
  }, 0);

  const totalDueAmount = bills.reduce((sum, bill) => sum + bill.total, 0);
  const dueTodayCount = bills.filter(bill => bill.status === "Due Today").length;
  const overdueCount = bills.filter(bill => bill.status === "Overdue").length;
  const openRequests = requests.filter(request => request.status !== "Done").length;

  totalRooms.textContent = rooms.length;
  totalTenants.textContent = tenants.length;
  availableSlots.textContent = availableSlotsCount;
  totalDue.textContent = peso.format(totalDueAmount);

  miniDueToday.textContent = dueTodayCount;
  miniOverdue.textContent = overdueCount;
  miniRequests.textContent = openRequests;

  const notifications = [];

  if (dueTodayCount > 0) notifications.push({ title: "Due Today", message: `${dueTodayCount} bill/s need payment follow-up today.`, type: "warning" });
  if (overdueCount > 0) notifications.push({ title: "Overdue Payments", message: `${overdueCount} tenant/guest bill/s are overdue.`, type: "danger" });
  if (availableSlotsCount > 0) notifications.push({ title: "Available Slots", message: `${availableSlotsCount} available slot/s can still be offered.`, type: "success" });
  if (openRequests > 0) notifications.push({ title: "Maintenance Requests", message: `${openRequests} open request/s need attention.`, type: "warning" });

  if (notifications.length === 0) {
    notificationList.innerHTML = `<div class="empty">No alerts yet. Add rooms, tenants, bills, or requests to see updates.</div>`;
    return;
  }

  notificationList.innerHTML = notifications.map(note => {
    const badgeClass = note.type === "danger" ? "danger" : note.type === "warning" ? "warning" : "";

    return `
      <div class="alert-card">
        <strong>${note.title}</strong>
        <span>${note.message}</span><br>
        <span class="badge ${badgeClass}">${note.type}</span>
      </div>
    `;
  }).join("");
}

function renderTenants() {
  if (tenants.length === 0) {
    tenantList.innerHTML = `<div class="empty">No tenant or guest records yet.</div>`;
    return;
  }

  tenantList.innerHTML = tenants.map(tenant => `
    <div class="record-card">
      <strong>${tenant.name}</strong>
      <span>
        ${tenant.type} | ${tenant.contact || "No contact"}<br>
        Room / Unit: ${tenant.room || "Unassigned"}<br>
        ${tenant.deck ? `Bed Position: ${tenant.deck}<br>` : ""}
        Address: ${tenant.address || "N/A"}<br>
        Valid ID: ${tenant.idInfo || "N/A"}<br>
        Emergency Contact: ${tenant.emergency || "N/A"}<br>
        Date Added: ${tenant.dateAdded}
      </span>

      <div class="record-actions">
        <button type="button" class="mini-btn" data-edit-tenant="${tenant.id}">Edit</button>
        <button type="button" class="mini-btn danger" data-delete-tenant="${tenant.id}">Delete</button>
      </div>
    </div>
  `).join("");
}

function renderRooms() {
  if (rooms.length === 0) {
    roomList.innerHTML = `<div class="empty">No rooms or units added yet.</div>`;
    return;
  }

  roomList.innerHTML = rooms.map(room => {
    const occupied = getRoomOccupancy(room.id);
    const available = getAvailableSlots(room);
    const displayStatus = getDisplayRoomStatus(room);

    const badgeClass =
      displayStatus === "Maintenance" ? "danger" :
      displayStatus === "Reserved" ? "warning" :
      displayStatus === "Occupied" ? "warning" : "";

    return `
      <div class="record-card">
        <strong>Room / Unit ${room.number}</strong>
        <span>
          ${room.type} | <span class="badge ${badgeClass}">${displayStatus}</span><br>
          Capacity: ${room.capacity}<br>
          Assigned Tenants: ${occupied}<br>
          Available Slots: ${available}<br>
          Rate: ${peso.format(room.rate)} / ${room.rateType}
        </span>

        <div class="record-actions">
          <button type="button" class="mini-btn" data-edit-room="${room.id}">Edit</button>
          <button type="button" class="mini-btn danger" data-delete-room="${room.id}">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderBilling() {
  if (bills.length === 0) {
    billingList.innerHTML = `<div class="empty">No billing records yet.</div>`;
    return;
  }

  billingList.innerHTML = bills.map(bill => {
    const badgeClass =
      bill.status === "Overdue" ? "danger" :
      bill.status === "Due Today" || bill.status === "Partial" ? "warning" : "";

    return `
      <div class="record-card">
        <strong>${bill.name}</strong>
        <span>
          ${bill.type || ""} ${bill.room ? `| Room ${bill.room}` : ""} ${bill.deck ? `| ${bill.deck}` : ""}<br>
          Billing Period: ${bill.period}<br>
          Charge Type: ${bill.rateType}<br>
          Status: <span class="badge ${badgeClass}">${bill.status}</span><br>
          Rent / Fee: ${peso.format(bill.rent)}<br>
          Utilities: Water ${peso.format(bill.water)}, Electric ${peso.format(bill.electric)}, Internet ${peso.format(bill.internet)}<br>
          Other Charges: ${peso.format(bill.other)} | Discount: ${peso.format(bill.discount)}<br>
          Advance: ${peso.format(bill.advance)} | Deposit: ${peso.format(bill.deposit)}<br>
          <strong>Total Due: ${peso.format(bill.total)}</strong>
        </span>

        <div class="record-actions">
          <button type="button" class="mini-btn" data-edit-bill="${bill.id}">Edit Bill</button>
          <button type="button" class="mini-btn" data-mark-paid="${bill.id}">Mark Paid</button>
          <button type="button" class="mini-btn danger" data-delete-bill="${bill.id}">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderInvoice() {
  if (bills.length === 0) {
    invoiceArea.innerHTML = "<p>No invoice yet. Create a bill first.</p>";
    return;
  }

  const bill = bills[bills.length - 1];

  invoiceArea.innerHTML = `
    <h2>${profile.property}</h2>
    <p><strong>Owner / Manager:</strong> ${profile.owner}</p>
    <p><strong>Address:</strong> ${profile.address || "N/A"}</p>
    <p><strong>Contact:</strong> ${profile.contact || "N/A"}</p>

    <hr>

    <h3>Statement of Account</h3>
    <p><strong>Tenant / Guest:</strong> ${bill.name}</p>
    <p><strong>Room / Unit:</strong> ${bill.room || "N/A"}</p>
    <p><strong>Type:</strong> ${bill.type || "N/A"}</p>
    ${bill.deck ? `<p><strong>Bed Position:</strong> ${bill.deck}</p>` : ""}
    <p><strong>Billing Period:</strong> ${bill.period}</p>
    <p><strong>Billing Date:</strong> ${bill.date}</p>
    <p><strong>Payment Status:</strong> ${bill.status}</p>

    <hr>

    <p>${bill.rateType}: ${peso.format(bill.rent)}</p>
    <p>Water: ${peso.format(bill.water)}</p>
    <p>Electric: ${peso.format(bill.electric)}</p>
    <p>Internet: ${peso.format(bill.internet)}</p>
    <p>Other Charges: ${peso.format(bill.other)}</p>
    <p>Deposit: ${peso.format(bill.deposit)}</p>
    <p>Advance Payment: -${peso.format(bill.advance)}</p>
    <p>Discount: -${peso.format(bill.discount)}</p>

    <hr>

    <h3>Balance / Total Due: ${peso.format(bill.total)}</h3>

    <p>Prepared by: ___________________________</p>
    <p>Received by: ___________________________</p>
  `;
}

function renderReports() {
  const occupiedRooms = rooms.filter(room => getDisplayRoomStatus(room) === "Occupied").length;
  const availableRooms = rooms.filter(room => getDisplayRoomStatus(room) === "Available").length;
  const paidCollection = bills.filter(bill => bill.status === "Paid").reduce((sum, bill) => sum + bill.total, 0);

  reportsArea.innerHTML = `
    <div class="report-actions">
      <button type="button" class="secondary-btn" onclick="exportCSV('tenants')">Export Tenants CSV</button>
      <button type="button" class="secondary-btn" onclick="exportCSV('rooms')">Export Rooms CSV</button>
      <button type="button" class="secondary-btn" onclick="exportCSV('billing')">Export Billing CSV</button>
      <button type="button" class="secondary-btn" onclick="exportCSV('maintenance')">Export Maintenance CSV</button>
      <button type="button" class="primary-btn" onclick="window.print()">Print / Save PDF</button>
    </div>

    <div class="report-card"><strong>Occupancy Report</strong><span>${occupiedRooms} full room/s out of ${rooms.length} rooms.</span></div>
    <div class="report-card"><strong>Monthly Collection</strong><span>${peso.format(paidCollection)}</span></div>
    <div class="report-card"><strong>Unpaid Tenants</strong><span>${bills.filter(bill => bill.status === "Unpaid").length}</span></div>
    <div class="report-card"><strong>Overdue Tenants</strong><span>${bills.filter(bill => bill.status === "Overdue").length}</span></div>
    <div class="report-card"><strong>Available Rooms</strong><span>${availableRooms}</span></div>
    <div class="report-card"><strong>Tenant History</strong><span>${tenants.length} tenant / guest records.</span></div>
  `;
}

function renderSmsTemplates() {
  smsTemplates.innerHTML = `
    <div class="template-card"><strong>Due Date Reminder</strong><span>Hello [Name], reminder lang po na due na ang rent/payment ninyo on [Date]. Thank you.</span></div>
    <div class="template-card"><strong>Overdue Notice</strong><span>Hello [Name], overdue na po ang balance ninyo na [Amount]. Please settle as soon as possible.</span></div>
    <div class="template-card"><strong>Payment Confirmation</strong><span>Hello [Name], received po ang payment ninyo na [Amount]. Thank you.</span></div>
    <div class="template-card"><strong>Announcement</strong><span>Hello tenants/guests, announcement po: [Message]. Thank you.</span></div>
    <div class="template-card"><strong>Maintenance Notice</strong><span>Hello [Name], may scheduled maintenance po sa [Area] on [Date].</span></div>
    <div class="template-card"><strong>Check-in / Check-out Reminder</strong><span>Hello [Name], reminder po for your check-in/check-out on [Date].</span></div>
  `;
}

function renderMaintenance() {
  if (requests.length === 0) {
    maintenanceList.innerHTML = `<div class="empty">No maintenance or tenant requests yet.</div>`;
    return;
  }

  maintenanceList.innerHTML = requests.map(request => `
    <div class="record-card">
      <strong>${request.issue}</strong>
      <span>
        Tenant / Guest: ${request.tenant}<br>
        Room / Unit: ${request.room}<br>
        Priority: <span class="badge ${request.priority === "Urgent" ? "danger" : ""}">${request.priority}</span><br>
        Status: ${request.status}<br>
        Date: ${request.date}
      </span>

      <div class="record-actions">
        <button type="button" class="mini-btn" data-edit-request="${request.id}">Edit</button>
        <button type="button" class="mini-btn" data-mark-done="${request.id}">Mark Done</button>
        <button type="button" class="mini-btn danger" data-delete-request="${request.id}">Delete</button>
      </div>
    </div>
  `).join("");
}

function loadTenantForEdit(id) {
  const tenant = tenants.find(item => item.id === id);
  if (!tenant) return;

  editingTenantId = id;
  tenantName.value = tenant.name;
  tenantContact.value = tenant.contact;
  tenantAddress.value = tenant.address;
  tenantId.value = tenant.idInfo;
  tenantEmergency.value = tenant.emergency;
  tenantType.value = tenant.type;
  tenantRoom.value = tenant.roomId;
  tenantDeck.value = tenant.deck;
  tenantSubmitBtn.textContent = "Update Tenant / Guest";
  toggleTenantDeck();
  switchTab("tenants");
}

function deleteTenant(id) {
  if (!confirm("Delete this tenant / guest record?")) return;
  tenants = tenants.filter(item => item.id !== id);
  save();
  render();
}

function loadRoomForEdit(id) {
  const room = rooms.find(item => item.id === id);
  if (!room) return;

  editingRoomId = id;
  roomNumber.value = room.number;
  roomType.value = room.type;
  capacity.value = room.capacity;
  rateType.value = room.rateType;
  rate.value = room.rate;
  roomStatus.value = room.status;
  roomSubmitBtn.textContent = "Update Room";
  switchTab("rooms");
}

function deleteRoom(id) {
  if (tenants.some(tenant => tenant.roomId === id)) {
    alert("Cannot delete room with assigned tenants.");
    return;
  }

  if (!confirm("Delete this room / unit record?")) return;
  rooms = rooms.filter(item => item.id !== id);
  save();
  render();
}

function loadBillForEdit(id) {
  const bill = bills.find(item => item.id === id);
  if (!bill) return;

  editingBillId = id;
  billTenant.value = bill.tenantId;
  billingFrom.value = bill.from;
  billingTo.value = bill.to;
  billRateType.value = bill.rateType;
  rent.value = bill.rent;
  advance.value = bill.advance;
  deposit.value = bill.deposit;
  water.value = bill.water;
  electric.value = bill.electric;
  internet.value = bill.internet;
  other.value = bill.other;
  discount.value = bill.discount;
  paymentStatus.value = bill.status;
  billingSubmitBtn.textContent = "Update Bill";
  switchTab("billing");
}

function markBillPaid(id) {
  bills = bills.map(bill => bill.id === id ? { ...bill, status: "Paid" } : bill);
  save();
  render();
}

function deleteBill(id) {
  if (!confirm("Delete this billing record?")) return;
  bills = bills.filter(item => item.id !== id);
  save();
  render();
}

function loadRequestForEdit(id) {
  const request = requests.find(item => item.id === id);
  if (!request) return;

  editingRequestId = id;
  requestTenant.value = request.tenant;
  requestRoom.value = request.room;
  requestIssue.value = request.issue;
  requestPriority.value = request.priority;
  requestStatus.value = request.status;
  maintenanceSubmitBtn.textContent = "Update Request";
  switchTab("maintenance");
}

function markRequestDone(id) {
  requests = requests.map(request => request.id === id ? { ...request, status: "Done" } : request);
  save();
  render();
}

function deleteRequest(id) {
  if (!confirm("Delete this maintenance request?")) return;
  requests = requests.filter(item => item.id !== id);
  save();
  render();
}

function exportCSV(type) {
  let filename = "";
  let rows = [];

  if (type === "tenants") {
    filename = "tenants.csv";
    rows = [
      ["Name", "Contact", "Address", "Valid ID", "Emergency Contact", "Type", "Room", "Bed Position", "Date Added"],
      ...tenants.map(tenant => [tenant.name, tenant.contact, tenant.address, tenant.idInfo, tenant.emergency, tenant.type, tenant.room, tenant.deck, tenant.dateAdded])
    ];
  }

  if (type === "rooms") {
    filename = "rooms.csv";
    rows = [
      ["Room / Unit", "Type", "Capacity", "Assigned Tenants", "Available Slots", "Rate", "Rate Type", "Status"],
      ...rooms.map(room => [room.number, room.type, room.capacity, getRoomOccupancy(room.id), getAvailableSlots(room), room.rate, room.rateType, getDisplayRoomStatus(room)])
    ];
  }

  if (type === "billing") {
    filename = "billing.csv";
    rows = [
      ["Tenant / Guest", "Room", "Type", "Bed Position", "Billing Period", "Charge Type", "Rent / Fee", "Advance", "Deposit", "Water", "Electric", "Internet", "Other", "Discount", "Total Due", "Status", "Date"],
      ...bills.map(bill => [bill.name, bill.room, bill.type, bill.deck, bill.period, bill.rateType, bill.rent, bill.advance, bill.deposit, bill.water, bill.electric, bill.internet, bill.other, bill.discount, bill.total, bill.status, bill.date])
    ];
  }

  if (type === "maintenance") {
    filename = "maintenance.csv";
    rows = [
      ["Tenant / Guest", "Room / Unit", "Issue", "Priority", "Status", "Date"],
      ...requests.map(request => [request.tenant, request.room, request.issue, request.priority, request.status, request.date])
    ];
  }

  downloadCSV(filename, rows);
}

function downloadCSV(filename, rows) {
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function updateContract() {
  contractText.value = `${contractType.value}

Property: ${profile.property}
Owner / Manager: ${profile.owner}
Address: ${profile.address || "______________________________"}
Contact Number: ${profile.contact || "______________________________"}

This agreement is made between the property owner/manager and the tenant/guest.

Property / Room: ______________________________
Tenant / Guest Name: __________________________
Contact Number: _______________________________
Start Date: ___________________________________
End Date: _____________________________________
Rate / Payment Terms: _________________________
Advance / Deposit: ____________________________

House Rules:
1. Keep the room and common areas clean.
2. Pay rent or fees on time.
3. No illegal activities.
4. Respect other tenants and guests.
5. Damages caused by tenant/guest must be paid.
6. Visitors must follow property rules.
7. Quiet hours must be observed.
8. Check-in and check-out rules must be followed for transient stays.

Payment Terms:
__________________________________________________________________
__________________________________________________________________

Signature of Tenant/Guest: ____________________

Signature of Owner/Manager: ___________________
`;
}

syncRateType();
render();
