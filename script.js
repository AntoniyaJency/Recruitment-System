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

// API Base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadJobsFromAPI();
    setupEventListeners();
});

// Load jobs from API
async function loadJobsFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (response.ok) {
            const data = await response.json();
            currentJobs = data.jobs;
            renderJobs(currentJobs.slice(0, displayedJobs));
        } else {
            console.error('Failed to load jobs from API');
            // Fallback to mock data
            renderJobs(jobData.slice(0, displayedJobs));
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        // Fallback to mock data
        renderJobs(jobData.slice(0, displayedJobs));
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
}

// Render jobs to the page
function renderJobs(jobs) {
    const jobGrid = document.getElementById('jobGrid');
    
    if (jobs.length === 0) {
        jobGrid.innerHTML = '<div class="no-jobs"><p>No jobs found matching your criteria.</p></div>';
        return;
    }
    
    jobGrid.innerHTML = jobs.map(job => `
        <div class="job-card" onclick="showJobDetails(${job.id})">
            <div class="job-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <p class="company-name">${job.company}</p>
                </div>
                <span class="job-type">${formatJobType(job.type)}</span>
            </div>
            <div class="job-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${job.location}</span>
            </div>
            <p class="job-description">${job.description}</p>
            <div class="job-tags">
                ${job.tags.map(tag => `<span class="job-tag">${tag}</span>`).join('')}
            </div>
            <div class="job-footer">
                <span class="job-salary">${job.salary}</span>
                <button class="apply-btn" onclick="event.stopPropagation(); showApplicationModal(${job.id})">Apply Now</button>
            </div>
        </div>
    `).join('');
}

// Format job type for display
function formatJobType(type) {
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
            currentJobs = data.jobs;
            displayedJobs = 6;
            renderJobs(currentJobs.slice(0, displayedJobs));
            
            // Hide load more button if all jobs are displayed
            const loadMoreBtn = document.querySelector('.load-more-container');
            if (currentJobs.length <= displayedJobs) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
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
    renderJobs(currentJobs.slice(0, displayedJobs));
    
    if (currentJobs.length <= displayedJobs) {
        document.querySelector('.load-more-container').style.display = 'none';
    }
}

// Show job details
function showJobDetails(jobId) {
    const job = jobData.find(j => j.id === jobId);
    if (job) {
        showToast(`Viewing details for ${job.title} at ${job.company}`, 'success');
        // In a real application, this would navigate to a job details page
    }
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

// Show signup modal
function showSignupModal() {
    closeModal('loginModal');
    showToast('Signup functionality coming soon!', 'info');
}

// Show application modal
function showApplicationModal(jobId) {
    const job = jobData.find(j => j.id === jobId);
    if (job) {
        document.getElementById('applicationModal').style.display = 'block';
        // Store job ID for form submission
        document.getElementById('applicationModal').dataset.jobId = jobId;
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simulate login process
    if (email && password) {
        showToast('Login successful! Welcome back.', 'success');
        closeModal('loginModal');
        
        // Reset form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
        // Update UI to show logged in state
        updateLoginState(true);
    } else {
        showToast('Please fill in all fields', 'error');
    }
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
                showToast(`Application submitted successfully! Application ID: ${result.id}`, 'success');
                closeModal('applicationModal');
                
                // Reset form
                document.getElementById('applicantName').value = '';
                document.getElementById('applicantEmail').value = '';
                document.getElementById('applicantPhone').value = '';
                document.getElementById('coverLetter').value = '';
                document.getElementById('resume').value = '';
                
                console.log('Application submitted successfully:', result);
            } else {
                const error = await response.json();
                showToast(`Error: ${error.error || 'Failed to submit application'}`, 'error');
                console.error('Application submission failed:', error);
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
function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    if (name && email && message) {
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
        
        // Reset form
        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';
        
        // In a real application, this would send data to a server
        console.log('Contact form submitted:', { name, email, message });
    } else {
        showToast('Please fill in all fields', 'error');
    }
}

// Update login state in UI
function updateLoginState(isLoggedIn) {
    const loginBtn = document.querySelector('.navbar .btn-primary');
    
    if (isLoggedIn) {
        loginBtn.textContent = 'Dashboard';
        loginBtn.onclick = function() {
            showToast('Dashboard feature coming soon!', 'info');
        };
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.onclick = showLoginModal;
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
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#fff';
        header.style.backdropFilter = 'none';
    }
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
                const maxSize = 5 * 1024 * 1024; // 5MB
                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                
                if (file.size > maxSize) {
                    showToast('File size must be less than 5MB', 'error');
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
