const API_BASE = 'http://localhost:5001/api';

let applicationsCache = [];
let companiesCache = [];
let adminJobsCache = [];

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.parentNode && toast.remove(), 3500);
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'none';
}

function updateLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (el) el.textContent = new Date().toLocaleString();
}

function showSection(section) {
    document.querySelectorAll('.main-content > section').forEach(sec => {
        sec.style.display = 'none';
    });
    const target = document.getElementById(section + '-section');
    if (target) target.style.display = 'block';
    document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
    const nav = document.querySelector(`.sidebar-menu a[href="#${section}"]`);
    if (nav) nav.classList.add('active');

    if (section === 'reports') loadReportsSection();
    if (section === 'settings') loadContactMessages();
    if (section === 'candidates') loadCandidatesTable();
    if (section === 'companies') loadCompaniesTable();
}

function formatJobType(type) {
    if (!type) return '';
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString();
    } catch {
        return iso;
    }
}

async function loadDashboardStats() {
    try {
        const r = await fetch(`${API_BASE}/dashboard/stats`);
        if (!r.ok) throw new Error('stats failed');
        const s = await r.json();
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };
        set('statActiveJobs', s.active_jobs);
        set('statTotalApplications', s.total_applications);
        set('statPending', s.pending_applications);
        set('statCandidates', s.unique_candidates ?? '—');
        renderRecentApplications(s.recent_applications || []);
    } catch (e) {
        console.error(e);
        showToast('Could not load dashboard stats. Is the API running?', 'error');
    }
}

function renderRecentApplications(apps) {
    const tbody = document.getElementById('recentApplications');
    if (!tbody) return;
    if (!apps.length) {
        tbody.innerHTML = '<tr><td colspan="5">No applications yet.</td></tr>';
        return;
    }
    tbody.innerHTML = apps.map(app => `
        <tr>
            <td>${escapeHtml(app.applicant_name)}</td>
            <td>${escapeHtml(app.job_title || '')}</td>
            <td>${formatDate(app.applied_at)}</td>
            <td><span class="status-badge status-${app.status}">${app.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn-sm btn-view" onclick="openApplicationDetail(${app.id})">View</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadJobsTable() {
    try {
        const r = await fetch(`${API_BASE}/jobs?all=true&per_page=200`);
        if (!r.ok) throw new Error('jobs failed');
        const data = await r.json();
        adminJobsCache = data.jobs || [];
        const tbody = document.getElementById('jobsTable');
        if (!tbody) return;
        if (!adminJobsCache.length) {
            tbody.innerHTML = '<tr><td colspan="7">No jobs yet. Post one to get started.</td></tr>';
            return;
        }
        tbody.innerHTML = adminJobsCache.map(job => `
            <tr>
                <td>${escapeHtml(job.title)}</td>
                <td>${escapeHtml(job.company)}</td>
                <td>${escapeHtml(job.location)}</td>
                <td>${formatJobType(job.job_type)}</td>
                <td>${job.application_count ?? 0}</td>
                <td><span class="status-badge job-status-${job.status}">${job.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn-sm btn-view" onclick="viewJobPublic(${job.id})">View</button>
                        <button type="button" class="btn-sm btn-edit" onclick="editJob(${job.id})">Edit</button>
                        <button type="button" class="btn-sm btn-delete" onclick="deleteJobConfirm(${job.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        showToast('Could not load jobs', 'error');
    }
}

function viewJobPublic(jobId) {
    window.open(`/?#jobs`, '_blank');
    showToast(`Opening site — job ID ${jobId} (browse listings on the main page)`, 'info');
}

async function loadApplicationsTable() {
    try {
        const r = await fetch(`${API_BASE}/applications?per_page=500`);
        if (!r.ok) throw new Error('apps failed');
        const data = await r.json();
        applicationsCache = data.applications || [];
        filterApplications();
    } catch (e) {
        console.error(e);
        showToast('Could not load applications', 'error');
    }
}

function filterApplications() {
    const filter = document.getElementById('applicationFilter')?.value || '';
    const list = filter
        ? applicationsCache.filter(a => a.status === filter)
        : applicationsCache;
    renderApplicationsTable(list);
}

function renderApplicationsTable(apps) {
    const tbody = document.getElementById('applicationsTable');
    if (!tbody) return;
    if (!apps.length) {
        tbody.innerHTML = '<tr><td colspan="7">No applications match this filter.</td></tr>';
        return;
    }
    tbody.innerHTML = apps.map(app => `
        <tr>
            <td>${app.id}</td>
            <td>${escapeHtml(app.applicant_name)}</td>
            <td>${escapeHtml(app.applicant_email)}</td>
            <td>${escapeHtml(app.job_title || '')}</td>
            <td>${formatDate(app.applied_at)}</td>
            <td>
                <select aria-label="Status" data-app-id="${app.id}" onchange="updateApplicationStatus(${app.id}, this.value)">
                    <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                    <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn-sm btn-view" onclick="openApplicationDetail(${app.id})">View</button>
                    <button type="button" class="btn-sm btn-delete" onclick="deleteApplicationConfirm(${app.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function updateApplicationStatus(appId, newStatus) {
    try {
        const r = await fetch(`${API_BASE}/applications/${appId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!r.ok) throw new Error('update failed');
        const updated = await r.json();
        const idx = applicationsCache.findIndex(a => a.id === appId);
        if (idx >= 0) applicationsCache[idx] = updated;
        showToast('Status updated', 'success');
        loadDashboardStats();
    } catch (e) {
        showToast('Could not update status', 'error');
    }
}

function openApplicationDetail(id) {
    const app = applicationsCache.find(a => a.id === id);
    if (!app) {
        showToast('Application not loaded', 'error');
        return;
    }
    document.getElementById('appDetailName').textContent = app.applicant_name;
    document.getElementById('appDetailEmail').textContent = app.applicant_email;
    document.getElementById('appDetailPhone').textContent = app.applicant_phone || '—';
    document.getElementById('appDetailJob').textContent = `${app.job_title || ''} (${app.company || ''})`;
    document.getElementById('appDetailCover').innerHTML = escapeHtml(app.cover_letter || '').replace(/\n/g, '<br>');
    document.getElementById('appDetailNotes').value = app.admin_notes || '';
    document.getElementById('appDetailId').value = String(app.id);
    const link = document.getElementById('appResumeLink');
    link.href = `${API_BASE}/applications/${app.id}/resume`;
    link.style.display = app.resume_filename ? 'inline-block' : 'none';
    document.getElementById('applicationDetailModal').style.display = 'block';
}

async function saveApplicationNotes() {
    const id = document.getElementById('appDetailId').value;
    const notes = document.getElementById('appDetailNotes').value;
    try {
        const r = await fetch(`${API_BASE}/applications/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_notes: notes }),
        });
        if (!r.ok) throw new Error('save notes failed');
        const updated = await r.json();
        const idx = applicationsCache.findIndex(a => a.id === Number(id));
        if (idx >= 0) applicationsCache[idx] = updated;
        showToast('Notes saved', 'success');
    } catch (e) {
        showToast('Could not save notes', 'error');
    }
}

async function deleteApplicationConfirm(appId) {
    if (!confirm('Delete this application permanently?')) return;
    try {
        const r = await fetch(`${API_BASE}/applications/${appId}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('delete failed');
        applicationsCache = applicationsCache.filter(a => a.id !== appId);
        filterApplications();
        loadDashboardStats();
        showToast('Application deleted', 'success');
    } catch (e) {
        showToast('Could not delete application', 'error');
    }
}

function newJobForm() {
    document.getElementById('editingJobId').value = '';
    document.getElementById('jobModalHeading').textContent = 'Post New Job';
    const f = document.querySelector('#jobModal form');
    if (f) f.reset();
    document.getElementById('jobStatus').value = 'active';
    document.getElementById('jobModal').style.display = 'block';
}

function showJobForm() {
    document.getElementById('jobModal').style.display = 'block';
}

function editJob(jobId) {
    const job = adminJobsCache.find(j => j.id === jobId);
    if (!job) {
        showToast('Job not found in list — refresh Jobs.', 'error');
        return;
    }
    document.getElementById('editingJobId').value = String(job.id);
    document.getElementById('jobModalHeading').textContent = 'Edit Job';
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('jobCompany').value = job.company;
    document.getElementById('jobLocation').value = job.location;
    document.getElementById('jobType').value = job.job_type;
    document.getElementById('jobCategory').value = job.category;
    document.getElementById('jobSalary').value = job.salary;
    document.getElementById('jobDescription').value = job.description;
    document.getElementById('jobTags').value = (job.tags || []).join(', ');
    document.getElementById('jobStatus').value = job.status || 'active';
    showJobForm();
}

async function handleJobSubmit(event) {
    event.preventDefault();
    const editingId = document.getElementById('editingJobId').value;
    const tagsRaw = document.getElementById('jobTags').value;
    const payload = {
        title: document.getElementById('jobTitle').value,
        company: document.getElementById('jobCompany').value,
        location: document.getElementById('jobLocation').value,
        job_type: document.getElementById('jobType').value,
        category: document.getElementById('jobCategory').value,
        salary: document.getElementById('jobSalary').value,
        description: document.getElementById('jobDescription').value,
        tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
        status: document.getElementById('jobStatus').value,
    };
    try {
        if (editingId) {
            const r = await fetch(`${API_BASE}/jobs/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error('update job failed');
        } else {
            const r = await fetch(`${API_BASE}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error('create job failed');
        }
        closeModal('jobModal');
        event.target.reset();
        document.getElementById('editingJobId').value = '';
        document.getElementById('jobModalHeading').textContent = 'Post New Job';
        await loadJobsTable();
        await loadDashboardStats();
        showToast('Job saved', 'success');
    } catch (e) {
        console.error(e);
        showToast('Could not save job', 'error');
    }
}

async function deleteJobConfirm(jobId) {
    if (!confirm('Delete this job and all of its applications?')) return;
    try {
        const r = await fetch(`${API_BASE}/jobs/${jobId}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('delete failed');
        await loadJobsTable();
        await loadApplicationsTable();
        await loadDashboardStats();
        showToast('Job deleted', 'success');
    } catch (e) {
        showToast('Could not delete job', 'error');
    }
}

function loadCandidatesTable() {
    const tbody = document.getElementById('candidatesTable');
    if (!tbody) return;
    const map = new Map();
    applicationsCache.forEach(a => {
        const key = (a.applicant_email || '').toLowerCase();
        if (!key) return;
        if (!map.has(key)) {
            map.set(key, {
                name: a.applicant_name,
                email: a.applicant_email,
                count: 0,
                last: a.applied_at || '',
            });
        }
        const o = map.get(key);
        o.count += 1;
        if (a.applied_at && a.applied_at > o.last) o.last = a.applied_at;
    });
    const rows = [...map.values()].sort((a, b) => b.count - a.count);
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4">No candidates yet.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(c => `
        <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${c.count}</td>
            <td>${formatDate(c.last)}</td>
        </tr>
    `).join('');
}

async function loadCompaniesTable() {
    const tbody = document.getElementById('companiesTable');
    if (!tbody) return;
    try {
        const r = await fetch(`${API_BASE}/companies`);
        if (!r.ok) throw new Error('companies failed');
        companiesCache = await r.json();
        if (!companiesCache.length) {
            tbody.innerHTML = '<tr><td colspan="5">No companies yet. Add one below.</td></tr>';
            return;
        }
        tbody.innerHTML = companiesCache.map(c => `
            <tr>
                <td>${escapeHtml(c.name)}</td>
                <td>${escapeHtml(c.industry || '—')}</td>
                <td>${escapeHtml(c.location || '—')}</td>
                <td>${escapeHtml(c.size || '—')}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn-sm btn-edit" onclick="openCompanyModal(${c.id})">Edit</button>
                        <button type="button" class="btn-sm btn-delete" onclick="deleteCompanyConfirm(${c.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5">Could not load companies.</td></tr>';
    }
}

function openCompanyModal(companyId = null) {
    document.getElementById('editingCompanyId').value = companyId ? String(companyId) : '';
    document.getElementById('companyModalHeading').textContent = companyId ? 'Edit Company' : 'Add Company';
    const f = document.getElementById('companyForm');
    if (f) f.reset();
    if (companyId) {
        const c = companiesCache.find(x => x.id === companyId);
        if (c) {
            document.getElementById('companyName').value = c.name;
            document.getElementById('companyIndustry').value = c.industry || '';
            document.getElementById('companyLocation').value = c.location || '';
            document.getElementById('companySize').value = c.size || '';
            document.getElementById('companyWebsite').value = c.website || '';
            document.getElementById('companyDescription').value = c.description || '';
            document.getElementById('companyLogo').value = c.logo_url || '';
        }
    }
    document.getElementById('companyModal').style.display = 'block';
}

async function handleCompanySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editingCompanyId').value;
    const payload = {
        name: document.getElementById('companyName').value,
        industry: document.getElementById('companyIndustry').value || null,
        location: document.getElementById('companyLocation').value || null,
        size: document.getElementById('companySize').value || null,
        website: document.getElementById('companyWebsite').value || null,
        description: document.getElementById('companyDescription').value || null,
        logo_url: document.getElementById('companyLogo').value || null,
    };
    try {
        if (id) {
            const r = await fetch(`${API_BASE}/companies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error('update company failed');
        } else {
            const r = await fetch(`${API_BASE}/companies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error('create company failed');
        }
        closeModal('companyModal');
        await loadCompaniesTable();
        await loadDashboardStats();
        showToast('Company saved', 'success');
    } catch (err) {
        showToast('Could not save company (name must be unique).', 'error');
    }
}

async function deleteCompanyConfirm(companyId) {
    if (!confirm('Delete this company record?')) return;
    try {
        const r = await fetch(`${API_BASE}/companies/${companyId}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('delete company failed');
        await loadCompaniesTable();
        await loadDashboardStats();
        showToast('Company deleted', 'success');
    } catch (e) {
        showToast('Could not delete company', 'error');
    }
}

async function loadReportsSection() {
    const el = document.getElementById('reportsBreakdown');
    if (!el) return;
    el.innerHTML = '<p>Loading…</p>';
    try {
        const r = await fetch(`${API_BASE}/dashboard/stats`);
        if (!r.ok) throw new Error('stats');
        const s = await r.json();
        const byStatus = s.applications_by_status || {};
        const lines = Object.keys(byStatus).length
            ? Object.entries(byStatus).map(([k, v]) => `<li><strong>${escapeHtml(k)}</strong>: ${v}</li>`).join('')
            : '<li>No application data yet.</li>';
        el.innerHTML = `
            <p><strong>Applications by status</strong></p>
            <ul style="margin-left:1.25rem;">${lines}</ul>
            <p><strong>Contact messages (all time):</strong> ${s.total_contact_messages ?? 0}</p>
            <p><strong>Companies in directory:</strong> ${s.active_companies ?? 0}</p>
        `;
    } catch (e) {
        el.innerHTML = '<p>Could not load reports.</p>';
    }
}

async function loadContactMessages() {
    const tbody = document.getElementById('contactMessagesBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';
    try {
        const r = await fetch(`${API_BASE}/contact-messages?per_page=50`);
        if (!r.ok) throw new Error('contact');
        const data = await r.json();
        const msgs = data.messages || [];
        if (!msgs.length) {
            tbody.innerHTML = '<tr><td colspan="4">No messages yet.</td></tr>';
            return;
        }
        tbody.innerHTML = msgs.map(m => `
            <tr>
                <td>${formatDate(m.created_at)}</td>
                <td>${escapeHtml(m.name)}</td>
                <td>${escapeHtml(m.email)}</td>
                <td>${escapeHtml(m.message).slice(0, 200)}${(m.message || '').length > 200 ? '…' : ''}</td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4">Could not load messages.</td></tr>';
    }
}

function logout() {
    if (confirm('Leave the admin dashboard?')) {
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateLastUpdated();
    setInterval(updateLastUpdated, 60000);
    await loadDashboardStats();
    await loadJobsTable();
    await loadApplicationsTable();
    await loadCompaniesTable();
});

window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) header.classList.toggle('header-scrolled', window.scrollY > 24);
});

window.onclick = function (event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

window.showSection = showSection;
window.filterApplications = filterApplications;
window.showJobForm = newJobForm;
window.handleJobSubmit = handleJobSubmit;
window.closeModal = closeModal;
window.editJob = editJob;
window.deleteJobConfirm = deleteJobConfirm;
window.viewJobPublic = viewJobPublic;
window.openApplicationDetail = openApplicationDetail;
window.updateApplicationStatus = updateApplicationStatus;
window.deleteApplicationConfirm = deleteApplicationConfirm;
window.saveApplicationNotes = saveApplicationNotes;
window.openCompanyModal = openCompanyModal;
window.handleCompanySubmit = handleCompanySubmit;
window.deleteCompanyConfirm = deleteCompanyConfirm;
window.logout = logout;
