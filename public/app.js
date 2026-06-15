let itemTypes = [];

// ── Load item types for dropdowns ──
async function loadItemTypes() {
  try {
    const res = await fetch('/api/item-types');
    const data = await res.json();
    if (data.success) {
      itemTypes = data.data;
      addItemRow();
    }
  } catch (err) {
    console.error('Failed to load item types:', err);
  }
}

// ── Build dropdown options ──
function buildOptions(selectedId = '') {
  return itemTypes.map(t =>
    `<option value="${t.id}" ${t.id == selectedId ? 'selected' : ''}>${t.type_name}</option>`
  ).join('');
}

// ── Add a new item row ──
function addItemRow() {
  const container = document.getElementById('itemRows');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <input type="text" placeholder="Enter item name" class="item-name" />
    <select class="item-type">
      <option value="">-- Select Type --</option>
      ${buildOptions()}
    </select>
    <div class="stock-cell">
      <input type="checkbox" class="item-stock" checked />
    </div>
    <button class="btn-remove" onclick="removeRow(this)">✕</button>
  `;
  container.appendChild(div);
}

// ── Remove an item row ──
function removeRow(btn) {
  const rows = document.querySelectorAll('.item-row');
  if (rows.length === 1) {
    showError(['At least one item is required.']);
    return;
  }
  btn.closest('.item-row').remove();
}

// ── Submit purchase ──
async function submitPurchase() {
  hideMessages();

  const purchase_date = document.getElementById('purchaseDate').value;
  const rows = document.querySelectorAll('.item-row');

  const items = [...rows].map(row => ({
    name: row.querySelector('.item-name').value.trim(),
    item_type_id: row.querySelector('.item-type').value,
    stock_available: row.querySelector('.item-stock').checked
  }));

  try {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_date, items })
    });

    const data = await res.json();

    if (!data.success) {
      showError(data.errors || [data.message]);
      return;
    }

    showSuccess(data.message);
    resetForm();
    loadPurchases();
  } catch (err) {
    showError(['Server error. Please try again.']);
  }
}

// ── Reset form ──
function resetForm() {
  document.getElementById('purchaseDate').value = '';
  document.getElementById('itemRows').innerHTML = '';
  addItemRow();
}

// ── Load all purchases ──
async function loadPurchases() {
  try {
    const res = await fetch('/api/purchases');
    const data = await res.json();

    const container = document.getElementById('tableContainer');

    if (!data.success || data.data.length === 0) {
      container.innerHTML = '<p class="empty-msg">No purchases yet. Add one above.</p>';
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Purchase Date</th>
            <th>Item Name</th>
            <th>Item Type</th>
            <th>In Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.data.forEach(purchase => {
      const date = new Date(purchase.purchase_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      purchase.items.forEach((item, index) => {
        html += `
          <tr id="row-${item.id}">
            <td>${index === 0 ? `<strong>${date}</strong>` : ''}</td>
            <td id="name-${item.id}">${item.name}</td>
            <td id="type-${item.id}">${item.type_name}</td>
            <td id="stock-${item.id}">
              <span class="${item.stock_available ? 'badge-in' : 'badge-out'}">
                ${item.stock_available ? 'In Stock' : 'Out of Stock'}
              </span>
            </td>
            <td>
              <button class="btn-edit" onclick="editItem(${item.id}, '${item.name}', ${item.item_type_id}, ${item.stock_available})">Edit</button>
              <button class="btn-delete" onclick="deleteItem(${item.id})">Delete</button>
            </td>
          </tr>
        `;
      });

      // Purchase group separator
      html += `
        <tr>
          <td colspan="5" style="padding:4px; background:#f0f2f8;"></td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load purchases:', err);
  }
}

// ── Edit item (inline) ──
function editItem(id, name, typeId, stock) {
  const row = document.getElementById(`row-${id}`);
  const nameCell = document.getElementById(`name-${id}`);
  const typeCell = document.getElementById(`type-${id}`);
  const stockCell = document.getElementById(`stock-${id}`);

  nameCell.innerHTML = `<input class="edit-input" id="edit-name-${id}" value="${name}" />`;
  typeCell.innerHTML = `<select class="edit-select" id="edit-type-${id}"><option value="">-- Select --</option>${buildOptions(typeId)}</select>`;
  stockCell.innerHTML = `<input type="checkbox" id="edit-stock-${id}" ${stock ? 'checked' : ''} style="width:18px;height:18px;accent-color:#2c3e7a;" />`;

  const actionCell = row.querySelector('td:last-child');
  actionCell.innerHTML = `
    <button class="btn-save" onclick="saveItem(${id})">Save</button>
    <button class="btn-cancel" onclick="loadPurchases()">Cancel</button>
  `;
}

// ── Save edited item ──
async function saveItem(id) {
  const name = document.getElementById(`edit-name-${id}`).value.trim();
  const item_type_id = document.getElementById(`edit-type-${id}`).value;
  const stock_available = document.getElementById(`edit-stock-${id}`).checked;

  try {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, item_type_id, stock_available })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.errors ? data.errors.join('\n') : data.message);
      return;
    }

    loadPurchases();
  } catch (err) {
    alert('Failed to update item.');
  }
}

// ── Delete item ──
async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  try {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    loadPurchases();
  } catch (err) {
    alert('Failed to delete item.');
  }
}

// ── Show error messages ──
function showError(errors) {
  const box = document.getElementById('errorBox');
  box.innerHTML = errors.map(e => `<div>⚠ ${e}</div>`).join('');
  box.style.display = 'block';
}

// ── Show success message ──
function showSuccess(message) {
  const box = document.getElementById('successBox');
  box.innerHTML = `✓ ${message}`;
  box.style.display = 'block';
}

// ── Hide all messages ──
function hideMessages() {
  document.getElementById('errorBox').style.display = 'none';
  document.getElementById('successBox').style.display = 'none';
}

// ── Init on page load ──
window.onload = () => {
  loadItemTypes();
  loadPurchases();
};