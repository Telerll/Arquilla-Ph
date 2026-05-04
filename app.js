let tenants = JSON.parse(localStorage.getItem("tenants")) || [];
let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
let bills = JSON.parse(localStorage.getItem("bills")) || [];

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP"
});

document.querySelectorAll(".sidebar button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.remove("active");
    });

    document.getElementById(button.dataset.tab).classList.add("active");
    render();
  });
});

document.getElementById("tenantForm").addEventListener("submit", event => {
  event.preventDefault();

  tenants.push({
    name: tenantName.value,
    contact: tenantContact.value,
    address: tenantAddress.value,
    idInfo: tenantId.value,
    emergency: tenantEmergency.value,
    type: tenantType.value
  });

  save();
  event.target.reset();
  render();
});

document.getElementById("roomForm").addEventListener("submit", event => {
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

document.getElementById("billingForm").addEventListener("submit", event => {
  event.preventDefault();

  const bill = {
    name: billName.value,
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

contractType.addEventListener("change", updateContract);

function save() {
  localStorage.setItem("tenants", JSON.stringify(tenants));
  localStorage.setItem("rooms", JSON.stringify(rooms));
  localStorage.setItem("bills", JSON.stringify(bills));
}

function render() {
  totalRooms.textContent = rooms.length;

  occupiedRooms.textContent = rooms.filter(room => {
    return room.status === "Occupied";
  }).length;

  availableSlots.textContent = rooms.reduce((sum, room) => {
    return sum + Math.max(room.capacity - room.occupied, 0);
  }, 0);

  totalDue.textContent = peso.format(
    bills.reduce((sum, bill) => sum + bill.total, 0)
  );

  tenantList.innerHTML = tenants.map(tenant => {
    return `
      <div class="item">
        <strong>${tenant.name}</strong><br>
        Type: ${tenant.type}<br>
        Contact: ${tenant.contact}<br>
        Address: ${tenant.address}<br>
        Valid ID: ${tenant.idInfo}<br>
        Emergency Contact: ${tenant.emergency}
      </div>
    `;
  }).join("");

  roomList.innerHTML = rooms.map(room => {
    return `
      <div class="item">
        <strong>Room / Unit ${room.number}</strong><br>
        Type: ${room.type}<br>
        Status: <span class="status">${room.status}</span><br>
        Capacity: ${room.capacity}<br>
        Occupied Beds: ${room.occupied}<br>
        Available Slots: ${Math.max(room.capacity - room.occupied, 0)}<br>
        Rate: ${peso.format(room.rate)}
      </div>
    `;
  }).join("");

  billingList.innerHTML = bills.map(bill => {
    return `
      <div class="item">
        <strong>${bill.name}</strong><br>
        Payment Status: <span class="status">${bill.status}</span><br>
        Rent / Fee: ${peso.format(bill.rent)}<br>
        Advance Payment: ${peso.format(bill.advance)}<br>
        Deposit: ${peso.format(bill.deposit)}<br>
        Water: ${peso.format(bill.water)}<br>
        Electric: ${peso.format(bill.electric)}<br>
        Internet: ${peso.format(bill.internet)}<br>
        Other Charges: ${peso.format(bill.other)}<br>
        Discount: ${peso.format(bill.discount)}<br>
        <strong>Total Due: ${peso.format(bill.total)}</strong>
      </div>
    `;
  }).join("");

  if (bills.length === 0) {
    invoiceArea.innerHTML = "<p>No invoice yet. Create a bill first.</p>";
  } else {
    const bill = bills[bills.length - 1];

    invoiceArea.innerHTML = `
      <h3>ArquillaPh Rental Property Management System</h3>
      <h4>Statement of Account</h4>

      <p><strong>Tenant / Guest:</strong> ${bill.name}</p>
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

  reportsArea.innerHTML = `
    <div class="item">
      <strong>Occupancy Report</strong><br>
      ${rooms.filter(room => room.status === "Occupied").length} occupied out of ${rooms.length} rooms.
    </div>

    <div class="item">
      <strong>Monthly Collection</strong><br>
      ${peso.format(
        bills
          .filter(bill => bill.status === "Paid")
          .reduce((sum, bill) => sum + bill.total, 0)
      )}
    </div>

    <div class="item">
      <strong>Unpaid Tenants</strong><br>
      ${bills.filter(bill => bill.status === "Unpaid").length}
    </div>

    <div class="item">
      <strong>Overdue Tenants</strong><br>
      ${bills.filter(bill => bill.status === "Overdue").length}
    </div>

    <div class="item">
      <strong>Available Rooms</strong><br>
      ${rooms.filter(room => room.status === "Available").length}
    </div>

    <div class="item">
      <strong>Tenant History</strong><br>
      ${tenants.length} tenant / guest records.
    </div>
  `;

  smsTemplates.innerHTML = `
    <div class="item">
      <strong>Due Date Reminder</strong><br>
      Hello [Name], reminder lang po na due na ang rent/payment ninyo on [Date]. Thank you.
    </div>

    <div class="item">
      <strong>Overdue Notice</strong><br>
      Hello [Name], overdue na po ang balance ninyo na [Amount]. Please settle as soon as possible.
    </div>

    <div class="item">
      <strong>Payment Confirmation</strong><br>
      Hello [Name], received po ang payment ninyo na [Amount]. Thank you.
    </div>

    <div class="item">
      <strong>Announcement</strong><br>
      Hello tenants/guests, announcement po: [Message]. Thank you.
    </div>

    <div class="item">
      <strong>Maintenance Notice</strong><br>
      Hello [Name], may scheduled maintenance po sa [Area] on [Date].
    </div>

    <div class="item">
      <strong>Check-in / Check-out Reminder</strong><br>
      Hello [Name], reminder po for your check-in/check-out on [Date].
    </div>
  `;
}

function updateContract() {
  contractText.value = `${contractType.value}

This agreement is made between the property owner/manager and the tenant/guest.

Property / Room: ______________________________
Tenant / Guest Name: __________________________
Contact Number: _______________________________
Start Date: ___________________________________
End Date: _____________________________________
Rate / Payment Terms: _________________________

House Rules:
1. Keep the room and common areas clean.
2. Pay rent or fees on time.
3. No illegal activities.
4. Respect other tenants and guests.
5. Damages caused by tenant/guest must be paid.
6. Visitors must follow property rules.
7. Quiet hours must be observed.

Signature of Tenant/Guest: ____________________

Signature of Owner/Manager: ___________________
`;
}

updateContract();
render();
