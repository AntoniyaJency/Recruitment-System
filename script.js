// Sample job data
const jobData = [
    {
        id: 1,
        title: "Senior Frontend Developer",
        company: "TechCorp Solutions",
        location: "San Francisco, CA",
        type: "full-time",
        category: "technology",
        salary: "$120,000 - $160,000",
        description: "We are looking for an experienced Frontend Developer to join our growing team and help build amazing user experiences.",
        tags: ["React", "JavaScript", "CSS", "HTML5"]
    },
    {
        id: 2,
        title: "Digital Marketing Manager",
        company: "GrowthHub Inc",
        location: "New York, NY",
        type: "full-time",
        category: "marketing",
        salary: "$80,000 - $100,000",
        description: "Join our marketing team to drive digital campaigns and help us reach new heights in customer engagement.",
        tags: ["SEO", "SEM", "Social Media", "Analytics"]
    },
    {
        id: 3,
        title: "Sales Representative",
        company: "SalesForce Pro",
        location: "Chicago, IL",
        type: "remote",
        category: "sales",
        salary: "$60,000 - $80,000 + Commission",
        description: "Looking for motivated sales professionals to help expand our client base and drive revenue growth.",
        tags: ["B2B Sales", "CRM", "Negotiation", "Communication"]
    },
    {
        id: 4,
        title: "Financial Analyst",
        company: "FinanceWise",
        location: "Boston, MA",
        type: "full-time",
        category: "finance",
        salary: "$90,000 - $120,000",
        description: "Seeking a detail-oriented Financial Analyst to help with financial planning, analysis, and reporting.",
        tags: ["Excel", "Financial Modeling", "Analysis", "Reporting"]
    },
    {
        id: 5,
        title: "Registered Nurse",
        company: "City Medical Center",
        location: "Los Angeles, CA",
        type: "part-time",
        category: "healthcare",
        salary: "$35 - $45 per hour",
        description: "Join our healthcare team to provide excellent patient care in a dynamic medical environment.",
        tags: ["Patient Care", "Medical Records", "CPR", "Nursing"]
    },
    {
        id: 6,
        title: "Backend Developer",
        company: "CloudTech Systems",
        location: "Seattle, WA",
        type: "remote",
        category: "technology",
        salary: "$110,000 - $140,000",
        description: "We need a skilled Backend Developer to build scalable server-side applications and APIs.",
        tags: ["Node.js", "Python", "AWS", "MongoDB"]
    }
];

let currentJobs = [...jobData];
let displayedJobs = 6;
let jobsTotalFromApi = jobData.length;
let sortMode = 'newest';
const SAVED_JOBS_KEY = 'recruithub_saved_job_ids';
const USER_SESSION_KEY = 'recruithub_user';
const JOB_ALERTS_KEY = 'recruithub_job_alerts';

function getApiBaseUrl() {
    if (window.location.protocol === 'file:') {
        return 'http://localhost:5001/api';
    }
    if (window.location.port === '5001') {
        return `${window.location.origin}/api`;
    }
    return 'http://localhost:5001/api';
}

const API_BASE_URL = getApiBaseUrl();

function getJobType(job) {
    return job.job_type || job.type || '';
}

function getSavedJobIds() {
    try {
        const raw = localStorage.getItem(SAVED_JOBS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.map(Number).filter(Boolean) : [];
    } catch {
        return [];
    }
}

function setSavedJobIds(ids) {
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(ids));
}

function isJobSaved(jobId) {
    return getSavedJobIds().includes(Number(jobId));
}

function toggleSaveJob(event, jobId) {
    event.stopPropagation();
    const id = Number(jobId);
    let ids = getSavedJobIds();
    if (ids.includes(id)) {
        ids = ids.filter(x => x !== id);
        showToast('Removed from saved jobs', 'info');
    } else {
        ids.push(id);
        showToast('Job saved', 'success');
    }
    setSavedJobIds(ids);
    renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
    renderSavedJobs();
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function scrollToSaved(e) {
    e.preventDefault();
    const el = document.getElementById('saved-jobs');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderSavedJobs();
}

function renderSavedJobs() {
    const list = document.getElementById('savedJobsList');
    const hint = document.getElementById('savedJobsHint');
    if (!list || !hint) return;
    const ids = getSavedJobIds();
    if (!ids.length) {
        hint.style.display = '';
        list.innerHTML = '';
        return;
    }
    hint.style.display = 'none';
    const byId = new Map(currentJobs.map(j => [j.id, j]));
    list.innerHTML = ids.map(id => {
        const j = byId.get(id);
        if (!j) {
            return `<span class="saved-job-missing">Job #${id} is no longer listed</span>`;
        }
        return `<button type="button" class="saved-job-chip" onclick="showJobDetails(${j.id})">${escapeHtml(j.title)} · ${escapeHtml(j.company)}</button>`;
    }).join('');
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const y = document.getElementById('footerYear');
    if (y) y.textContent = String(new Date().getFullYear());
    restoreSession();
    refreshAlertsSummary();
    loadJobsFromAPI();
    setupEventListeners();
    loadAboutStats();
});

async function loadAboutStats() {
    try {
        const r = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if (!r.ok) return;
        const s = await r.json();
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v ?? '—';
        };
        set('statPublicJobs', s.active_jobs);
        set('statPublicCompanies', s.active_companies);
        set('statPublicApps', s.total_applications);
    } catch (e) {
        console.warn('About stats unavailable', e);
    }
}

function applyJobSort(jobs) {
    const arr = [...jobs];
    if (sortMode === 'title') {
        arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
    } else if (sortMode === 'company') {
        arr.sort((a, b) => (a.company || '').localeCompare(b.company || '', undefined, { sensitivity: 'base' }));
    } else {
        arr.sort((a, b) => {
            const ta = new Date(a.created_at || 0).getTime();
            const tb = new Date(b.created_at || 0).getTime();
            return tb - ta;
        });
    }
    return arr;
}

function onSortChange() {
    const sel = document.getElementById('sortJobs');
    sortMode = sel ? sel.value : 'newest';
    renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
    updateLoadMoreVisibility();
    updateResultsMeta();
}

function updateResultsMeta() {
    const el = document.getElementById('jobResultsMeta');
    if (!el) return;
    const total = currentJobs.length;
    const shown = Math.min(displayedJobs, total);
    if (total === 0) {
        el.textContent = 'No roles match your filters right now.';
        return;
    }
    el.textContent = `Showing ${shown} of ${total} open roles`;
}

function updateLoadMoreVisibility() {
    const loadMoreBtn = document.querySelector('.load-more-container');
    if (!loadMoreBtn) return;
    loadMoreBtn.style.display = currentJobs.length > displayedJobs ? 'block' : 'none';
}

function clearJobFilters() {
    const js = document.getElementById('jobSearch');
    const ls = document.getElementById('locationSearch');
    const cf = document.getElementById('categoryFilter');
    const tf = document.getElementById('typeFilter');
    const sr = document.getElementById('sortJobs');
    if (js) js.value = '';
    if (ls) ls.value = '';
    if (cf) cf.value = '';
    if (tf) tf.value = '';
    if (sr) sr.value = 'newest';
    sortMode = 'newest';
    searchJobs();
}

async function maybeOpenJobFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('job');
    if (!id && window.location.hash && window.location.hash.startsWith('#job-')) {
        id = window.location.hash.slice('#job-'.length);
    }
    if (!id) return;
    const n = Number(id);
    if (n) await showJobDetails(n);
}

function jobMatchesSavedAlert(job) {
    try {
        const raw = localStorage.getItem(JOB_ALERTS_KEY);
        if (!raw) return false;
        const { keywords } = JSON.parse(raw);
        if (!keywords || !keywords.length) return false;
        const tags = (job.tags || []).join(' ');
        const hay = `${job.title} ${job.company} ${tags} ${job.description || ''}`.toLowerCase();
        return keywords.some(kw => hay.includes(kw));
    } catch {
        return false;
    }
}

// Load jobs from API
async function loadJobsFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs?per_page=100`);
        if (response.ok) {
            const data = await response.json();
            currentJobs = data.jobs || [];
            jobsTotalFromApi = typeof data.total === 'number' ? data.total : currentJobs.length;
            displayedJobs = currentJobs.length === 0 ? 0 : Math.min(6, currentJobs.length);
            renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
            updateLoadMoreVisibility();
            updateResultsMeta();
            renderSavedJobs();
            await populateFiltersFromAPI();
            await maybeOpenJobFromUrl();
        } else {
            console.error('Failed to load jobs from API');
            currentJobs = jobData;
            jobsTotalFromApi = jobData.length;
            displayedJobs = Math.min(6, jobData.length);
            renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
            updateLoadMoreVisibility();
            updateResultsMeta();
            renderSavedJobs();
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        currentJobs = jobData;
        jobsTotalFromApi = jobData.length;
        displayedJobs = Math.min(6, jobData.length);
        renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
        updateLoadMoreVisibility();
        updateResultsMeta();
        renderSavedJobs();
    }
}

async function populateFiltersFromAPI() {
    try {
        const r = await fetch(`${API_BASE_URL}/jobs/meta`);
        if (!r.ok) return;
        const meta = await r.json();
        const catSel = document.getElementById('categoryFilter');
        const typeSel = document.getElementById('typeFilter');
        if (catSel && meta.categories && meta.categories.length) {
            const cur = catSel.value;
            catSel.innerHTML = '<option value="">All Categories</option>' +
                meta.categories.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('');
            catSel.value = cur;
        }
        if (typeSel && meta.job_types && meta.job_types.length) {
            const cur = typeSel.value;
            typeSel.innerHTML = '<option value="">All Types</option>' +
                meta.job_types.map(t => {
                    const label = t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    return `<option value="${t}">${label}</option>`;
                }).join('');
            typeSel.value = cur;
        }
    } catch (e) {
        console.warn('Could not load filter metadata', e);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Search functionality
    document.getElementById('jobSearch').addEventListener('input', debounce(searchJobs, 300));
    document.getElementById('locationSearch').addEventListener('input', debounce(searchJobs, 300));

    document.querySelectorAll('.nav-menu .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

window.onSortChange = onSortChange;
window.clearJobFilters = clearJobFilters;
window.showSignupModal = showSignupModal;
window.logoutUser = logoutUser;
window.goAdmin = goAdmin;
window.openCareerAdvice = openCareerAdvice;
window.openResumeBuilder = openResumeBuilder;
window.openPricingModal = openPricingModal;
window.openResourcesModal = openResourcesModal;
window.openForgotPassword = openForgotPassword;
window.openJobAlertsModal = openJobAlertsModal;
window.saveJobAlert = saveJobAlert;
window.downloadResumeTemplate = downloadResumeTemplate;
window.socialDemo = socialDemo;

// Render jobs to the page
function renderJobs(jobs) {
    const jobGrid = document.getElementById('jobGrid');
    
    if (jobs.length === 0) {
        jobGrid.innerHTML = '<div class="no-jobs"><p>No jobs found matching your criteria.</p></div>';
        return;
    }
    
    const tagsList = job => (job.tags || []).map(tag => `<span class="job-tag">${escapeHtml(tag)}</span>`).join('');
    const desc = escapeHtml((job.description || '').slice(0, 180)) + ((job.description || '').length > 180 ? '…' : '');

    jobGrid.innerHTML = jobs.map(job => `
        <div class="job-card${jobMatchesSavedAlert(job) ? ' job-card-alert-match' : ''}" onclick="showJobDetails(${job.id})">
            <div class="job-header">
                <div class="job-header-main">
                    <h3 class="job-title">${escapeHtml(job.title)}</h3>
                    <p class="company-name">${escapeHtml(job.company)}</p>
                </div>
                <div class="job-header-badges">
                    <button type="button" class="job-save ${isJobSaved(job.id) ? 'saved' : ''}" title="Save job"
                        onclick="toggleSaveJob(event, ${job.id})" aria-label="Save job">
                        <i class="fas fa-heart"></i>
                    </button>
                    <span class="job-type">${formatJobType(getJobType(job))}</span>
                </div>
            </div>
            <div class="job-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${escapeHtml(job.location)}</span>
            </div>
            <p class="job-description">${desc}</p>
            <div class="job-tags">
                ${tagsList(job)}
            </div>
            <div class="job-footer">
                <span class="job-salary">${escapeHtml(job.salary)}</span>
                <button class="apply-btn" onclick="event.stopPropagation(); showApplicationModal(${job.id})">Apply Now</button>
            </div>
        </div>
    `).join('');
}

// Format job type for display
function formatJobType(type) {
    if (!type || !String(type).includes('-')) {
        if (!type) return '';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
    return type.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Search jobs
async function searchJobs() {
    const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
    const locationTerm = document.getElementById('locationSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (locationTerm) params.append('location', locationTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        if (typeFilter) params.append('type', typeFilter);
        
        const response = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`);
        if (response.ok) {
            const data = await response.json();
            currentJobs = data.jobs || [];
            jobsTotalFromApi = typeof data.total === 'number' ? data.total : currentJobs.length;
            displayedJobs = currentJobs.length === 0 ? 0 : Math.min(6, currentJobs.length);
            renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
            updateLoadMoreVisibility();
            updateResultsMeta();
            renderSavedJobs();
        } else {
            console.error('Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Filter jobs (called from select elements)
function filterJobs() {
    searchJobs();
}

// Load more jobs
function loadMoreJobs() {
    displayedJobs += 3;
    renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
    updateLoadMoreVisibility();
    updateResultsMeta();
}

// Show job details
async function showJobDetails(jobId) {
    const modal = document.getElementById('jobDetailModal');
    const body = document.getElementById('jobDetailBody');
    if (!modal || !body) return;
    modal.style.display = 'block';
    body.innerHTML = '<p class="muted">Loading…</p>';
    let job = currentJobs.find(j => j.id === jobId);
    if (!job) {
        try {
            const r = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
            if (r.ok) job = await r.json();
        } catch (e) {
            console.error(e);
        }
    }
    if (!job) {
        body.innerHTML = '<p>Job not found.</p>';
        return;
    }
    const titleEl = document.getElementById('jobDetailTitle');
    if (titleEl) titleEl.textContent = job.title;
    const tags = (job.tags || []).map(t => `<span class="job-tag">${escapeHtml(t)}</span>`).join('');
    const desc = escapeHtml(job.description || '').replace(/\n/g, '<br>');
    body.innerHTML = `
        <p class="company-name">${escapeHtml(job.company)}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(job.location)}</p>
        <p><strong>Type:</strong> ${formatJobType(getJobType(job))} &nbsp; <strong>Category:</strong> ${escapeHtml(job.category || '')}</p>
        <p class="job-salary-inline"><strong>Salary:</strong> ${escapeHtml(job.salary || '')}</p>
        <h4>Description</h4>
        <p class="job-detail-description">${desc}</p>
        <div class="job-tags">${tags}</div>
        <div class="job-detail-actions job-detail-actions-row">
            <button type="button" class="btn btn-primary" onclick="event.stopPropagation(); closeModal('jobDetailModal'); showApplicationModal(${job.id})">Apply now</button>
            <button type="button" class="btn btn-secondary" onclick="event.stopPropagation(); copyJobLink(${job.id})">Copy link</button>
        </div>
    `;
}

function getAppOrigin() {
    return getApiBaseUrl().replace(/\/?api\/?$/, '');
}

function goAdmin(e) {
    if (e) e.preventDefault();
    window.location.href = `${getAppOrigin()}/admin`;
}

function copyJobLink(jobId) {
    try {
        let pageBase = `${window.location.origin}${window.location.pathname}`;
        if (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null') {
            pageBase = `${getAppOrigin()}/`;
        }
        const url = new URL(pageBase);
        url.searchParams.set('job', jobId);
        url.hash = '';
        const text = url.toString();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => showToast('Link copied to clipboard', 'success')).catch(() => fallbackCopyText(text));
        } else {
            fallbackCopyText(text);
        }
    } catch {
        showToast(`Share this job ID: ${jobId}`, 'info');
    }
}

function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('Link copied', 'success');
    } catch {
        showToast(text, 'info');
    }
    document.body.removeChild(ta);
}

function getSession() {
    try {
        const raw = localStorage.getItem(USER_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setSession(user) {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(USER_SESSION_KEY);
}

function restoreSession() {
    updateNavbarAuth();
}

function updateNavbarAuth() {
    const user = getSession();
    const btn = document.getElementById('navPrimaryBtn');
    const out = document.getElementById('navLogoutBtn');
    const label = document.getElementById('navUserLabel');
    if (!btn) return;
    if (user && user.email) {
        if (label) {
            label.style.display = 'inline';
            label.textContent = `Hi, ${user.name || user.email}`;
        }
        btn.textContent = 'Admin';
        btn.onclick = goAdmin;
        if (out) out.style.display = 'inline-block';
    } else {
        if (label) label.style.display = 'none';
        btn.textContent = 'Login';
        btn.onclick = showLoginModal;
        if (out) out.style.display = 'none';
    }
}

function logoutUser() {
    clearSession();
    updateNavbarAuth();
    showToast('Logged out.', 'info');
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

// Show signup modal
function showSignupModal() {
    closeModal('loginModal');
    document.getElementById('signupModal').style.display = 'block';
}

function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const p1 = document.getElementById('signupPassword').value;
    const p2 = document.getElementById('signupPassword2').value;
    if (!validateEmail(email)) {
        showToast('Please use a valid email', 'error');
        return;
    }
    if (p1 !== p2) {
        showToast('Passwords do not match', 'error');
        return;
    }
    setSession({ email, name, at: Date.now() });
    showToast('You are signed in.', 'success');
    closeModal('signupModal');
    event.target.reset();
    updateNavbarAuth();
}

function openUtilityModal(title, html) {
    document.getElementById('utilityModalTitle').textContent = title;
    document.getElementById('utilityModalBody').innerHTML = html;
    document.getElementById('utilityModal').style.display = 'block';
}

function openCareerAdvice() {
    openUtilityModal('Career advice', `
        <ul class="utility-list">
            <li><strong>Tailor your resume</strong> — mirror keywords from the job description.</li>
            <li><strong>Quantify impact</strong> — use numbers (revenue, %, users) where you can.</li>
            <li><strong>Prepare stories</strong> — use STAR (Situation, Task, Action, Result) in interviews.</li>
            <li><strong>Follow up</strong> — send a short thank-you note within 24 hours.</li>
        </ul>`);
}

function openResumeBuilder() {
    openUtilityModal('Resume builder (outline)', `
        <p>Copy this skeleton into any editor, or download it as a text file.</p>
        <pre class="resume-pre">YOUR NAME — TITLE
[Email] · [Phone] · [City] · [LinkedIn]

SUMMARY
2–3 lines on your strengths and what you want next.

EXPERIENCE
Company — Role — Dates
• Achievement with metric
• Responsibility / tool stack

EDUCATION & CERTS
School — Degree — Year</pre>
        <button type="button" class="btn btn-primary" onclick="downloadResumeTemplate()">Download as .txt</button>`);
}

function downloadResumeTemplate() {
    const el = document.querySelector('.resume-pre');
    const text = el ? el.textContent : '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'resume-outline.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Download started', 'success');
}

function openPricingModal() {
    openUtilityModal('Employer pricing (demo)', `
        <table class="data-table"><thead><tr><th>Plan</th><th>Price</th><th>Includes</th></tr></thead>
        <tbody>
        <tr><td>Starter</td><td>$99/mo</td><td>3 active jobs, email support</td></tr>
        <tr><td>Growth</td><td>$249/mo</td><td>15 jobs, branded page, analytics</td></tr>
        <tr><td>Enterprise</td><td>Custom</td><td>SSO, API, dedicated CSM</td></tr>
        </tbody></table>
        <p class="muted">This is illustrative only for the demo.</p>`);
}

function openResourcesModal() {
    openUtilityModal('Resources', `
        <ul class="utility-list">
            <li><a href="#jobs" onclick="closeModal('utilityModal'); return true;">Browse open roles</a></li>
            <li><a href="#" onclick="closeModal('utilityModal'); goAdmin(event); return false;">Employer admin</a></li>
            <li><a href="#contact" onclick="closeModal('utilityModal'); return true;">Contact us</a></li>
        </ul>`);
}

function openForgotPassword() {
    openUtilityModal('Forgot password', `
        <p>Email reset is not wired in this demo build.</p>
        <p>Create a new account with <strong>Sign up</strong>, or <a href="#contact" onclick="closeModal('utilityModal')">contact us</a>.</p>`);
}

function openJobAlertsModal() {
    document.getElementById('jobAlertsModal').style.display = 'block';
    refreshAlertsSummary();
}

function saveJobAlert(e) {
    e.preventDefault();
    const email = document.getElementById('alertEmail').value.trim();
    const raw = document.getElementById('alertKeywords').value;
    const keywords = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!keywords.length) {
        showToast('Add at least one keyword', 'error');
        return;
    }
    localStorage.setItem(JOB_ALERTS_KEY, JSON.stringify({ email, keywords, savedAt: Date.now() }));
    showToast('Matching jobs are highlighted with a gold outline.', 'success');
    closeModal('jobAlertsModal');
    renderJobs(applyJobSort(currentJobs).slice(0, displayedJobs));
}

function refreshAlertsSummary() {
    const el = document.getElementById('alertsSummary');
    if (!el) return;
    const raw = localStorage.getItem(JOB_ALERTS_KEY);
    if (!raw) {
        el.textContent = '';
        return;
    }
    try {
        const a = JSON.parse(raw);
        el.textContent = `Saved: ${a.keywords.join(', ')}${a.email ? ` · ${a.email}` : ''}`;
    } catch {
        el.textContent = '';
    }
}

function socialDemo(network) {
    showToast(`${network}: placeholder — add real URLs when you go live.`, 'info');
}

// Show application modal
async function showApplicationModal(jobId) {
    let job = currentJobs.find(j => j.id === jobId);
    if (!job) {
        try {
            const r = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
            if (r.ok) job = await r.json();
        } catch (e) {
            console.error(e);
        }
    }
    if (!job) {
        showToast('Job not found', 'error');
        return;
    }
    document.getElementById('applicationModal').style.display = 'block';
    document.getElementById('applicationModal').dataset.jobId = jobId;
    const el = document.getElementById('applyJobTitle');
    if (el) el.textContent = job.title;
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    if (!validateEmail(email)) {
        showToast('Please enter a valid email', 'error');
        return;
    }
    if (password.length < 4) {
        showToast('Password must be at least 4 characters (demo)', 'error');
        return;
    }
    const name = email.split('@')[0].replace(/[._-]+/g, ' ');
    setSession({ email, name, at: Date.now() });
    showToast('Welcome back!', 'success');
    closeModal('loginModal');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    updateNavbarAuth();
}

// Handle application form submission
async function handleApplication(event) {
    event.preventDefault();
    
    const name = document.getElementById('applicantName').value;
    const email = document.getElementById('applicantEmail').value;
    const phone = document.getElementById('applicantPhone').value;
    const coverLetter = document.getElementById('coverLetter').value;
    const resume = document.getElementById('resume').files[0];
    
    if (name && email && phone && coverLetter && resume) {
        const modal = document.getElementById('applicationModal');
        const jobId = modal.dataset.jobId;
        
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('job_id', jobId);
            formData.append('applicant_name', name);
            formData.append('applicant_email', email);
            formData.append('applicant_phone', phone);
            formData.append('cover_letter', coverLetter);
            formData.append('resume', resume);
            
            // Send to backend API
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                showToast(`Application submitted successfully. Reference #${result.id}`, 'success');
                closeModal('applicationModal');
                
                // Reset form
                document.getElementById('applicantName').value = '';
                document.getElementById('applicantEmail').value = '';
                document.getElementById('applicantPhone').value = '';
                document.getElementById('coverLetter').value = '';
                document.getElementById('resume').value = '';
                
                console.log('Application submitted successfully:', result);
            } else {
                let msg = 'Failed to submit application';
                try {
                    const error = await response.json();
                    msg = error.error || msg;
                } catch (_) { /* ignore */ }
                showToast(msg, 'error');
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error');
            console.error('Network error:', error);
        }
    } else {
        showToast('Please fill in all fields and upload your resume', 'error');
    }
}

// Handle contact form submission
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    if (name && email && message) {
        try {
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
            });
            if (response.ok) {
                showToast('Message sent successfully. We will get back to you soon.', 'success');
                document.getElementById('contactName').value = '';
                document.getElementById('contactEmail').value = '';
                document.getElementById('contactMessage').value = '';
            } else {
                let msg = 'Could not send message';
                try {
                    const err = await response.json();
                    msg = err.error || msg;
                } catch (_) { /* ignore */ }
                showToast(msg, 'error');
            }
        } catch (e) {
            showToast('Network error. Is the backend running on port 5001?', 'error');
        }
    } else {
        showToast('Please fill in all fields', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (!header) return;
    header.classList.toggle('header-scrolled', window.scrollY > 24);
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.job-card, .stat, .about-text, .contact-item');
    animatedElements.forEach(el => observer.observe(el));
});

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Add real-time validation
document.addEventListener('DOMContentLoaded', function() {
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = '#dc3545';
                showToast('Please enter a valid email address', 'error');
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    });
    
    // Phone validation
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validatePhone(this.value)) {
                this.style.borderColor = '#dc3545';
                showToast('Please enter a valid phone number', 'error');
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    });
});

// File upload validation
document.addEventListener('DOMContentLoaded', function() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const maxSize = 15 * 1024 * 1024; // under server 16MB limit
                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                
                if (file.size > maxSize) {
                    showToast('File size must be less than 15MB', 'error');
                    this.value = '';
                } else if (!allowedTypes.includes(file.type)) {
                    showToast('Please upload a PDF or DOC file', 'error');
                    this.value = '';
                } else {
                    showToast(`File "${file.name}" uploaded successfully`, 'success');
                }
            }
        });
    });
});
