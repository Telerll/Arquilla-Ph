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

  tenants.push({
    name: tenantName.value,
    contact: tenantContact.value,
    address: tenantAddress.value,
    idInfo: tenantId.value,
    emergency: tenantEmergency.value,
    type: tenantType.value,
    dateAdded: new Date().toLocaleDateString()
 
