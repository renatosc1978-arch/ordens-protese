const WORK_TYPES = ["protocolo", "coroa", "guia cirurgico", "placa", "provisorio", "zirconia", "dissilicato", "PMMA"];
const STATUSES = ["recebido", "em desenho", "em fresagem", "em acabamento", "pronto", "entregue"];
const STORAGE_KEY = "protese-os-app-v1";

const state = loadState();

const els = {
  navButtons: document.querySelectorAll(".nav-button"),
  openViewButtons: document.querySelectorAll("[data-open-view]"),
  views: {
    dashboard: document.getElementById("dashboardView"),
    orders: document.getElementById("ordersView"),
    clients: document.getElementById("clientsView"),
    patients: document.getElementById("patientsView"),
    search: document.getElementById("searchView"),
    reports: document.getElementById("reportsView")
  },
  metricGrid: document.getElementById("metricGrid"),
  upcomingList: document.getElementById("upcomingList"),
  statusSummary: document.getElementById("statusSummary"),
  orderForm: document.getElementById("orderForm"),
  orderId: document.getElementById("orderId"),
  orderClient: document.getElementById("orderClient"),
  orderPatient: document.getElementById("orderPatient"),
  orderWorkType: document.getElementById("orderWorkType"),
  orderStatus: document.getElementById("orderStatus"),
  orderDueDate: document.getElementById("orderDueDate"),
  orderValue: document.getElementById("orderValue"),
  orderNotes: document.getElementById("orderNotes"),
  clearOrderForm: document.getElementById("clearOrderForm"),
  orderQuickFilter: document.getElementById("orderQuickFilter"),
  ordersTable: document.getElementById("ordersTable"),
  clientForm: document.getElementById("clientForm"),
  clientId: document.getElementById("clientId"),
  clientName: document.getElementById("clientName"),
  clientCro: document.getElementById("clientCro"),
  clientPhone: document.getElementById("clientPhone"),
  clientEmail: document.getElementById("clientEmail"),
  clientNotes: document.getElementById("clientNotes"),
  clearClientForm: document.getElementById("clearClientForm"),
  clientsList: document.getElementById("clientsList"),
  patientForm: document.getElementById("patientForm"),
  patientId: document.getElementById("patientId"),
  patientName: document.getElementById("patientName"),
  patientClient: document.getElementById("patientClient"),
  patientPhone: document.getElementById("patientPhone"),
  patientBirthDate: document.getElementById("patientBirthDate"),
  patientNotes: document.getElementById("patientNotes"),
  clearPatientForm: document.getElementById("clearPatientForm"),
  patientsList: document.getElementById("patientsList"),
  globalSearch: document.getElementById("globalSearch"),
  searchStatus: document.getElementById("searchStatus"),
  searchWorkType: document.getElementById("searchWorkType"),
  searchResults: document.getElementById("searchResults"),
  reportMonth: document.getElementById("reportMonth"),
  currentMonthButton: document.getElementById("currentMonthButton"),
  reportMetrics: document.getElementById("reportMetrics"),
  reportByType: document.getElementById("reportByType"),
  reportOrders: document.getElementById("reportOrders"),
  exportDataButton: document.getElementById("exportDataButton"),
  importDataInput: document.getElementById("importDataInput"),
  toast: document.getElementById("toast")
};

init();

function init() {
  populateStaticSelects();
  setCurrentReportMonth();
  bindEvents();
  renderAll();
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  els.openViewButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.openView));
  });

  els.clientForm.addEventListener("submit", saveClient);
  els.patientForm.addEventListener("submit", savePatient);
  els.orderForm.addEventListener("submit", saveOrder);

  els.clearClientForm.addEventListener("click", resetClientForm);
  els.clearPatientForm.addEventListener("click", resetPatientForm);
  els.clearOrderForm.addEventListener("click", resetOrderForm);

  els.orderQuickFilter.addEventListener("input", renderOrdersTable);
  els.globalSearch.addEventListener("input", renderSearch);
  els.searchStatus.addEventListener("change", renderSearch);
  els.searchWorkType.addEventListener("change", renderSearch);
  els.reportMonth.addEventListener("change", renderReports);
  els.currentMonthButton.addEventListener("click", () => {
    setCurrentReportMonth();
    renderReports();
  });

  els.orderClient.addEventListener("change", () => populatePatientSelect(els.orderPatient, els.orderClient.value));
  els.exportDataButton.addEventListener("click", exportData);
  els.importDataInput.addEventListener("change", importData);
}

function populateStaticSelects() {
  fillOptions(els.orderWorkType, WORK_TYPES);
  fillOptions(els.orderStatus, STATUSES);
  fillOptions(els.searchStatus, ["todos os status", ...STATUSES]);
  fillOptions(els.searchWorkType, ["todos os tipos", ...WORK_TYPES]);
}

function renderAll() {
  populateClientSelects();
  renderClients();
  renderPatients();
  renderOrdersTable();
  renderDashboard();
  renderSearch();
  renderReports();
}

function showView(viewName) {
  Object.entries(els.views).forEach(([name, view]) => view.classList.toggle("active", name === viewName));
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
}

function saveClient(event) {
  event.preventDefault();
  const id = els.clientId.value || createId("cli");
  upsert(state.clients, {
    id,
    name: els.clientName.value.trim(),
    cro: els.clientCro.value.trim(),
    phone: els.clientPhone.value.trim(),
    email: els.clientEmail.value.trim(),
    notes: els.clientNotes.value.trim()
  });
  persist();
  resetClientForm();
  renderAll();
  toast("Cliente salvo.");
}

function savePatient(event) {
  event.preventDefault();
  if (!state.clients.length) {
    toast("Cadastre um cliente antes de salvar pacientes.");
    return;
  }
  const id = els.patientId.value || createId("pac");
  upsert(state.patients, {
    id,
    name: els.patientName.value.trim(),
    clientId: els.patientClient.value,
    phone: els.patientPhone.value.trim(),
    birthDate: els.patientBirthDate.value,
    notes: els.patientNotes.value.trim()
  });
  persist();
  resetPatientForm();
  renderAll();
  toast("Paciente salvo.");
}

function saveOrder(event) {
  event.preventDefault();
  if (!state.clients.length || !state.patients.length) {
    toast("Cadastre cliente e paciente antes de salvar uma ordem.");
    return;
  }
  const id = els.orderId.value || createId("os");
  upsert(state.orders, {
    id,
    clientId: els.orderClient.value,
    patientId: els.orderPatient.value,
    workType: els.orderWorkType.value,
    status: els.orderStatus.value,
    dueDate: els.orderDueDate.value,
    value: Number(els.orderValue.value || 0),
    notes: els.orderNotes.value.trim(),
    createdAt: existingOrder(id)?.createdAt || new Date().toISOString()
  });
  persist();
  resetOrderForm();
  renderAll();
  toast("Ordem de servico salva.");
}

function renderDashboard() {
  const openOrders = state.orders.filter((order) => order.status !== "entregue");
  const readyOrders = state.orders.filter((order) => order.status === "pronto");
  const overdueOrders = openOrders.filter((order) => order.dueDate && order.dueDate < todayIso());
  const totalValue = state.orders.reduce((sum, order) => sum + Number(order.value || 0), 0);

  els.metricGrid.innerHTML = [
    metric("Ordens ativas", openOrders.length),
    metric("Prontas", readyOrders.length),
    metric("Em atraso", overdueOrders.length),
    metric("Valor total", formatMoney(totalValue))
  ].join("");

  const upcoming = [...openOrders]
    .filter((order) => order.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  els.upcomingList.innerHTML = upcoming.length
    ? upcoming.map(orderListItem).join("")
    : empty("Nenhuma entrega pendente.");

  renderStatusSummary(els.statusSummary, state.orders);
}

function renderOrdersTable() {
  const term = normalize(els.orderQuickFilter.value);
  const rows = state.orders
    .filter((order) => !term || normalize(orderSearchText(order)).includes(term))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .map((order) => `
      <tr>
        <td>${escapeHtml(order.id.toUpperCase())}</td>
        <td>${escapeHtml(clientName(order.clientId))}</td>
        <td>${escapeHtml(patientName(order.patientId))}</td>
        <td>${escapeHtml(order.workType)}</td>
        <td>${statusTag(order.status)}</td>
        <td>${formatDate(order.dueDate)}</td>
        <td>${formatMoney(order.value)}</td>
        <td>
          <div class="row-actions">
            <button class="small-button" type="button" onclick="editOrder('${order.id}')">Editar</button>
            <button class="small-button danger" type="button" onclick="deleteOrder('${order.id}')">Excluir</button>
          </div>
        </td>
      </tr>
    `);
  els.ordersTable.innerHTML = rows.length ? rows.join("") : tableEmpty(8, "Nenhuma ordem cadastrada.");
}

function renderClients() {
  els.clientsList.innerHTML = state.clients.length
    ? state.clients.map((client) => `
      <article class="entity-card">
        <h3>${escapeHtml(client.name)}</h3>
        <p>${escapeHtml(client.cro || "CRO nao informado")}</p>
        <p>${escapeHtml(client.phone || "Telefone nao informado")}</p>
        <p>${escapeHtml(client.email || "E-mail nao informado")}</p>
        ${client.notes ? `<p>${escapeHtml(client.notes)}</p>` : ""}
        <div class="row-actions">
          <button class="small-button" type="button" onclick="editClient('${client.id}')">Editar</button>
          <button class="small-button danger" type="button" onclick="deleteClient('${client.id}')">Excluir</button>
        </div>
      </article>
    `).join("")
    : empty("Nenhum cliente cadastrado.");
}

function renderPatients() {
  els.patientsList.innerHTML = state.patients.length
    ? state.patients.map((patient) => `
      <article class="entity-card">
        <h3>${escapeHtml(patient.name)}</h3>
        <p>${escapeHtml(clientName(patient.clientId))}</p>
        <p>${escapeHtml(patient.phone || "Telefone nao informado")}</p>
        <p>${patient.birthDate ? formatDate(patient.birthDate) : "Nascimento nao informado"}</p>
        ${patient.notes ? `<p>${escapeHtml(patient.notes)}</p>` : ""}
        <div class="row-actions">
          <button class="small-button" type="button" onclick="editPatient('${patient.id}')">Editar</button>
          <button class="small-button danger" type="button" onclick="deletePatient('${patient.id}')">Excluir</button>
        </div>
      </article>
    `).join("")
    : empty("Nenhum paciente cadastrado.");
}

function renderSearch() {
  const term = normalize(els.globalSearch.value);
  const status = els.searchStatus.value;
  const workType = els.searchWorkType.value;
  const rows = state.orders
    .filter((order) => !term || normalize(orderSearchText(order)).includes(term))
    .filter((order) => status === "todos os status" || order.status === status)
    .filter((order) => workType === "todos os tipos" || order.workType === workType)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .map((order) => `
      <tr>
        <td>${escapeHtml(order.id.toUpperCase())}</td>
        <td>${escapeHtml(clientName(order.clientId))}</td>
        <td>${escapeHtml(patientName(order.patientId))}</td>
        <td>${escapeHtml(order.workType)}</td>
        <td>${statusTag(order.status)}</td>
        <td>${formatDate(order.dueDate)}</td>
        <td>${formatMoney(order.value)}</td>
        <td>${escapeHtml(order.notes || "-")}</td>
      </tr>
    `);
  els.searchResults.innerHTML = rows.length ? rows.join("") : tableEmpty(8, "Nenhum resultado encontrado.");
}

function renderReports() {
  const month = els.reportMonth.value || currentMonth();
  const orders = state.orders.filter((order) => (order.dueDate || order.createdAt || "").slice(0, 7) === month);
  const total = orders.reduce((sum, order) => sum + Number(order.value || 0), 0);
  const delivered = orders.filter((order) => order.status === "entregue").length;

  els.reportMetrics.innerHTML = [
    metric("Servicos no mes", orders.length),
    metric("Valor no mes", formatMoney(total)),
    metric("Ticket medio", formatMoney(orders.length ? total / orders.length : 0)),
    metric("Entregues", delivered)
  ].join("");

  els.reportByType.innerHTML = WORK_TYPES.map((type) => {
    const byType = orders.filter((order) => order.workType === type);
    const value = byType.reduce((sum, order) => sum + Number(order.value || 0), 0);
    return statusItem(type, `${byType.length} servico(s) - ${formatMoney(value)}`, orders.length ? (byType.length / orders.length) * 100 : 0);
  }).join("");

  els.reportOrders.innerHTML = orders.length
    ? orders
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .map(orderListItem)
      .join("")
    : empty("Nenhum servico para o mes selecionado.");
}

function renderStatusSummary(container, orders) {
  const total = orders.length || 1;
  container.innerHTML = STATUSES.map((status) => {
    const count = orders.filter((order) => order.status === status).length;
    return statusItem(status, `${count} ordem(ns)`, (count / total) * 100);
  }).join("");
}

function populateClientSelects() {
  fillOptions(els.orderClient, state.clients.map((client) => ({ label: client.name, value: client.id })), "Selecione um cliente");
  fillOptions(els.patientClient, state.clients.map((client) => ({ label: client.name, value: client.id })), "Selecione um cliente");
  populatePatientSelect(els.orderPatient, els.orderClient.value);
}

function populatePatientSelect(select, clientId = "") {
  const patients = state.patients
    .filter((patient) => !clientId || patient.clientId === clientId)
    .map((patient) => ({ label: patient.name, value: patient.id }));
  fillOptions(select, patients, "Selecione um paciente");
}

function fillOptions(select, values, placeholder = "") {
  const options = [];
  if (placeholder) {
    options.push(`<option value="">${placeholder}</option>`);
  }
  values.forEach((item) => {
    const value = typeof item === "string" ? item : item.value;
    const label = typeof item === "string" ? item : item.label;
    options.push(`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`);
  });
  select.innerHTML = options.join("");
}

function editClient(id) {
  const client = state.clients.find((item) => item.id === id);
  if (!client) return;
  els.clientId.value = client.id;
  els.clientName.value = client.name;
  els.clientCro.value = client.cro;
  els.clientPhone.value = client.phone;
  els.clientEmail.value = client.email;
  els.clientNotes.value = client.notes;
  showView("clients");
}

function editPatient(id) {
  const patient = state.patients.find((item) => item.id === id);
  if (!patient) return;
  els.patientId.value = patient.id;
  els.patientName.value = patient.name;
  els.patientClient.value = patient.clientId;
  els.patientPhone.value = patient.phone;
  els.patientBirthDate.value = patient.birthDate;
  els.patientNotes.value = patient.notes;
  showView("patients");
}

function editOrder(id) {
  const order = state.orders.find((item) => item.id === id);
  if (!order) return;
  els.orderId.value = order.id;
  els.orderClient.value = order.clientId;
  populatePatientSelect(els.orderPatient, order.clientId);
  els.orderPatient.value = order.patientId;
  els.orderWorkType.value = order.workType;
  els.orderStatus.value = order.status;
  els.orderDueDate.value = order.dueDate;
  els.orderValue.value = order.value;
  els.orderNotes.value = order.notes;
  showView("orders");
}

function deleteClient(id) {
  if (!confirm("Excluir este cliente tambem removera pacientes e ordens vinculados. Continuar?")) return;
  const patientIds = state.patients.filter((patient) => patient.clientId === id).map((patient) => patient.id);
  state.clients = state.clients.filter((client) => client.id !== id);
  state.patients = state.patients.filter((patient) => patient.clientId !== id);
  state.orders = state.orders.filter((order) => order.clientId !== id && !patientIds.includes(order.patientId));
  persist();
  renderAll();
  toast("Cliente excluido.");
}

function deletePatient(id) {
  if (!confirm("Excluir este paciente tambem removera as ordens vinculadas. Continuar?")) return;
  state.patients = state.patients.filter((patient) => patient.id !== id);
  state.orders = state.orders.filter((order) => order.patientId !== id);
  persist();
  renderAll();
  toast("Paciente excluido.");
}

function deleteOrder(id) {
  if (!confirm("Excluir esta ordem de servico?")) return;
  state.orders = state.orders.filter((order) => order.id !== id);
  persist();
  renderAll();
  toast("Ordem excluida.");
}

function resetClientForm() {
  els.clientForm.reset();
  els.clientId.value = "";
}

function resetPatientForm() {
  els.patientForm.reset();
  els.patientId.value = "";
}

function resetOrderForm() {
  els.orderForm.reset();
  els.orderId.value = "";
  populatePatientSelect(els.orderPatient, els.orderClient.value);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `backup-ordens-protese-${todayIso()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state.clients = Array.isArray(imported.clients) ? imported.clients : [];
      state.patients = Array.isArray(imported.patients) ? imported.patients : [];
      state.orders = Array.isArray(imported.orders) ? imported.orders : [];
      persist();
      renderAll();
      toast("Backup importado.");
    } catch {
      toast("Arquivo de backup invalido.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function orderListItem(order) {
  return `
    <article class="list-item">
      <h4>${escapeHtml(order.id.toUpperCase())} - ${escapeHtml(patientName(order.patientId))}</h4>
      <p>${escapeHtml(clientName(order.clientId))} - ${escapeHtml(order.workType)} - ${statusTag(order.status)}</p>
      <p>Prazo: ${formatDate(order.dueDate)} - Valor: ${formatMoney(order.value)}</p>
    </article>
  `;
}

function statusItem(label, detail, percent) {
  const width = Math.max(0, Math.min(100, percent));
  return `
    <div class="status-item">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(detail)}</span>
      <div class="status-bar"><span style="width: ${width}%"></span></div>
    </div>
  `;
}

function statusTag(status) {
  const cls = status === "entregue" || status === "pronto" ? "ready" : status === "recebido" ? "warning" : "neutral";
  return `<span class="tag ${cls}">${escapeHtml(status)}</span>`;
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function tableEmpty(colspan, message) {
  return `<tr><td colspan="${colspan}" class="empty-state">${escapeHtml(message)}</td></tr>`;
}

function empty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function upsert(list, item) {
  const index = list.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    list[index] = item;
  } else {
    list.push(item);
  }
}

function existingOrder(id) {
  return state.orders.find((order) => order.id === id);
}

function clientName(id) {
  return state.clients.find((client) => client.id === id)?.name || "Cliente removido";
}

function patientName(id) {
  return state.patients.find((patient) => patient.id === id)?.name || "Paciente removido";
}

function orderSearchText(order) {
  return [
    order.id,
    clientName(order.clientId),
    patientName(order.patientId),
    order.workType,
    order.status,
    order.dueDate,
    order.value,
    order.notes
  ].join(" ");
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      clients: Array.isArray(saved?.clients) ? saved.clients : [],
      patients: Array.isArray(saved?.patients) ? saved.patients : [],
      orders: Array.isArray(saved?.orders) ? saved.orders : []
    };
  } catch {
    return { clients: [], patients: [], orders: [] };
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonth() {
  return todayIso().slice(0, 7);
}

function setCurrentReportMonth() {
  els.reportMonth.value = currentMonth();
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => els.toast.classList.remove("show"), 2500);
}

window.editClient = editClient;
window.deleteClient = deleteClient;
window.editPatient = editPatient;
window.deletePatient = deletePatient;
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
