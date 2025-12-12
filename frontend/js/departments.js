/**
 * Departments Management
 * Handles CRUD operations for departments
 */

const API_BASE = 'https://be.apps.bredimedia.com/api';
let departments = [];
let currentDepartment = null;
let isEditMode = false;

// DOM Elements
const departmentModal = document.getElementById('departmentModal');
const departmentForm = document.getElementById('departmentForm');
const departmentsTableBody = document.querySelector('tbody');
const addDepartmentBtn = document.querySelector('button[class*="bg-primary"]');
const searchInput = document.querySelector('input[placeholder="Birim ara..."]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDepartments();
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add department button
    addDepartmentBtn.addEventListener('click', () => openModal());

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterDepartments(query);
    });

    // Modal close on background click
    departmentModal.addEventListener('click', (e) => {
        if (e.target === departmentModal) {
            closeModal();
        }
    });
}

/**
 * Load all departments
 */
async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE}/departments`);
        if (!response.ok) throw new Error('Failed to fetch departments');

        departments = await response.json();
        renderDepartments(departments);
    } catch (error) {
        console.error('Error loading departments:', error);
        showNotification('Birimler yüklenemedi', 'error');
    }
}

/**
 * Render departments table
 */
function renderDepartments(data) {
    if (!departmentsTableBody) return;

    departmentsTableBody.innerHTML = data.map(dept => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    ${dept.code}
                </span>
            </td>
            <td class="px-6 py-4">
                <p class="font-medium text-gray-900">${dept.name}</p>
                ${dept.description ? `<p class="text-sm text-gray-600 mt-1">${dept.description}</p>` : ''}
            </td>
            <td class="px-6 py-4">
                ${dept.parent ? `<span class="text-gray-600">${dept.parent.code} - ${dept.parent.name}</span>` : '<span class="text-gray-500">-</span>'}
            </td>
            <td class="px-6 py-4">
                <span class="text-gray-900">${dept.children ? dept.children.length : 0}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="editDepartment(${dept.id})" class="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition">
                        Düzenle
                    </button>
                    <button onclick="deleteDepartment(${dept.id})" class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                        Sil
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter departments by search query
 */
function filterDepartments(query) {
    const filtered = departments.filter(dept =>
        dept.code.toLowerCase().includes(query) ||
        dept.name.toLowerCase().includes(query) ||
        (dept.description && dept.description.toLowerCase().includes(query))
    );
    renderDepartments(filtered);
}

/**
 * Open modal for add/edit
 */
function openModal(department = null) {
    isEditMode = !!department;
    currentDepartment = department;

    const modalTitle = departmentModal.querySelector('h2');
    modalTitle.textContent = isEditMode ? 'Birim Düzenle' : 'Yeni Birim Ekle';

    // Populate form
    const codeInput = departmentModal.querySelector('input[placeholder*="Örn: B"]');
    const nameInput = departmentModal.querySelector('input[placeholder*="Birim adını"]');
    const descInput = departmentModal.querySelector('textarea');
    const parentSelect = departmentModal.querySelector('select');

    if (department) {
        codeInput.value = department.code;
        nameInput.value = department.name;
        if (descInput) descInput.value = department.description || '';
        if (parentSelect) parentSelect.value = department.parentId || '';
    } else {
        codeInput.value = '';
        nameInput.value = '';
        if (descInput) descInput.value = '';
        if (parentSelect) parentSelect.value = '';
    }

    // Update parent options
    updateParentOptions(department?.id);

    departmentModal.classList.remove('hidden');
}

/**
 * Close modal
 */
function closeModal() {
    departmentModal.classList.add('hidden');
    currentDepartment = null;
    isEditMode = false;
}

/**
 * Update parent department options
 */
function updateParentOptions(excludeId = null) {
    const parentSelect = departmentModal.querySelector('select');
    if (!parentSelect) return;

    const options = departments
        .filter(dept => dept.id !== excludeId)
        .map(dept => `<option value="${dept.id}">${dept.code} - ${dept.name}</option>`)
        .join('');

    parentSelect.innerHTML = `<option value="">Yok (Ana Birim)</option>${options}`;
}

/**
 * Save department (create or update)
 */
async function saveDepartment() {
    const codeInput = departmentModal.querySelector('input[placeholder*="Örn: B"]');
    const nameInput = departmentModal.querySelector('input[placeholder*="Birim adını"]');
    const descInput = departmentModal.querySelector('textarea');
    const parentSelect = departmentModal.querySelector('select');

    const data = {
        code: codeInput.value.trim(),
        name: nameInput.value.trim(),
        description: descInput?.value.trim() || null,
        parentId: parentSelect?.value || null
    };

    if (!data.code || !data.name) {
        showNotification('Kod ve isim zorunludur', 'error');
        return;
    }

    try {
        const url = isEditMode
            ? `${API_BASE}/departments/${currentDepartment.id}`
            : `${API_BASE}/departments`;

        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'İşlem başarısız');
        }

        showNotification(isEditMode ? 'Birim güncellendi' : 'Birim oluşturuldu', 'success');
        closeModal();
        loadDepartments();
    } catch (error) {
        console.error('Save error:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Edit department
 */
async function editDepartment(id) {
    const department = departments.find(d => d.id === id);
    if (department) {
        openModal(department);
    }
}

/**
 * Delete department
 */
async function deleteDepartment(id) {
    if (!confirm('Bu birimi silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Silme başarısız');
        }

        showNotification('Birim silindi', 'success');
        loadDepartments();
    } catch (error) {
        console.error('Delete error:', error);
        showNotification(error.message, 'error');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced with toast notifications
    alert(message);
}

// Expose functions globally
window.editDepartment = editDepartment;
window.deleteDepartment = deleteDepartment;
window.saveDepartment = saveDepartment;
window.closeModal = closeModal;
