const WORK_TYPES = ["protocolo", "coroa", "guia cirurgico", "placa", "provisorio", "zirconia", "dissilicato", "PMMA"];
const STATUSES = ["recebido", "em desenho", "em fresagem", "em acabamento", "pronto", "entregue"];
const STORAGE_KEY = "protese-os-app-v1";
const ALERT_STORAGE_KEY = "protese-os-alerts-v1";
const ATTACHMENT_DB_NAME = "protese-os-attachments-v1";
const ATTACHMENT_STORE_NAME = "files";

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
  deadlineAlerts: document.getElementById("deadlineAlerts"),
  upcomingList: document.getElementById("upcomingList"),
  statusSummary: document.getElementById("statusSummary"),
  orderForm: document.getElementById("orderForm"),
  orderId: document.getElementById("orderId"),
  orderClient: document.getElementById("orderClient"),
  orderPatient: document.getElementById("orderPatient"),
  orderWorkType: document.getElementById("orderWorkType"),
  orderStatus: document.getElementById("orderStatus"),
  orderDueDate: document.getElementById("orderDueDate"),
  orderReminderDays: document.getElementById("orderReminderDays"),
  orderValue: document.getElementById("orderValue"),
  orderNotes: document.getElementById("orderNotes"),
  statusHistoryList: document.getElementById("statusHistoryList"),
  orderFilesInput: document.getElementById("orderFilesInput"),
  attachmentsList: document.getElementById("attachmentsList"),
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
  enableNotificationsButton: document.getElementById("enableNotificationsButton"),
  viewerModal: document.getElementById("viewerModal"),
  viewerTitle: document.getElementById("viewerTitle"),
  viewerBody: document.getElementById("viewerBody"),
  plyCanvas: document.getElementById("plyCanvas"),
  closeViewerButton: document.getElementById("closeViewerButton"),
  patientRecordModal: document.getElementById("patientRecordModal"),
  patientRecordTitle: document.getElementById("patientRecordTitle"),
  patientRecordBody: document.getElementById("patientRecordBody"),
  closePatientRecordButton: document.getElementById("closePatientRecordButton"),
  toast: document.getElementById("toast")
};

let plyView = null;

init();

function init() {
  populateStaticSelects();
  setCurrentReportMonth();
  bindEvents();
  renderStatusHistory(null);
  renderAttachments(null);
  migrateLegacyAttachments();
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
  els.enableNotificationsButton.addEventListener("click", requestNotificationPermission);
  els.orderFilesInput.addEventListener("change", uploadOrderFiles);
  els.closeViewerButton.addEventListener("click", closeViewer);
  els.closePatientRecordButton.addEventListener("click", closePatientRecord);
  els.viewerModal.addEventListener("click", (event) => {
    if (event.target === els.viewerModal) closeViewer();
  });
  els.patientRecordModal.addEventListener("click", (event) => {
    if (event.target === els.patientRecordModal) closePatientRecord();
  });
  els.plyCanvas.addEventListener("mousedown", startPlyDrag);
  els.plyCanvas.addEventListener("mousemove", movePlyDrag);
  window.addEventListener("mouseup", stopPlyDrag);
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
  const previousOrder = existingOrder(id);
  const status = els.orderStatus.value;
  const statusHistory = buildStatusHistory(previousOrder, status);
  upsert(state.orders, {
    id,
    clientId: els.orderClient.value,
    patientId: els.orderPatient.value,
    workType: els.orderWorkType.value,
    status,
    dueDate: els.orderDueDate.value,
    reminderDays: Math.max(0, Number(els.orderReminderDays.value || 0)),
    value: Number(els.orderValue.value || 0),
    notes: els.orderNotes.value.trim(),
    attachments: previousOrder?.attachments || [],
    statusHistory,
    createdAt: previousOrder?.createdAt || new Date().toISOString()
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

  renderDeadlineAlerts();

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
            <button class="small-button" type="button" onclick="showOrderHistory('${order.id}')">Historico</button>
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
        <h3><button class="patient-name-button" type="button" onclick="openPatientRecord('${patient.id}')">${escapeHtml(patient.name)}</button></h3>
        <p>${escapeHtml(clientName(patient.clientId))}</p>
        <p>${escapeHtml(patient.phone || "Telefone nao informado")}</p>
        <p>${patient.birthDate ? formatDate(patient.birthDate) : "Nascimento nao informado"}</p>
        ${patient.notes ? `<p>${escapeHtml(patient.notes)}</p>` : ""}
        <div class="row-actions">
          <button class="small-button" type="button" onclick="openPatientRecord('${patient.id}')">Ficha</button>
          <button class="small-button" type="button" onclick="editPatient('${patient.id}')">Editar</button>
          <button class="small-button danger" type="button" onclick="deletePatient('${patient.id}')">Excluir</button>
        </div>
      </article>
    `).join("")
    : empty("Nenhum paciente cadastrado.");
}

function openPatientRecord(id) {
  const patient = state.patients.find((item) => item.id === id);
  if (!patient) return;
  const orders = state.orders
    .filter((order) => order.patientId === id)
    .sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));
  const files = orders.flatMap((order) => (order.attachments || []).map((file) => ({ ...file, order })));
  const photos = files.filter((file) => file.type.startsWith("image/"));
  const otherFiles = files.filter((file) => !file.type.startsWith("image/"));

  els.patientRecordTitle.textContent = `Ficha de ${patient.name}`;
  els.patientRecordBody.innerHTML = `
    <div class="record-summary">
      ${recordSummaryItem("Paciente", patient.name)}
      ${recordSummaryItem("Cliente / dentista", clientName(patient.clientId))}
      ${recordSummaryItem("Telefone", patient.phone || "Nao informado")}
      ${recordSummaryItem("Nascimento", patient.birthDate ? formatDate(patient.birthDate) : "Nao informado")}
    </div>

    <div class="row-actions">
      <button class="small-button" type="button" onclick="editPatientFromRecord('${patient.id}')">Editar paciente</button>
      <button class="small-button danger" type="button" onclick="deletePatientFromRecord('${patient.id}')">Excluir paciente</button>
    </div>

    ${patient.notes ? `<section class="record-section"><h4>Observacoes</h4><p>${escapeHtml(patient.notes)}</p></section>` : ""}

    <section class="record-section">
      <h4>Ordens vinculadas</h4>
      ${orders.length ? `<div class="record-order-list">${orders.map(patientOrderItem).join("")}</div>` : empty("Nenhuma ordem vinculada a este paciente.")}
    </section>

    <section class="record-section">
      <h4>Fotos</h4>
      ${photos.length ? `<div class="attachments-grid">${photos.map(patientFileCard).join("")}</div>` : empty("Nenhuma foto anexada nas ordens deste paciente.")}
    </section>

    <section class="record-section">
      <h4>Arquivos e escaneamentos</h4>
      ${otherFiles.length ? `<div class="attachments-grid">${otherFiles.map(patientFileCard).join("")}</div>` : empty("Nenhum arquivo ou escaneamento anexado nas ordens deste paciente.")}
    </section>
  `;
  hydrateAttachmentPreviews(els.patientRecordBody, files);
  els.patientRecordModal.classList.add("open");
  els.patientRecordModal.setAttribute("aria-hidden", "false");
}

function closePatientRecord() {
  els.patientRecordModal.classList.remove("open");
  els.patientRecordModal.setAttribute("aria-hidden", "true");
}

function editPatientFromRecord(id) {
  closePatientRecord();
  editPatient(id);
}

function deletePatientFromRecord(id) {
  closePatientRecord();
  deletePatient(id);
}

function patientOrderItem(order) {
  return `
    <article class="record-order-item">
      <strong>${escapeHtml(order.id.toUpperCase())} - ${escapeHtml(order.workType)}</strong>
      <span>${statusTag(order.status)} Prazo: ${formatDate(order.dueDate)} - Valor: ${formatMoney(order.value)}</span>
      ${order.notes ? `<span>${escapeHtml(order.notes)}</span>` : ""}
      <div class="row-actions">
        <button class="small-button" type="button" onclick="editOrderFromRecord('${order.id}')">Abrir ordem</button>
        <button class="small-button" type="button" onclick="showOrderHistoryFromRecord('${order.id}')">Historico</button>
      </div>
    </article>
  `;
}

function patientFileCard(file) {
  return `
    <article class="attachment-card">
      <div class="attachment-preview" data-preview-id="${escapeHtml(file.id)}">
        ${file.type.startsWith("image/") ? "Foto" : escapeHtml(fileExtensionLabel(file.name))}
      </div>
      <strong>${escapeHtml(file.name)}</strong>
      <span>${escapeHtml(file.order.id.toUpperCase())} - ${escapeHtml(file.order.workType)}</span>
      <span>${formatFileSize(file.size)} - ${formatDateTime(file.uploadedAt)}</span>
      <div class="row-actions">
        ${isPlyFile(file.name) || file.type.startsWith("image/") ? `<button class="small-button" type="button" onclick="openAttachment('${file.order.id}', '${file.id}')">Abrir</button>` : ""}
        <button class="small-button" type="button" onclick="downloadAttachment('${file.order.id}', '${file.id}')">Baixar</button>
      </div>
    </article>
  `;
}

function editOrderFromRecord(id) {
  closePatientRecord();
  editOrder(id);
}

function showOrderHistoryFromRecord(id) {
  closePatientRecord();
  showOrderHistory(id);
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

function renderDeadlineAlerts() {
  const alerts = getDeadlineAlerts();
  els.deadlineAlerts.innerHTML = alerts.length
    ? alerts.map((item) => `
      <article class="alert-item ${item.daysLeft < 0 ? "overdue" : ""}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.detail)}</span>
      </article>
    `).join("")
    : "";
  notifyDeadlineAlerts(alerts);
}

function getDeadlineAlerts() {
  return state.orders
    .filter((order) => order.status !== "entregue" && order.dueDate)
    .map((order) => {
      const daysLeft = daysBetween(todayIso(), order.dueDate);
      const reminderDays = Number(order.reminderDays ?? 2);
      return { order, daysLeft, reminderDays };
    })
    .filter((item) => item.daysLeft <= item.reminderDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(({ order, daysLeft, reminderDays }) => {
      const title = daysLeft < 0
        ? `Prazo vencido: ${order.id.toUpperCase()}`
        : daysLeft === 0
          ? `Entrega hoje: ${order.id.toUpperCase()}`
          : `Entrega em ${daysLeft} dia(s): ${order.id.toUpperCase()}`;
      const detail = `${patientName(order.patientId)} - ${clientName(order.clientId)} - ${order.workType} - prazo ${formatDate(order.dueDate)} - alerta ${reminderDays} dia(s) antes`;
      return { id: order.id, title, detail, daysLeft };
    });
}

function notifyDeadlineAlerts(alerts) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const seen = loadSeenAlerts();
  const today = todayIso();
  alerts.forEach((alert) => {
    const key = `${today}:${alert.id}:${alert.daysLeft}`;
    if (seen[key]) return;
    new Notification(alert.title, { body: alert.detail });
    seen[key] = true;
  });
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(seen));
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    toast("Este navegador nao suporta notificacoes.");
    return;
  }
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      toast("Alertas do navegador ativados.");
      renderDeadlineAlerts();
    } else {
      toast("Alertas do navegador nao foram ativados.");
    }
  });
}

function loadSeenAlerts() {
  try {
    return JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function buildStatusHistory(previousOrder, nextStatus) {
  const history = Array.isArray(previousOrder?.statusHistory)
    ? [...previousOrder.statusHistory]
    : previousOrder?.status
      ? [{ status: previousOrder.status, changedAt: previousOrder.createdAt || new Date().toISOString() }]
      : [];
  const lastStatus = history[history.length - 1]?.status;
  if (lastStatus !== nextStatus) {
    history.push({ status: nextStatus, changedAt: new Date().toISOString() });
  }
  return history;
}

function renderStatusHistory(order) {
  if (!order) {
    els.statusHistoryList.innerHTML = empty("Selecione uma ordem para ver as mudancas de status.");
    return;
  }
  const history = Array.isArray(order.statusHistory) && order.statusHistory.length
    ? order.statusHistory
    : [{ status: order.status, changedAt: order.createdAt || new Date().toISOString() }];
  els.statusHistoryList.innerHTML = history
    .map((entry) => `
      <div class="history-entry">
        ${statusTag(entry.status)}
        <span>${formatDateTime(entry.changedAt)}</span>
      </div>
    `).join("");
}

function renderAttachments(order) {
  if (!order) {
    els.attachmentsList.innerHTML = empty("Salve ou selecione uma ordem para anexar escaneamentos, fotos e arquivos 3D.");
    return;
  }
  const attachments = Array.isArray(order.attachments) ? order.attachments : [];
  els.attachmentsList.innerHTML = attachments.length
    ? attachments.map((file) => `
      <article class="attachment-card">
        <div class="attachment-preview" data-preview-id="${escapeHtml(file.id)}">
          ${file.type.startsWith("image/") ? "Foto" : escapeHtml(fileExtensionLabel(file.name))}
        </div>
        <strong>${escapeHtml(file.name)}</strong>
        <span>${formatFileSize(file.size)} - ${formatDateTime(file.uploadedAt)}</span>
        <div class="row-actions">
          ${isPlyFile(file.name) || file.type.startsWith("image/") ? `<button class="small-button" type="button" onclick="openAttachment('${order.id}', '${file.id}')">Abrir</button>` : ""}
          <button class="small-button" type="button" onclick="downloadAttachment('${order.id}', '${file.id}')">Baixar</button>
          <button class="small-button danger" type="button" onclick="deleteAttachment('${order.id}', '${file.id}')">Remover</button>
        </div>
      </article>
    `).join("")
    : empty("Nenhum arquivo anexado nesta ordem.");
  hydrateAttachmentPreviews(els.attachmentsList, attachments);
}

function uploadOrderFiles(event) {
  const order = existingOrder(els.orderId.value);
  const files = Array.from(event.target.files || []);
  if (!order) {
    toast("Salve a ordem antes de anexar arquivos.");
    event.target.value = "";
    return;
  }
  Promise.all(files.map(readAttachmentFile)).then((attachments) => {
    order.attachments = [...(order.attachments || []), ...attachments];
    persist();
    renderAttachments(order);
    renderOrdersTable();
    toast("Arquivo(s) anexado(s).");
  }).catch((error) => {
    toast(error?.message || "Nao foi possivel anexar um dos arquivos.");
  }).finally(() => {
    event.target.value = "";
  });
}

function readAttachmentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const metadata = {
        id: createId("file"),
        name: file.name,
        type: file.type || mimeFromName(file.name),
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      saveAttachmentData(metadata.id, reader.result)
        .then(() => resolve(metadata))
        .catch(() => reject(new Error("Nao foi possivel salvar o arquivo no navegador. Tente um arquivo menor ou libere espaco.")));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function openAttachment(orderId, fileId) {
  const order = existingOrder(orderId);
  const file = order?.attachments?.find((item) => item.id === fileId);
  if (!file) return;
  const dataUrl = await getAttachmentData(file);
  if (!dataUrl) {
    toast("Arquivo nao encontrado neste navegador.");
    return;
  }
  els.viewerTitle.textContent = file.name;
  els.viewerModal.classList.add("open");
  els.viewerModal.setAttribute("aria-hidden", "false");
  if (file.type.startsWith("image/")) {
    els.viewerBody.innerHTML = `<img src="${dataUrl}" alt="${escapeHtml(file.name)}" />`;
    return;
  }
  if (isPlyFile(file.name)) {
    els.viewerBody.innerHTML = "";
    els.viewerBody.appendChild(els.plyCanvas);
    renderPlyFile(dataUrl);
  }
}

function closeViewer() {
  els.viewerModal.classList.remove("open");
  els.viewerModal.setAttribute("aria-hidden", "true");
  plyView = null;
}

function deleteAttachment(orderId, fileId) {
  const order = existingOrder(orderId);
  if (!order || !confirm("Remover este arquivo da ordem?")) return;
  order.attachments = (order.attachments || []).filter((file) => file.id !== fileId);
  deleteAttachmentData(fileId);
  persist();
  renderAttachments(order);
  toast("Arquivo removido.");
}

async function downloadAttachment(orderId, fileId) {
  const order = existingOrder(orderId);
  const file = order?.attachments?.find((item) => item.id === fileId);
  if (!file) return;
  const dataUrl = await getAttachmentData(file);
  if (!dataUrl) {
    toast("Arquivo nao encontrado neste navegador.");
    return;
  }
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = file.name;
  anchor.click();
}

function renderPlyFile(dataUrl) {
  dataUrlToArrayBuffer(dataUrl).then((buffer) => {
    const model = parsePly(buffer);
    plyView = {
      model,
      rotationX: -0.25,
      rotationY: 0.55,
      dragging: false,
      lastX: 0,
      lastY: 0
    };
    drawPly();
  }).catch((error) => {
    els.viewerBody.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "Nao foi possivel abrir este arquivo PLY.")}</div>`;
  });
}

function dataUrlToArrayBuffer(dataUrl) {
  return fetch(dataUrl).then((response) => response.arrayBuffer());
}

function parsePly(buffer) {
  const decoder = new TextDecoder("utf-8");
  const preview = decoder.decode(buffer.slice(0, Math.min(buffer.byteLength, 120000)));
  const headerEnd = preview.indexOf("end_header");
  if (headerEnd < 0) throw new Error("Arquivo PLY sem cabecalho valido.");
  const newlineLength = preview[headerEnd + 10] === "\r" && preview[headerEnd + 11] === "\n" ? 2 : 1;
  const headerText = preview.slice(0, headerEnd + 10);
  const dataOffset = new TextEncoder().encode(preview.slice(0, headerEnd + 10 + newlineLength)).length;
  const header = readPlyHeader(headerText);
  if (header.format === "ascii") return parseAsciiPly(decoder.decode(buffer.slice(dataOffset)), header);
  if (header.format === "binary_little_endian") return parseBinaryPly(buffer, dataOffset, header, true);
  if (header.format === "binary_big_endian") return parseBinaryPly(buffer, dataOffset, header, false);
  throw new Error("Formato PLY nao suportado.");
}

function readPlyHeader(headerText) {
  const lines = headerText.split(/\r?\n/);
  const header = { format: "", vertexCount: 0, faceCount: 0, vertexProps: [], faceProps: [] };
  let section = "";
  lines.forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "format") header.format = parts[1];
    if (parts[0] === "element") {
      section = parts[1];
      if (section === "vertex") header.vertexCount = Number(parts[2]);
      if (section === "face") header.faceCount = Number(parts[2]);
    }
    if (parts[0] === "property" && section === "vertex") {
      header.vertexProps.push({ name: parts[2], type: parts[1] });
    }
    if (parts[0] === "property" && section === "face") {
      header.faceProps.push(parts[1] === "list"
        ? { name: parts[4], type: "list", countType: parts[2], itemType: parts[3] }
        : { name: parts[2], type: parts[1] });
    }
  });
  return header;
}

function parseAsciiPly(text, header) {
  const lines = text.trim().split(/\r?\n/);
  const vertices = [];
  for (let i = 0; i < header.vertexCount; i += 1) {
    const values = lines[i].trim().split(/\s+/).map(Number);
    const vertex = {};
    header.vertexProps.forEach((prop, index) => {
      vertex[prop.name] = values[index];
    });
    vertices.push([vertex.x || 0, vertex.y || 0, vertex.z || 0]);
  }
  const faces = [];
  for (let i = 0; i < header.faceCount; i += 1) {
    const values = lines[header.vertexCount + i]?.trim().split(/\s+/).map(Number) || [];
    const count = values[0] || 0;
    if (count >= 2) faces.push(values.slice(1, count + 1));
  }
  return normalizePlyModel({ vertices, faces });
}

function parseBinaryPly(buffer, offset, header, littleEndian) {
  const view = new DataView(buffer);
  const vertices = [];
  let cursor = offset;
  for (let i = 0; i < header.vertexCount; i += 1) {
    const vertex = {};
    header.vertexProps.forEach((prop) => {
      const result = readPlyValue(view, cursor, prop.type, littleEndian);
      vertex[prop.name] = result.value;
      cursor += result.size;
    });
    vertices.push([vertex.x || 0, vertex.y || 0, vertex.z || 0]);
  }
  const faces = [];
  for (let i = 0; i < header.faceCount; i += 1) {
    const countProp = header.faceProps.find((prop) => prop.type === "list");
    if (!countProp) break;
    const countResult = readPlyValue(view, cursor, countProp.countType, littleEndian);
    cursor += countResult.size;
    const face = [];
    for (let j = 0; j < countResult.value; j += 1) {
      const itemResult = readPlyValue(view, cursor, countProp.itemType, littleEndian);
      cursor += itemResult.size;
      face.push(itemResult.value);
    }
    faces.push(face);
  }
  return normalizePlyModel({ vertices, faces });
}

function readPlyValue(view, offset, type, littleEndian) {
  const readers = {
    char: () => ({ value: view.getInt8(offset), size: 1 }),
    uchar: () => ({ value: view.getUint8(offset), size: 1 }),
    int8: () => ({ value: view.getInt8(offset), size: 1 }),
    uint8: () => ({ value: view.getUint8(offset), size: 1 }),
    short: () => ({ value: view.getInt16(offset, littleEndian), size: 2 }),
    ushort: () => ({ value: view.getUint16(offset, littleEndian), size: 2 }),
    int16: () => ({ value: view.getInt16(offset, littleEndian), size: 2 }),
    uint16: () => ({ value: view.getUint16(offset, littleEndian), size: 2 }),
    int: () => ({ value: view.getInt32(offset, littleEndian), size: 4 }),
    uint: () => ({ value: view.getUint32(offset, littleEndian), size: 4 }),
    int32: () => ({ value: view.getInt32(offset, littleEndian), size: 4 }),
    uint32: () => ({ value: view.getUint32(offset, littleEndian), size: 4 }),
    float: () => ({ value: view.getFloat32(offset, littleEndian), size: 4 }),
    float32: () => ({ value: view.getFloat32(offset, littleEndian), size: 4 }),
    double: () => ({ value: view.getFloat64(offset, littleEndian), size: 8 }),
    float64: () => ({ value: view.getFloat64(offset, littleEndian), size: 8 })
  };
  return (readers[type] || readers.float)();
}

function normalizePlyModel(model) {
  if (!model.vertices.length) throw new Error("PLY sem vertices para exibir.");
  const center = [0, 0, 0];
  for (const vertex of model.vertices) {
    center[0] += vertex[0];
    center[1] += vertex[1];
    center[2] += vertex[2];
  }
  center[0] /= model.vertices.length;
  center[1] /= model.vertices.length;
  center[2] /= model.vertices.length;

  let radius = 1;
  const vertices = model.vertices.map((vertex) => {
    const normalized = [vertex[0] - center[0], vertex[1] - center[1], vertex[2] - center[2]];
    const distance = Math.hypot(normalized[0], normalized[1], normalized[2]);
    if (distance > radius) radius = distance;
    return normalized;
  });
  return { vertices, faces: model.faces, radius };
}

function drawPly() {
  if (!plyView) return;
  const canvas = els.plyCanvas;
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#111815";
  context.fillRect(0, 0, width, height);
  const vertexStep = Math.max(1, Math.ceil(plyView.model.vertices.length / 80000));
  const points = new Array(plyView.model.vertices.length);
  for (let index = 0; index < plyView.model.vertices.length; index += vertexStep) {
    points[index] = projectVertex(plyView.model.vertices[index], plyView, width, height);
  }
  context.strokeStyle = "#9be7d8";
  context.lineWidth = 1;
  const faces = plyView.model.faces.length ? plyView.model.faces : points.map((_, index) => [index, index + 1]).slice(0, -1);
  faces.slice(0, 12000).forEach((face) => {
    context.beginPath();
    face.forEach((index, position) => {
      const point = points[index];
      if (!point) return;
      if (position === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    if (face.length > 2) context.closePath();
    context.stroke();
  });
  context.fillStyle = "#e8fff8";
  let drawn = 0;
  for (let index = 0; index < points.length && drawn < 8000; index += vertexStep) {
    const point = points[index];
    if (!point) continue;
    context.fillRect(point.x - 1, point.y - 1, 2, 2);
    drawn += 1;
  }
}

function projectVertex(vertex, view, width, height) {
  const cosY = Math.cos(view.rotationY);
  const sinY = Math.sin(view.rotationY);
  const cosX = Math.cos(view.rotationX);
  const sinX = Math.sin(view.rotationX);
  const x1 = vertex[0] * cosY - vertex[2] * sinY;
  const z1 = vertex[0] * sinY + vertex[2] * cosY;
  const y1 = vertex[1] * cosX - z1 * sinX;
  const z2 = vertex[1] * sinX + z1 * cosX;
  const scale = Math.min(width, height) * 0.38 / view.model.radius;
  const perspective = 1 / (1 + z2 / (view.model.radius * 5));
  return {
    x: width / 2 + x1 * scale * perspective,
    y: height / 2 - y1 * scale * perspective
  };
}

function startPlyDrag(event) {
  if (!plyView) return;
  plyView.dragging = true;
  plyView.lastX = event.clientX;
  plyView.lastY = event.clientY;
}

function movePlyDrag(event) {
  if (!plyView?.dragging) return;
  plyView.rotationY += (event.clientX - plyView.lastX) * 0.01;
  plyView.rotationX += (event.clientY - plyView.lastY) * 0.01;
  plyView.lastX = event.clientX;
  plyView.lastY = event.clientY;
  drawPly();
}

function stopPlyDrag() {
  if (plyView) plyView.dragging = false;
}

function openAttachmentDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Este navegador nao suporta armazenamento de arquivos."));
      return;
    }
    const request = indexedDB.open(ATTACHMENT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(ATTACHMENT_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAttachmentData(id, dataUrl) {
  const db = await openAttachmentDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    transaction.objectStore(ATTACHMENT_STORE_NAME).put(dataUrl, id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function loadAttachmentData(id) {
  const db = await openAttachmentDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ATTACHMENT_STORE_NAME, "readonly");
    const request = transaction.objectStore(ATTACHMENT_STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || "");
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function deleteAttachmentData(id) {
  const db = await openAttachmentDb();
  return new Promise((resolve) => {
    const transaction = db.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    transaction.objectStore(ATTACHMENT_STORE_NAME).delete(id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      resolve();
    };
  });
}

async function getAttachmentData(file) {
  if (file.dataUrl) return file.dataUrl;
  try {
    return await loadAttachmentData(file.id);
  } catch {
    return "";
  }
}

async function migrateLegacyAttachments() {
  const legacyFiles = state.orders.flatMap((order) => order.attachments || []).filter((file) => file.dataUrl);
  if (!legacyFiles.length) return;
  try {
    await Promise.all(legacyFiles.map((file) => saveAttachmentData(file.id, file.dataUrl)));
    state.orders.forEach((order) => {
      order.attachments = (order.attachments || []).map(({ dataUrl, ...file }) => file);
    });
    persist();
  } catch {
    toast("Alguns anexos antigos nao puderam ser migrados.");
  }
}

function hydrateAttachmentPreviews(container, files) {
  files.filter((file) => file.type.startsWith("image/")).forEach(async (file) => {
    const preview = container.querySelector(`[data-preview-id="${file.id}"]`);
    if (!preview) return;
    const dataUrl = await getAttachmentData(file);
    if (dataUrl) {
      preview.innerHTML = `<img src="${dataUrl}" alt="${escapeHtml(file.name)}" />`;
    }
  });
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
  els.orderReminderDays.value = order.reminderDays ?? 2;
  els.orderValue.value = order.value;
  els.orderNotes.value = order.notes;
  renderStatusHistory(order);
  renderAttachments(order);
  showView("orders");
}

function showOrderHistory(id) {
  const order = state.orders.find((item) => item.id === id);
  if (!order) return;
  renderStatusHistory(order);
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
  els.orderReminderDays.value = 2;
  renderStatusHistory(null);
  renderAttachments(null);
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
      state.orders = Array.isArray(imported.orders) ? imported.orders.map(normalizeOrder) : [];
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
  const daysLeft = order.dueDate ? daysBetween(todayIso(), order.dueDate) : null;
  const deadlineText = daysLeft === null
    ? "Sem prazo"
    : daysLeft < 0
      ? `Atrasado ${Math.abs(daysLeft)} dia(s)`
      : daysLeft === 0
        ? "Entrega hoje"
        : `Faltam ${daysLeft} dia(s)`;
  return `
    <button class="list-item order-card-button ${statusClass(order.status)}" type="button" onclick="editOrder('${order.id}')">
      <h4>${escapeHtml(order.id.toUpperCase())} - ${escapeHtml(patientName(order.patientId))}</h4>
      <p>${escapeHtml(clientName(order.clientId))} - ${escapeHtml(order.workType)} - ${statusTag(order.status)}</p>
      <p>Prazo: ${formatDate(order.dueDate)} - ${escapeHtml(deadlineText)} - Valor: ${formatMoney(order.value)}</p>
    </button>
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
  return `<span class="tag ${statusClass(status)}">${escapeHtml(status)}</span>`;
}

function statusClass(status) {
  const statusClasses = {
    recebido: "status-recebido",
    "em desenho": "status-desenho",
    "em fresagem": "status-fresagem",
    "em acabamento": "status-acabamento",
    pronto: "status-pronto",
    entregue: "status-entregue"
  };
  return statusClasses[status] || "status-entregue";
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function recordSummaryItem(label, value) {
  return `<div class="record-summary-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
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
    order.notes,
    ...(order.attachments || []).map((file) => file.name)
  ].join(" ");
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      clients: Array.isArray(saved?.clients) ? saved.clients : [],
      patients: Array.isArray(saved?.patients) ? saved.patients : [],
      orders: Array.isArray(saved?.orders) ? saved.orders.map(normalizeOrder) : []
    };
  } catch {
    return { clients: [], patients: [], orders: [] };
  }
}

function normalizeOrder(order) {
  const createdAt = order.createdAt || new Date().toISOString();
  const statusHistory = Array.isArray(order.statusHistory) && order.statusHistory.length
    ? order.statusHistory
    : [{ status: order.status || "recebido", changedAt: createdAt }];
  return {
    ...order,
    status: order.status || statusHistory[statusHistory.length - 1]?.status || "recebido",
    reminderDays: Number(order.reminderDays ?? 2),
    attachments: Array.isArray(order.attachments) ? order.attachments : [],
    statusHistory,
    createdAt
  };
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

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function formatFileSize(size) {
  if (!Number(size)) return "0 KB";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileExtensionLabel(name) {
  const extension = name.split(".").pop()?.toUpperCase() || "ARQ";
  return extension.length <= 5 ? extension : "ARQ";
}

function isPlyFile(name) {
  return name.toLowerCase().endsWith(".ply");
}

function mimeFromName(name) {
  if (isPlyFile(name)) return "model/ply";
  if (name.toLowerCase().endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.round((end - start) / 86400000);
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
window.showOrderHistory = showOrderHistory;
window.openAttachment = openAttachment;
window.deleteAttachment = deleteAttachment;
window.downloadAttachment = downloadAttachment;
window.openPatientRecord = openPatientRecord;
window.editPatientFromRecord = editPatientFromRecord;
window.deletePatientFromRecord = deletePatientFromRecord;
window.editOrderFromRecord = editOrderFromRecord;
window.showOrderHistoryFromRecord = showOrderHistoryFromRecord;
