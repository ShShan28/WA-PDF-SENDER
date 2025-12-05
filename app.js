/* app.js — fully working with UltraMsg instance */
const INSTANCE_ID = 'instance153584';
const SEND_ENDPOINT = 'send.php';
const SAVE_SCHEDULE_ENDPOINT = 'save_schedule.php';
const RATE_DELAY_MS = 1200;

document.addEventListener('DOMContentLoaded', () => {
  // Navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showView(btn.dataset.view);
    });
  });
  document.getElementById('instanceId').textContent = INSTANCE_ID;

  // Single send
  document.getElementById('sendSingleBtn').addEventListener('click', sendSingle);

  // Bulk send
  document.getElementById('previewBulkBtn').addEventListener('click', previewBulkList);
  document.getElementById('sendBulkBtn').addEventListener('click', sendBulkList);
  document.getElementById('bulkCsv').addEventListener('change', handleBulkCsv);

  // Contacts
  loadContacts();
  document.getElementById('addContactBtn').addEventListener('click', addContact);

  // Templates
  loadTemplates();
  document.getElementById('saveTplBtn').addEventListener('click', saveTemplate);

  // Logs
  renderLogs();
  document.getElementById('exportCsvBtn').addEventListener('click', exportLogsCsv);
  document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);

  // Schedule
  document.getElementById('saveScheduleBtn').addEventListener('click', saveLocalSchedule);
  document.getElementById('sendScheduleNowBtn').addEventListener('click', sendScheduleNow);
  renderSchedules();

  // Ensure Bulk & Schedule contact selectors are available and loaded
  createBulkContactsUI();
  createScheduleContactsUI();
  loadBulkContactsList();
  loadScheduleContactsList();

  showView('send');
});

/* ---------- Views ---------- */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  document.getElementById('viewTitle').textContent = {
    send: 'Send PDF/Image/Message',
    bulk: 'Bulk / Schedule',
    contacts: 'Contacts',
    logs: 'Logs',
    templates: 'Templates'
  }[name] || 'Dashboard';
}

/* ---------- Contacts ---------- */
function loadContacts() {
  const list = JSON.parse(localStorage.getItem('wa_contacts') || '[]');
  const target = document.getElementById('contactsList');
  target.innerHTML = '';
  if (!list.length) { target.innerHTML = '<div class="text-muted">No contacts yet.</div>'; 
    // also refresh bulk/schedule UI
    loadBulkContactsList();
    loadScheduleContactsList();
    return;
  }
  list.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'mb-1 d-flex justify-content-between align-items-center';
    div.innerHTML = `<div><strong>${escapeHtml(c.name)}</strong> <div class="small text-muted">${escapeHtml(c.phone)}</div></div>
      <div class="btn-group">
        <button class="btn btn-sm btn-outline-primary" onclick="fillNumber('${c.phone}')">Use</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteContact(${i})">Delete</button>
      </div>`;
    target.appendChild(div);
  });

  // refresh bulk / schedule contact selectors
  loadBulkContactsList();
  loadScheduleContactsList();
}
function addContact() {
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  if (!phone) return alert('Enter phone number');
  const list = JSON.parse(localStorage.getItem('wa_contacts') || '[]');
  list.push({ name: name || phone, phone });
  localStorage.setItem('wa_contacts', JSON.stringify(list));
  document.getElementById('contactName').value = '';
  document.getElementById('contactPhone').value = '';
  loadContacts();
}
function deleteContact(idx) {
  const list = JSON.parse(localStorage.getItem('wa_contacts') || '[]');
  list.splice(idx, 1);
  localStorage.setItem('wa_contacts', JSON.stringify(list));
  loadContacts();
}
function fillNumber(phone) {
  document.getElementById('singleNumber').value = phone;
}

/* ---------- Templates ---------- */
function loadTemplates() {
  const t = JSON.parse(localStorage.getItem('wa_templates') || '[]');
  const el = document.getElementById('templatesList');
  el.innerHTML = '';
  if (!t.length) { el.innerHTML = '<div class="text-muted">No templates yet.</div>'; return; }
  t.forEach((tpl, i) => {
    const div = document.createElement('div');
    div.className = 'mb-1 d-flex justify-content-between align-items-center';
    div.innerHTML = `<div>${escapeHtml(tpl)}</div>
      <div><button class="btn btn-sm btn-outline-primary" onclick="useTemplate(${i})">Use</button>
      <button class="btn btn-sm btn-outline-danger" onclick="deleteTemplate(${i})">Delete</button></div>`;
    el.appendChild(div);
  });
}
function saveTemplate() {
  const text = document.getElementById('templateText').value.trim();
  if (!text) return alert('Template cannot be empty');
  const t = JSON.parse(localStorage.getItem('wa_templates') || '[]');
  t.push(text);
  localStorage.setItem('wa_templates', JSON.stringify(t));
  document.getElementById('templateText').value = '';
  loadTemplates();
}
function useTemplate(i) {
  const t = JSON.parse(localStorage.getItem('wa_templates') || '[]');
  document.getElementById('singleMessage').value = t[i] || '';
}
function deleteTemplate(i) {
  const t = JSON.parse(localStorage.getItem('wa_templates') || '[]');
  t.splice(i, 1);
  localStorage.setItem('wa_templates', JSON.stringify(t));
  loadTemplates();
}

/* ---------- Logs ---------- */
function pushLog(entry) {
  const logs = JSON.parse(localStorage.getItem('wa_logs') || '[]');
  logs.unshift(entry);
  localStorage.setItem('wa_logs', JSON.stringify(logs.slice(0, 1000)));
  renderLogs();
}
function renderLogs() {
  const logs = JSON.parse(localStorage.getItem('wa_logs') || '[]');
  const container = document.getElementById('logsTable');
  if (!logs.length) { container.innerHTML = '<div class="text-muted">No logs yet.</div>'; return; }
  const table = document.createElement('table');
  table.className = 'table table-sm';
  table.innerHTML = `<thead><tr><th>Time</th><th>To</th><th>File</th><th>Msg</th><th>Status</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  logs.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(l.time)}</td>
      <td>${escapeHtml(l.to)}</td>
      <td>${escapeHtml(l.filename || '')}</td>
      <td>${escapeHtml(l.message || '')}</td>
      <td>${escapeHtml(l.status)}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}
function exportLogsCsv() {
  const logs = JSON.parse(localStorage.getItem('wa_logs') || '[]');
  if (!logs.length) return alert('No logs to export');
  const rows = [['time', 'to', 'filename', 'message', 'status']];
  logs.forEach(l => rows.push([l.time, l.to, l.filename || '', l.message || '', l.status]));
  const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'wa_logs.csv'; document.body.appendChild(a); a.click(); a.remove();
}
function clearLogs() {
  if (!confirm('Clear all logs?')) return;
  localStorage.removeItem('wa_logs');
  renderLogs();
}

/* ---------- Single Send ---------- */
async function sendSingle() {
  const to = document.getElementById('singleNumber').value.trim();
  const fileEl = document.getElementById('singleFile');
  const message = document.getElementById('singleMessage').value.trim() || ' ';
  const resultDiv = document.getElementById('singleResult');
  resultDiv.innerHTML = '';

  if (!to) return alert('Enter recipient number');

  const hasFile = fileEl.files.length > 0;
  let base64 = '', filename = '';
  if (hasFile) {
    const f = fileEl.files[0];
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(f.type)) return alert('File must be PDF or image');
    if (f.size > 12 * 1024 * 1024) return alert('File too large');
    filename = f.name;
    resultDiv.innerHTML = 'Preparing file...';
    base64 = await fileToBase64(f);
  }

  resultDiv.innerHTML = 'Sending...';
  const payload = { to, body: message, base64, filename };
  await postSendAndHandleResponse(payload, filename, message, to, resultDiv);
}

async function postSendAndHandleResponse(payload, filename, message, to, resultDiv) {
  try {
    const resp = await fetch(SEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    let ok = false, info = '';
    if (data && data.results && data.results[0]) { ok = !!data.results[0].success; info = JSON.stringify(data.results[0].response); }
    else { ok = (resp.status >= 200 && resp.status < 300); info = JSON.stringify(data || resp.statusText); }

    if (ok) {
      resultDiv.innerHTML = `<div class="alert alert-success">Sent — id: ${escapeHtml(info)}</div>`;
      pushLog({ time: new Date().toLocaleString(), to, filename, message, status: 'sent' });
    } else {
      resultDiv.innerHTML = `<div class="alert alert-danger">Failed: ${escapeHtml(info)}</div>`;
      pushLog({ time: new Date().toLocaleString(), to, filename, message, status: 'failed' });
    }
  } catch (err) {
    resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${escapeHtml(err.message)}</div>`;
    pushLog({ time: new Date().toLocaleString(), to, filename, message, status: 'failed' });
  }
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => { res(reader.result.split(',')[1] || ''); };
    reader.onerror = e => rej(e);
    reader.readAsDataURL(file);
  });
}

/* ---------- Bulk Send ---------- */
let parsedBulk = [];
function handleBulkCsv(e) {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    parsedBulk = reader.result.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    renderBulkPreview();
  };
  reader.readAsText(f);
}
function previewBulkList() {
  const pasted = document.getElementById('bulkList').value.trim();
  parsedBulk = [];
  if (pasted) parsedBulk = pasted.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  renderBulkPreview();
}
function renderBulkPreview() {
  const el = document.getElementById('bulkPreview');
  if (!parsedBulk.length) { el.innerHTML = '<div class="text-muted">No recipients parsed yet.</div>'; return; }
  el.innerHTML = `<div>${parsedBulk.length} recipients ready</div><div class="small text-muted">${parsedBulk.slice(0, 20).join(', ')}</div>`;
}
async function sendBulkList() {
  // Build recipient list from: selected saved contacts, parsedBulk, or manual textarea
  const selectedSaved = [...document.querySelectorAll('#bulkContactsList input.bulk-contact:checked')].map(ch => ({
    phone: ch.dataset.phone,
    name: ch.dataset.name
  }));

  const manualList = parsedBulk.length
    ? parsedBulk.map(n => ({ phone: n, name: '' }))
    : (document.getElementById('bulkList').value.trim()
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(n => ({ phone: n, name: '' })));

  const finalList = [...selectedSaved, ...manualList];
  if (!finalList.length) return alert('No recipients found');

  const fileEl = document.getElementById('bulkFile');
  const messageRaw = document.getElementById('bulkMessage').value.trim() || ' ';
  const hasFile = fileEl.files.length > 0;
  if (!hasFile && !messageRaw) return alert('Provide message or file');
  if (!confirm(`Send to ${finalList.length} recipients? ~${(finalList.length * RATE_DELAY_MS / 1000).toFixed(0)}s`)) return;

  let base64 = '', filename = '';
  if (hasFile) {
    const f = fileEl.files[0];
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(f.type)) return alert('File must be PDF or image');
    filename = f.name;
    base64 = await fileToBase64(f);
  }

  for (let item of finalList) {
    const to = item.phone;
    const personalized = messageRaw.replace(/{name}/g, item.name || '');
    const payload = { to, body: personalized, base64, filename };
    await postSendAndHandleResponse(payload, filename, personalized, to, { innerHTML: '' });
    await sleep(RATE_DELAY_MS);
  }
  alert('Bulk send done. Check logs.');
}

/* ---------- Schedule Helpers & UI injection ---------- */
// Create small UI blocks (in case HTML not modified) and populate later
function createBulkContactsUI() {
  try {
    const bulkFileEl = document.getElementById('bulkFile');
    if (!bulkFileEl) return;
    // If already created, skip
    if (document.getElementById('bulkContactsList')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3';
    wrapper.innerHTML = `<label class="form-label">Select saved contacts (optional)</label>
      <div id="bulkContactsList" class="border rounded p-2" style="max-height:120px; overflow:auto;"><div class="text-muted small">Loading...</div></div>`;
    // insert after bulkFileEl's parent
    bulkFileEl.parentNode.insertBefore(wrapper, document.getElementById('previewBulkBtn'));
  } catch (e) {
    console.warn('createBulkContactsUI failed', e);
  }
}
function createScheduleContactsUI() {
  try {
    const scheduleRecipientsEl = document.getElementById('scheduleRecipients');
    if (!scheduleRecipientsEl) return;
    if (document.getElementById('scheduleContactsList')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3';
    wrapper.innerHTML = `<label class="form-label">Select saved contacts (optional)</label>
      <div id="scheduleContactsList" class="border rounded p-2" style="max-height:120px; overflow:auto;"><div class="text-muted small">Loading...</div></div>`;
    scheduleRecipientsEl.parentNode.insertBefore(wrapper, scheduleRecipientsEl);
  } catch (e) {
    console.warn('createScheduleContactsUI failed', e);
  }
}

function loadBulkContactsList() {
  const list = JSON.parse(localStorage.getItem('wa_contacts') || '[]');
  const box = document.getElementById('bulkContactsList');
  if (!box) return;
  box.innerHTML = '';
  if (!list.length) { box.innerHTML = '<div class="text-muted">No saved contacts</div>'; return; }
  list.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'mb-1';
    row.innerHTML = `<label class="form-check"><input type="checkbox" class="form-check-input bulk-contact" data-phone="${escapeHtml(c.phone)}" data-name="${escapeHtml(c.name)}"> <span class="form-check-label">${escapeHtml(c.name)} — ${escapeHtml(c.phone)}</span></label>`;
    box.appendChild(row);
  });
}

function loadScheduleContactsList() {
  const list = JSON.parse(localStorage.getItem('wa_contacts') || '[]');
  const box = document.getElementById('scheduleContactsList');
  if (!box) return;
  box.innerHTML = '';
  if (!list.length) { box.innerHTML = '<div class="text-muted">No saved contacts</div>'; return; }
  list.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'mb-1';
    row.innerHTML = `<label class="form-check"><input type="checkbox" class="form-check-input schedule-contact" data-phone="${escapeHtml(c.phone)}" data-name="${escapeHtml(c.name)}"> <span class="form-check-label">${escapeHtml(c.name)} — ${escapeHtml(c.phone)}</span></label>`;
    box.appendChild(row);
  });
}

/* ---------- Schedule Functions (modified to include saved contacts + name meta) ---------- */
async function saveLocalSchedule(){
  const time = document.getElementById('scheduleTime').value;
  // selected saved contacts
  const selectedSaved = [...document.querySelectorAll('#scheduleContactsList input.schedule-contact:checked')].map(ch => ({
    phone: ch.dataset.phone,
    name: ch.dataset.name
  }));
  // manual recipients (phones only)
  const manual = document.getElementById('scheduleRecipients').value.trim()
    ? document.getElementById('scheduleRecipients').value.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(p => ({ phone: p, name: '' }))
    : [];
  const message = document.getElementById('scheduleMessage').value.trim() || ' ';
  const f = document.getElementById('scheduleFile').files[0];

  if(!time || (!selectedSaved.length && !manual.length)){
    alert('Complete time and recipients');
    return;
  }

  let fileMeta = null;
  if(f){
    if(f.size > 12*1024*1024){ alert('File too large'); return; }
    const base64 = await fileToBase64(f);
    fileMeta = { filename: f.name, type: f.type, base64 };
  }

  let schedules = JSON.parse(localStorage.getItem('wa_schedules') || '[]');

  // recipients stored as array of objects {phone, name}
  const recipients = [...selectedSaved, ...manual];

  // Check if editing existing schedule
  const editingId = document.getElementById('saveScheduleBtn')?.dataset.editId;
  if(editingId){
    schedules = schedules.map(s => s.id==editingId ? {id: editingId, time, recipients, message, fileMeta, created: new Date().toLocaleString()} : s);
    document.getElementById('saveScheduleBtn').removeAttribute('data-edit-id');
  } else {
    const job = { id: Date.now(), time, recipients, message, fileMeta, created: new Date().toLocaleString() };
    schedules.push(job);
  }

  localStorage.setItem('wa_schedules', JSON.stringify(schedules));
  renderSchedules();

  // Persist to server
  try{
    await fetch(SAVE_SCHEDULE_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({schedules})
    });
  }catch(err){
    console.warn('Server persist failed:', err.message);
  }

  // Clear inputs
  document.getElementById('scheduleTime').value='';
  document.getElementById('scheduleRecipients').value='';
  document.getElementById('scheduleMessage').value='';
  document.getElementById('scheduleFile').value='';
  document.getElementById('scheduleFileLabel').textContent = 'No file selected';
}

function renderSchedules(){
  const list = JSON.parse(localStorage.getItem('wa_schedules') || '[]');
  const el = document.getElementById('scheduleList');
  if(!list.length){ el.innerHTML='<div class="text-muted">No schedules.</div>'; return; }

  el.innerHTML = list.map(s=>{
    const fm = s.fileMeta ? ` — ${escapeHtml(s.fileMeta.filename)}` : '';
    const msg = s.message ? `<div class="small text-muted">Msg: ${escapeHtml(s.message)}</div>` : '';
    const recipientsText = (s.recipients || []).map(r => (typeof r === 'string') ? r : (r.name ? `${escapeHtml(r.name)} (${escapeHtml(r.phone)})` : escapeHtml(r.phone))).join(', ');
    return `<div class="p-2 border rounded mb-2 d-flex justify-content-between align-items-start">
      <div>
        <div><strong>${escapeHtml(s.time)}</strong>${fm}</div>
        <div class="small text-muted">${recipientsText}</div>
        ${msg}
      </div>
      <div class="btn-group-vertical">
        <button class="btn btn-sm btn-outline-primary" onclick="editSchedule(${s.id})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteSchedule(${s.id})">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function deleteSchedule(id){
  if(!confirm('Delete this schedule?')) return;
  let schedules = JSON.parse(localStorage.getItem('wa_schedules') || '[]');
  schedules = schedules.filter(s => s.id !== id);
  localStorage.setItem('wa_schedules', JSON.stringify(schedules));
  renderSchedules();
}

function editSchedule(id){
  const schedules = JSON.parse(localStorage.getItem('wa_schedules') || '[]');
  const job = schedules.find(s => s.id === id);
  if(!job) return;

  document.getElementById('scheduleTime').value = job.time;
  // prefill manual recipients with phones (user can also reselect contacts)
  document.getElementById('scheduleRecipients').value = (job.recipients || []).map(r => typeof r === 'string' ? r : r.phone).join('\n');
  document.getElementById('scheduleMessage').value = job.message || '';
  // file cannot be prefilled due to browser security, user must re-select
  document.getElementById('saveScheduleBtn').dataset.editId = id;
}

async function sendScheduleNow(){
  const list = JSON.parse(localStorage.getItem('wa_schedules') || '[]');
  if(!list.length){ alert('No schedules'); return; }
  if(!confirm('Send all saved schedules now?')) return;

  for(const s of list){
    const mf = s.fileMeta;
    for(const r of (s.recipients || [])){
      const to = (typeof r === 'string') ? r : r.phone;
      const name = (typeof r === 'string') ? '' : r.name;
      const personalized = (s.message || ' ').replace(/{name}/g, name || '');
      const payload = { to, body: personalized, base64: mf?.base64 || '', filename: mf?.filename || '' };
      await postSendAndHandleResponse(payload, mf?.filename || '', personalized, to, {innerHTML:''});
      await sleep(RATE_DELAY_MS);
    }
  }
  alert('All schedules sent. Check logs.');
}

/* ---------- Automatic Schedule Runner ---------- */
setInterval(() => {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0,5);
  let schedules = JSON.parse(localStorage.getItem('wa_schedules') || '[]');
  // find schedules matching exact hh:mm
  const toRun = schedules.filter(s => s.time === hhmm);

  if(!toRun.length) return;

  (async () => {
    for(const s of toRun){
      const mf = s.fileMeta;
      for(const r of (s.recipients || [])){
        const to = (typeof r === 'string') ? r : r.phone;
        const name = (typeof r === 'string') ? '' : r.name;
        const personalized = (s.message || ' ').replace(/{name}/g, name || '');
        const payload = { to, body: personalized, base64: mf?.base64 || '', filename: mf?.filename || '' };
        await postSendAndHandleResponse(payload, mf?.filename || '', personalized, to, {innerHTML:''});
        await sleep(RATE_DELAY_MS);
      }
    }
    // remove run schedules (daily send) - original behaviour preserved
    schedules = schedules.filter(s => !toRun.includes(s));
    localStorage.setItem('wa_schedules', JSON.stringify(schedules));
    renderSchedules();
  })();
}, 60*1000);

/* ---------- Utilities ---------- */
function sleep(ms){return new Promise(res=>setTimeout(res, ms));}
function escapeHtml(text){ return String(text || '').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
