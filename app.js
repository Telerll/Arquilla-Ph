let profile = JSON.parse(localStorage.getItem("profile")) || {
  owner: "ArquillaPh",
  property: "ArquillaPh Rental Property System",
  address: "",
  contact: "",
  email: "",
  type: "Mixed Rental"
};

let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
let bills = JSON.parse(localStorage.getItem("bills")) || [];
let requests = JSON.parse(localStorage.getItem("requests")) || [];

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

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

document.querySelectorAll("[data-tab-jump]").forEach(button => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tabJump);
  });
});

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.remove("active");
  });

  document.getElementById(tabName).classList.add("active");

  const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }

  pageTitle.textContent = pageTitles[tabName] || "Dashboard";
  render();
}

setupForm.addEventListener("submit", event => {
  event.preventDefault();

  profile = {
    owner: ownerName.value || "ArquillaPh",
    property: propertyName.value || "ArquillaPh Property",
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

  tenants.push({
    name: tenantName.value,
    contact: tenantContact.value,
    address: tenantAddress.value,
    idInfo: tenantId.value,
    emergency: tenantEmergency.value,
    type: tenantType.value,
    dateAdded: new Date().toLocaleDateString()
  });

  save();
  event.target.reset();
  render();
});

roomForm.addEventListener("submit", event => {
  event.preventDefault();

  rooms.push({
    number: roomNumber.value,
    type: roomType.value,
    capacity: Number(capacity.value || 0),
    occupied: Number(occupiedBeds.value || 0),
    rate: Number(rate.value || 0),
    status: roomStatus.value
  });

  save();
  event.target.reset();
  render();
});

billingForm.addEventListener("submit", event => {
  event.preventDefault();

  const bill = {
    name: billName.value,
    period: billingPeriod.value || "Current Billing Period",
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

  bill.total =
    bill.rent +
    bill.deposit +
    bill.water +
    bill.electric +
    bill.internet +
    bill.other -
    bill.advance -
    bill.discount;

  bills.push(bill);

  save();
  event.target.reset();
  render();
});

maintenanceForm.addEventListener("submit", event => {
  event.preventDefault();

  requests.push({
    tenant: requestTenant.value || "N/A",
    room: requestRoom.value || "N/A",
    issue: requestIssue.value,
    priority: requestPriority.value,
    status: requestStatus.value,
    date: new Date().toLocaleDateString()
  });

  save();
  event.target.reset();
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

function render() {
  renderProfile();
  renderDashboard();
  renderTenants();
  renderRooms();
  renderBilling();
  renderInvoice();
  renderReports();
  renderSmsTemplates();
  renderMaintenance();
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

function renderDashboard() {
  const availableSlotsCount = rooms.reduce((sum, room) => {
    return sum + Math.max(room.capacity - room.occupied, 0);
  }, 0);

  const totalDueAmount = bills.reduce((sum, bill) => {
    return sum + bill.total;
  }, 0);

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

  if (dueTodayCount > 0) {
    notifications.push({
      title: "Due Today",
      message: `${dueTodayCount} bill/s need payment follow-up today.`,
      type: "warning"
    });
  }

  if (overdueCount > 0) {
    notifications.push({
      title: "Overdue Payments",
      message: `${overdueCount} tenant/guest bill/s are overdue.`,
      type: "danger"
    });
  }

  if (availableSlotsCount > 0) {
    notifications.push({
      title: "Available Slots",
      message: `${availableSlotsCount} available slot/s can still be offered.`,
      type: "success"
    });
  }

  if (openRequests > 0) {
    notifications.push({
      title: "Maintenance Requests",
      message: `${openRequests} open request/s need attention.`,
      type: "warning"
    });
  }

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

  tenantList.innerHTML = tenants.map(tenant => {
    return `
      <div class="record-card">
        <strong>${tenant.name}</strong>
        <span>
          ${tenant.type} | ${tenant.contact || "No contact"}<br>
          Address: ${tenant.address || "N/A"}<br>
          Valid ID: ${tenant.idInfo || "N/A"}<br>
          Emergency Contact: ${tenant.emergency || "N/A"}<br>
          Date Added: ${tenant.dateAdded}
        </span>
      </div>
    `;
  }).join("");
}

function renderRooms() {
  if (rooms.length === 0) {
    roomList.innerHTML = `<div class="empty">No rooms or units added yet.</div>`;
    return;
  }

  roomList.innerHTML = rooms.map(room => {
    const available = Math.max(room.capacity - room.occupied, 0);
    const badgeClass =
      room.status === "Maintenance" ? "danger" :
      room.status === "Reserved" ? "warning" : "";

    return `
      <div class="record-card">
        <strong>Room / Unit ${room.number}</strong>
        <span>
          ${room.type} | <span class="badge ${badgeClass}">${room.status}</span><br>
          Capacity: ${room.capacity}<br>
          Occupied Beds: ${room.occupied}<br>
          Available Slots: ${available}<br>
          Rate: ${peso.format(room.rate)}
        </span>
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
          Billing Period: ${bill.period}<br>
          Status: <span class="badge ${badgeClass}">${bill.status}</span><br>
          Rent / Fee: ${peso.format(bill.rent)}<br>
          Utilities: Water ${peso.format(bill.water)}, Electric ${peso.format(bill.electric)}, Internet ${peso.format(bill.internet)}<br>
          Other Charges: ${peso.format(bill.other)} | Discount: ${peso.format(bill.discount)}<br>
          Advance: ${peso.format(bill.advance)} | Deposit: ${peso.format(bill.deposit)}<br>
          <strong>Total Due: ${peso.format(bill.total)}</strong>
        </span>
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
    <p><strong>Billing Period:</strong> ${bill.period}</p>
    <p><strong>Billing Date:</strong> ${bill.date}</p>
    <p><strong>Payment Status:</strong> ${bill.status}</p>

    <hr>

    <p>Rent / Daily Fee: ${peso.format(bill.rent)}</p>
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
  const occupiedRooms = rooms.filter(room => room.status === "Occupied").length;
  const availableRooms = rooms.filter(room => room.status === "Available").length;
  const paidCollection = bills
    .filter(bill => bill.status === "Paid")
    .reduce((sum, bill) => sum + bill.total, 0);

  reportsArea.innerHTML = `
    <div class="report-card">
      <strong>Occupancy Report</strong>
      <span>${occupiedRooms} occupied out of ${rooms.length} rooms.</span>
    </div>

    <div class="report-card">
      <strong>Monthly Collection</strong>
      <span>${peso.format(paidCollection)}</span>
    </div>

    <div class="report-card">
      <strong>Unpaid Tenants</strong>
      <span>${bills.filter(bill => bill.status === "Unpaid").length}</span>
    </div>

    <div class="report-card">
      <strong>Overdue Tenants</strong>
      <span>${bills.filter(bill => bill.status === "Overdue").length}</span>
    </div>

    <div class="report-card">
      <strong>Available Rooms</strong>
      <span>${availableRooms}</span>
    </div>

    <div class="report-card">
      <strong>Tenant History</strong>
      <span>${tenants.length} tenant / guest records.</span>
    </div>
  `;
}

function renderSmsTemplates() {
  smsTemplates.innerHTML = `
    <div class="template-card">
      <strong>Due Date Reminder</strong>
      <span>Hello [Name], reminder lang po na due na ang rent/payment ninyo on [Date]. Thank you.</span>
    </div>

    <div class="template-card">
      <strong>Overdue Notice</strong>
      <span>Hello [Name], overdue na po ang balance ninyo na [Amount]. Please settle as soon as possible.</span>
    </div>

    <div class="template-card">
      <strong>Payment Confirmation</strong>
      <span>Hello [Name], received po ang payment ninyo na [Amount]. Thank you.</span>
    </div>

    <div class="template-card">
      <strong>Announcement</strong>
      <span>Hello tenants/guests, announcement po: [Message]. Thank you.</span>
    </div>

    <div class="template-card">
      <strong>Maintenance Notice</strong>
      <span>Hello [Name], may scheduled maintenance po sa [Area] on [Date].</span>
    </div>

    <div class="template-card">
      <strong>Check-in / Check-out Reminder</strong>
      <span>Hello [Name], reminder po for your check-in/check-out on [Date].</span>
    </div>
  `;
}

function renderMaintenance() {
  if (requests.length === 0) {
    maintenanceList.innerHTML = `<div class="empty">No maintenance or tenant requests yet.</div>`;
    return;
  }

  maintenanceList.innerHTML = requests.map(request => {
    const badgeClass =
      request.priority === "Urgent" ? "danger" :
      request.status === "In Progress" ? "warning" : "";

    return `
      <div class="record-card">
        <strong>${request.issue}</strong>
        <span>
          Tenant / Guest: ${request.tenant}<br>
          Room / Unit: ${request.room}<br>
          Priority: <span class="badge ${badgeClass}">${request.priority}</span><br>
          Status: ${request.status}<br>
          Date: ${request.date}
        </span>
      </div>
    `;
  }).join("");
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

render();
