// js/script.js
// ============================================
// SCRIPT UTAMA
// SMK TI Bali Global Karangasem
// Sistem Pemilihan Jurusan & Ekstrakurikuler
// ============================================

import { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase-config.js';

// ============================================
// GLOBAL VARIABLES
// ============================================
let currentUser = null;
let selectedEkskul = [];
const MAX_EKSKUL = 3;

// ============================================
// NAVIGATION & UI UTILITIES
// ============================================

// Mobile Navigation Toggle
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            hamburger.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                hamburger.classList.remove('active');
            });
        });
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
    
    // Active link based on current page
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Toast Notification System
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading Spinner
function showLoading(element) {
    element.innerHTML = '<div class="spinner"></div>';
}

function hideLoading(element) {
    element.innerHTML = '';
}

// Format Date
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// INDEX PAGE - STATISTICS
// ============================================
async function loadStatistics() {
    const statContainer = document.querySelector('.stats-container');
    if (!statContainer) return;
    
    try {
        const siswaSnapshot = await getDocs(collection(db, 'pendaftaran'));
        const totalSiswa = siswaSnapshot.size;
        
        // Count jurusan
        const jurusanCount = {};
        siswaSnapshot.forEach(doc => {
            const data = doc.data();
            const jurusan = data.jurusan1;
            jurusanCount[jurusan] = (jurusanCount[jurusan] || 0) + 1;
        });
        
        // Find most popular jurusan
        let popularJurusan = '-';
        let maxCount = 0;
        Object.entries(jurusanCount).forEach(([jurusan, count]) => {
            if (count > maxCount) {
                maxCount = count;
                popularJurusan = jurusan;
            }
        });
        
        // Count ekskul
        const ekskulCount = {};
        siswaSnapshot.forEach(doc => {
            const data = doc.data();
            const ekskulList = data.ekskul || [];
            ekskulList.forEach(ekskul => {
                ekskulCount[ekskul] = (ekskulCount[ekskul] || 0) + 1;
            });
        });
        
        // Find most popular ekskul
        let popularEkskul = '-';
        let maxEkskul = 0;
        Object.entries(ekskulCount).forEach(([ekskul, count]) => {
            if (count > maxEkskul) {
                maxEkskul = count;
                popularEkskul = ekskul;
            }
        });
        
        // Update DOM
        const statElements = document.querySelectorAll('.stat-number');
        if (statElements.length >= 4) {
            statElements[0].textContent = totalSiswa;
            statElements[1].textContent = popularJurusan;
            statElements[2].textContent = popularEkskul;
            statElements[3].textContent = new Date().getFullYear();
        }
        
        // Animate numbers
        animateNumbers();
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        showToast('Gagal memuat statistik', 'error');
    }
}

// Animate Statistics Numbers
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number');
    numbers.forEach(number => {
        const target = parseInt(number.textContent);
        if (!isNaN(target)) {
            const duration = 2000;
            const start = performance.now();
            
            function update(currentTime) {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                const current = Math.floor(progress * target);
                number.textContent = current;
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    number.textContent = target;
                }
            }
            
            requestAnimationFrame(update);
        }
    });
}

// ============================================
// FORM VALIDATION
// ============================================
function validateForm(formData) {
    const errors = [];
    
    // Validasi Nama Lengkap
    if (!formData.nama || formData.nama.trim().length < 3) {
        errors.push('Nama lengkap minimal 3 karakter');
    }
    
    // Validasi NISN
    if (!formData.nisn || !/^\d{10}$/.test(formData.nisn)) {
        errors.push('NISN harus 10 digit angka');
    }
    
    // Validasi Asal Sekolah
    if (!formData.asalSekolah || formData.asalSekolah.trim().length < 3) {
        errors.push('Asal sekolah wajib diisi');
    }
    
    // Validasi WhatsApp
    if (!formData.whatsapp || !/^08\d{8,11}$/.test(formData.whatsapp)) {
        errors.push('Nomor WhatsApp tidak valid (contoh: 08123456789)');
    }
    
    // Validasi Email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Email tidak valid');
    }
    
    // Validasi Jurusan
    if (!formData.jurusan1) {
        errors.push('Pilih jurusan pertama');
    }
    if (!formData.jurusan2) {
        errors.push('Pilih jurusan kedua');
    }
    if (formData.jurusan1 === formData.jurusan2) {
        errors.push('Jurusan pertama dan kedua tidak boleh sama');
    }
    
    // Validasi Alasan
    if (!formData.alasan || formData.alasan.trim().length < 10) {
        errors.push('Alasan memilih jurusan minimal 10 karakter');
    }
    
    return errors;
}

// Show form errors
function showFormErrors(formId, errors) {
    // Clear previous errors
    document.querySelectorAll(`#${formId} .is-invalid`).forEach(el => {
        el.classList.remove('is-invalid');
    });
    
    errors.forEach(error => {
        showToast(error, 'error');
    });
    
    // Highlight specific fields based on error messages
    const fieldMap = {
        'nama': 'nama',
        'nisn': 'nisn',
        'asalSekolah': 'asalSekolah',
        'whatsapp': 'whatsapp',
        'email': 'email',
        'jurusan': 'jurusan1',
        'alasan': 'alasan'
    };
}

// ============================================
// JURUSAN SELECTION PAGE
// ============================================
async function submitJurusanForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    
    // Get form data
    const formData = {
        nama: form.querySelector('#nama').value.trim(),
        nisn: form.querySelector('#nisn').value.trim(),
        asalSekolah: form.querySelector('#asalSekolah').value.trim(),
        whatsapp: form.querySelector('#whatsapp').value.trim(),
        email: form.querySelector('#email').value.trim(),
        jurusan1: form.querySelector('#jurusan1').value,
        jurusan2: form.querySelector('#jurusan2').value,
        alasan: form.querySelector('#alasan').value.trim()
    };
    
    // Validate
    const errors = validateForm(formData);
    if (errors.length > 0) {
        showFormErrors('jurusanForm', errors);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }
    
    try {
        // Check if NISN already registered
        const nisnQuery = query(collection(db, 'pendaftaran'), where('nisn', '==', formData.nisn));
        const nisnSnapshot = await getDocs(nisnQuery);
        
        if (!nisnSnapshot.empty) {
            showToast('NISN sudah terdaftar!', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        // Save to Firestore
        const docRef = await addDoc(collection(db, 'pendaftaran'), {
            ...formData,
            ekskul: [],
            status: 'pending',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        
        showToast('Pendaftaran berhasil! Silakan pilih ekstrakurikuler.', 'success');
        
        // Store registration ID
        localStorage.setItem('pendaftaranId', docRef.id);
        localStorage.setItem('siswaData', JSON.stringify(formData));
        
        // Redirect to ekskul selection
        setTimeout(() => {
            window.location.href = 'pilih-ekskul.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showToast('Gagal menyimpan data. Silakan coba lagi.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Initialize Jurusan Page
function initJurusanPage() {
    const form = document.getElementById('jurusanForm');
    if (!form) return;
    
    form.addEventListener('submit', submitJurusanForm);
    
    // Check if user already registered
    const existingData = localStorage.getItem('siswaData');
    if (existingData) {
        const data = JSON.parse(existingData);
        document.getElementById('nama').value = data.nama || '';
        document.getElementById('nisn').value = data.nisn || '';
        document.getElementById('asalSekolah').value = data.asalSekolah || '';
        document.getElementById('whatsapp').value = data.whatsapp || '';
        document.getElementById('email').value = data.email || '';
    }
}

// ============================================
// EKSKUL SELECTION PAGE
// ============================================
function initEkskulPage() {
    const ekskulCards = document.querySelectorAll('.ekskul-card');
    if (!ekskulCards.length) return;
    
    // Load existing ekskul selection
    const pendaftaranId = localStorage.getItem('pendaftaranId');
    if (pendaftaranId) {
        loadExistingEkskul(pendaftaranId);
    }
    
    // Add click handlers
    ekskulCards.forEach(card => {
        card.addEventListener('click', () => toggleEkskul(card));
    });
    
    // Submit button
    const submitBtn = document.getElementById('submitEkskul');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitEkskulForm);
    }
}

function toggleEkskul(card) {
    const ekskulName = card.dataset.ekskul;
    
    if (card.classList.contains('selected')) {
        // Deselect
        card.classList.remove('selected');
        selectedEkskul = selectedEkskul.filter(e => e !== ekskulName);
    } else {
        // Check limit
        if (selectedEkskul.length >= MAX_EKSKUL) {
            showToast(`Maksimal memilih ${MAX_EKSKUL} ekstrakurikuler`, 'warning');
            return;
        }
        // Select
        card.classList.add('selected');
        selectedEkskul.push(ekskulName);
    }
    
    updateEkskulCounter();
}

function updateEkskulCounter() {
    const counter = document.getElementById('ekskulCounter');
    if (counter) {
        counter.textContent = `${selectedEkskul.length}/${MAX_EKSKUL} Terpilih`;
    }
}

async function loadExistingEkskul(pendaftaranId) {
    try {
        const docRef = doc(db, 'pendaftaran', pendaftaranId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            selectedEkskul = data.ekskul || [];
            
            // Mark selected cards
            document.querySelectorAll('.ekskul-card').forEach(card => {
                if (selectedEkskul.includes(card.dataset.ekskul)) {
                    card.classList.add('selected');
                }
            });
            
            updateEkskulCounter();
        }
    } catch (error) {
        console.error('Error loading ekskul:', error);
    }
}

async function submitEkskulForm() {
    const pendaftaranId = localStorage.getItem('pendaftaranId');
    
    if (!pendaftaranId) {
        showToast('Silakan daftar jurusan terlebih dahulu', 'error');
        setTimeout(() => {
            window.location.href = 'pilih-jurusan.html';
        }, 1500);
        return;
    }
    
    if (selectedEkskul.length === 0) {
        showToast('Pilih minimal 1 ekstrakurikuler', 'warning');
        return;
    }
    
    try {
        const docRef = doc(db, 'pendaftaran', pendaftaranId);
        await updateDoc(docRef, {
            ekskul: selectedEkskul,
            updatedAt: Timestamp.now()
        });
        
        showToast('Ekstrakurikuler berhasil dipilih!', 'success');
        
        // Update local storage
        const siswaData = JSON.parse(localStorage.getItem('siswaData') || '{}');
        siswaData.ekskul = selectedEkskul;
        localStorage.setItem('siswaData', JSON.stringify(siswaData));
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard-siswa.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error saving ekskul:', error);
        showToast('Gagal menyimpan pilihan ekskul', 'error');
    }
}

// ============================================
// DASHBOARD SISWA
// ============================================
async function loadStudentDashboard() {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;
    
    const siswaData = JSON.parse(localStorage.getItem('siswaData') || '{}');
    const pendaftaranId = localStorage.getItem('pendaftaranId');
    
    if (!pendaftaranId || !siswaData.nama) {
        showToast('Data tidak ditemukan. Silakan daftar terlebih dahulu.', 'error');
        setTimeout(() => {
            window.location.href = 'pilih-jurusan.html';
        }, 1500);
        return;
    }
    
    try {
        // Get latest data from Firestore
        const docRef = doc(db, 'pendaftaran', pendaftaranId);
        const docSnap = await getDoc(docRef);
        
        let data = siswaData;
        if (docSnap.exists()) {
            data = docSnap.data();
            // Update local storage
            localStorage.setItem('siswaData', JSON.stringify(data));
        }
        
        // Update dashboard UI
        updateDashboardUI(data, docSnap.exists() ? docSnap.data().createdAt : null);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        updateDashboardUI(siswaData, null);
    }
}

function updateDashboardUI(data, createdAt) {
    // Profile info
    document.getElementById('dashNama').textContent = data.nama || '-';
    document.getElementById('dashNISN').textContent = data.nisn || '-';
    document.getElementById('dashAsalSekolah').textContent = data.asalSekolah || '-';
    document.getElementById('dashWhatsapp').textContent = data.whatsapp || '-';
    document.getElementById('dashEmail').textContent = data.email || '-';
    
    // Jurusan
    document.getElementById('dashJurusan1').textContent = data.jurusan1 || '-';
    document.getElementById('dashJurusan2').textContent = data.jurusan2 || '-';
    
    // Ekskul
    const ekskulList = document.getElementById('dashEkskul');
    if (ekskulList) {
        if (data.ekskul && data.ekskul.length > 0) {
            ekskulList.innerHTML = data.ekskul.map(e => `<li>${e}</li>`).join('');
        } else {
            ekskulList.innerHTML = '<li>Belum memilih ekskul</li>';
        }
    }
    
    // Status
    const statusBadge = document.getElementById('dashStatus');
    if (statusBadge) {
        const status = data.status || 'pending';
        statusBadge.textContent = status === 'verified' ? 'Terverifikasi' : 'Menunggu Verifikasi';
        statusBadge.className = `status-badge status-${status}`;
    }
    
    // Tanggal daftar
    const tglDaftar = document.getElementById('dashTglDaftar');
    if (tglDaftar) {
        tglDaftar.textContent = formatDate(createdAt);
    }
}

// ============================================
// ADMIN DASHBOARD
// ============================================
function initAdminPage() {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            document.getElementById('adminContent').style.display = 'block';
            document.getElementById('loginForm').style.display = 'none';
            loadAdminData();
        } else {
            // User is signed out
            currentUser = null;
            document.getElementById('adminContent').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        }
    });
    
    // Login form handler
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Search and filter
    const searchInput = document.getElementById('searchSiswa');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterSiswa, 300));
    }
    
    const filterJurusan = document.getElementById('filterJurusan');
    if (filterJurusan) {
        filterJurusan.addEventListener('change', filterSiswa);
    }
    
    const filterEkskul = document.getElementById('filterEkskul');
    if (filterEkskul) {
        filterEkskul.addEventListener('change', filterSiswa);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportExcel');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
}

async function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const loginBtn = event.target.querySelector('button[type="submit"]');
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Login...';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login berhasil!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        let message = 'Login gagal!';
        if (error.code === 'auth/user-not-found') {
            message = 'Email tidak terdaftar';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Password salah';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email tidak valid';
        }
        showToast(message, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

async function handleAdminLogout() {
    try {
        await signOut(auth);
        showToast('Logout berhasil', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Gagal logout', 'error');
    }
}

async function loadAdminData() {
    await Promise.all([
        loadAdminStatistics(),
        loadSiswaTable(),
        loadCharts()
    ]);
}

async function loadAdminStatistics() {
    try {
        const snapshot = await getDocs(collection(db, 'pendaftaran'));
        const totalSiswa = snapshot.size;
        
        // Count jurusan
        const jurusanCount = {};
        const ekskulCount = {};
        let verifiedCount = 0;
        let pendingCount = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Count jurusan
            const jurusan = data.jurusan1;
            jurusanCount[jurusan] = (jurusanCount[jurusan] || 0) + 1;
            
            // Count ekskul
            const ekskulList = data.ekskul || [];
            ekskulList.forEach(ekskul => {
                ekskulCount[ekskul] = (ekskulCount[ekskul] || 0) + 1;
            });
            
            // Count status
            if (data.status === 'verified') {
                verifiedCount++;
            } else {
                pendingCount++;
            }
        });
        
        // Find most popular
        let popularJurusan = '-';
        let maxJurusan = 0;
        Object.entries(jurusanCount).forEach(([jurusan, count]) => {
            if (count > maxJurusan) {
                maxJurusan = count;
                popularJurusan = jurusan;
            }
        });
        
        let popularEkskul = '-';
        let maxEkskul = 0;
        Object.entries(ekskulCount).forEach(([ekskul, count]) => {
            if (count > maxEkskul) {
                maxEkskul = count;
                popularEkskul = ekskul;
            }
        });
        
        // Update DOM
        document.getElementById('totalSiswa').textContent = totalSiswa;
        document.getElementById('jurusanFavorit').textContent = popularJurusan;
        document.getElementById('ekskulFavorit').textContent = popularEkskul;
        document.getElementById('verifiedCount').textContent = verifiedCount;
        document.getElementById('pendingCount').textContent = pendingCount;
        
    } catch (error) {
        console.error('Error loading admin statistics:', error);
    }
}

let allSiswaData = [];

async function loadSiswaTable() {
    const tableBody = document.getElementById('siswaTableBody');
    if (!tableBody) return;
    
    showLoading(tableBody);
    
    try {
        const snapshot = await getDocs(query(collection(db, 'pendaftaran'), orderBy('createdAt', 'desc')));
        allSiswaData = [];
        
        snapshot.forEach(doc => {
            allSiswaData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderSiswaTable(allSiswaData);
        
    } catch (error) {
        console.error('Error loading siswa data:', error);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red;">Gagal memuat data</td></tr>';
    }
}

function renderSiswaTable(data) {
    const tableBody = document.getElementById('siswaTableBody');
    if (!tableBody) return;
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Tidak ada data</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(siswa => `
        <tr>
            <td>${siswa.nama || '-'}</td>
            <td>${siswa.nisn || '-'}</td>
            <td>${siswa.asalSekolah || '-'}</td>
            <td>${siswa.jurusan1 || '-'}</td>
            <td>${(siswa.ekskul || []).join(', ') || '-'}</td>
            <td>
                <span class="status-badge status-${siswa.status || 'pending'}">
                    ${siswa.status === 'verified' ? 'Terverifikasi' : 'Pending'}
                </span>
            </td>
            <td>${formatDate(siswa.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editSiswa('${siswa.id}')">
                    ✏️ Edit
                </button>
                <button class="btn btn-sm btn-success" onclick="verifySiswa('${siswa.id}')" ${siswa.status === 'verified' ? 'disabled' : ''}>
                    ✓ Verifikasi
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSiswa('${siswa.id}')">
                    🗑️ Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

function filterSiswa() {
    const searchTerm = document.getElementById('searchSiswa')?.value.toLowerCase() || '';
    const filterJurusan = document.getElementById('filterJurusan')?.value || '';
    const filterEkskul = document.getElementById('filterEkskul')?.value || '';
    
    let filtered = allSiswaData;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(siswa => 
            siswa.nama?.toLowerCase().includes(searchTerm) ||
            siswa.nisn?.includes(searchTerm) ||
            siswa.asalSekolah?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by jurusan
    if (filterJurusan) {
        filtered = filtered.filter(siswa => 
            siswa.jurusan1 === filterJurusan || siswa.jurusan2 === filterJurusan
        );
    }
    
    // Filter by ekskul
    if (filterEkskul) {
        filtered = filtered.filter(siswa => 
            (siswa.ekskul || []).includes(filterEkskul)
        );
    }
    
    renderSiswaTable(filtered);
}

// Make functions globally available for onclick handlers
window.editSiswa = async function(id) {
    const siswa = allSiswaData.find(s => s.id === id);
    if (!siswa) return;
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Data Siswa</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <form id="editSiswaForm">
                <div class="form-group">
                    <label class="form-label">Nama Lengkap</label>
                    <input type="text" class="form-control" id="editNama" value="${siswa.nama || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">NISN</label>
                    <input type="text" class="form-control" id="editNISN" value="${siswa.nisn || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Asal Sekolah</label>
                    <input type="text" class="form-control" id="editAsalSekolah" value="${siswa.asalSekolah || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">WhatsApp</label>
                    <input type="text" class="form-control" id="editWhatsapp" value="${siswa.whatsapp || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="editEmail" value="${siswa.email || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="editStatus">
                        <option value="pending" ${siswa.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="verified" ${siswa.status === 'verified' ? 'selected' : ''}>Verified</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Simpan Perubahan</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    modal.querySelector('#editSiswaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedData = {
            nama: modal.querySelector('#editNama').value,
            nisn: modal.querySelector('#editNISN').value,
            asalSekolah: modal.querySelector('#editAsalSekolah').value,
            whatsapp: modal.querySelector('#editWhatsapp').value,
            email: modal.querySelector('#editEmail').value,
            status: modal.querySelector('#editStatus').value,
            updatedAt: Timestamp.now()
        };
        
        try {
            const docRef = doc(db, 'pendaftaran', id);
            await updateDoc(docRef, updatedData);
            showToast('Data berhasil diperbarui!', 'success');
            modal.remove();
            loadAdminData();
        } catch (error) {
            console.error('Error updating data:', error);
            showToast('Gagal memperbarui data', 'error');
        }
    });
};

window.verifySiswa = async function(id) {
    if (!confirm('Verifikasi pendaftaran siswa ini?')) return;
    
    try {
        const docRef = doc(db, 'pendaftaran', id);
        await updateDoc(docRef, {
            status: 'verified',
            updatedAt: Timestamp.now()
        });
        showToast('Siswa berhasil diverifikasi!', 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error verifying siswa:', error);
        showToast('Gagal verifikasi siswa', 'error');
    }
};

window.deleteSiswa = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan!')) return;
    
    try {
        const docRef = doc(db, 'pendaftaran', id);
        await deleteDoc(docRef);
        showToast('Data berhasil dihapus!', 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error deleting data:', error);
        showToast('Gagal menghapus data', 'error');
    }
};

// Export to Excel
function exportToExcel() {
    if (allSiswaData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    // Create CSV content
    const headers = ['Nama', 'NISN', 'Asal Sekolah', 'WhatsApp', 'Email', 'Jurusan 1', 'Jurusan 2', 'Ekskul', 'Status', 'Tanggal Daftar'];
    const rows = allSiswaData.map(siswa => [
        siswa.nama || '',
        siswa.nisn || '',
        siswa.asalSekolah || '',
        siswa.whatsapp || '',
        siswa.email || '',
        siswa.jurusan1 || '',
        siswa.jurusan2 || '',
        (siswa.ekskul || []).join('; '),
        siswa.status || 'pending',
        formatDate(siswa.createdAt)
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data-siswa-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data berhasil diexport!', 'success');
}

// Charts
function loadCharts() {
    loadJurusanChart();
    loadEkskulChart();
    loadRegistrationChart();
}

function loadJurusanChart() {
    const canvas = document.getElementById('jurusanChart');
    if (!canvas) return;
    
    const jurusanCount = {};
    allSiswaData.forEach(siswa => {
        const jurusan = siswa.jurusan1;
        jurusanCount[jurusan] = (jurusanCount[jurusan] || 0) + 1;
    });
    
    const labels = Object.keys(jurusanCount);
    const data = Object.values(jurusanCount);
    
    // Simple bar chart using canvas
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (labels.length === 0) return;
    
    const barWidth = (width - 100) / labels.length;
    const maxValue = Math.max(...data);
    
    // Draw bars
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (height - 100);
        const x = 50 + index * barWidth;
        const y = height - 50 - barHeight;
        
        // Gradient
        const gradient = ctx.createLinearGradient(x, y, x, height - 50);
        gradient.addColorStop(0, '#00F0FF');
        gradient.addColorStop(1, '#0066FF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 10, y, barWidth - 20, barHeight);
        
        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, height - 20);
        
        // Value
        ctx.fillText(value, x + barWidth / 2, y - 10);
    });
}

function loadEkskulChart() {
    const canvas = document.getElementById('ekskulChart');
    if (!canvas) return;
    
    const ekskulCount = {};
    allSiswaData.forEach(siswa => {
        (siswa.ekskul || []).forEach(ekskul => {
            ekskulCount[ekskul] = (ekskulCount[ekskul] || 0) + 1;
        });
    });
    
    const labels = Object.keys(ekskulCount);
    const data = Object.values(ekskulCount);
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (labels.length === 0) return;
    
    // Draw horizontal bars
    const barHeight = (height - 100) / labels.length;
    const maxValue = Math.max(...data);
    
    data.forEach((value, index) => {
        const barWidth = (value / maxValue) * (width - 200);
        const y = 50 + index * barHeight;
        
        const gradient = ctx.createLinearGradient(0, y, barWidth, y);
        gradient.addColorStop(0, '#0066FF');
        gradient.addColorStop(1, '#00F0FF');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(150, y + 5, barWidth, barHeight - 10);
        
        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px Poppins';
        ctx.textAlign = 'right';
        ctx.fillText(labels[index], 140, y + barHeight / 2 + 4);
        
        // Value
        ctx.textAlign = 'left';
        ctx.fillText(value, 155 + barWidth, y + barHeight / 2 + 4);
    });
}

function loadRegistrationChart() {
    const canvas = document.getElementById('registrationChart');
    if (!canvas) return;
    
    // Group by date
    const dateCount = {};
    allSiswaData.forEach(siswa => {
        if (siswa.createdAt) {
            const date = formatDate(siswa.createdAt).split(',')[0];
            dateCount[date] = (dateCount[date] || 0) + 1;
        }
    });
    
    const dates = Object.keys(dateCount).sort();
    const values = dates.map(date => dateCount[date]);
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (dates.length < 2) {
        ctx.fillStyle = '#8892B0';
        ctx.font = '14px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText('Data belum cukup untuk grafik', width / 2, height / 2);
        return;
    }
    
    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    
    const xStep = (width - 100) / (dates.length - 1);
    const maxValue = Math.max(...values);
    
    values.forEach((value, index) => {
        const x = 50 + index * xStep;
        const y = height - 50 - (value / maxValue) * (height - 100);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw point
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '9px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(dates[index], x, height - 20);
    });
    
    ctx.stroke();
}

// Utility function
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

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    initNavigation();
    
    // Determine current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (currentPage) {
        case 'index.html':
        case '':
            loadStatistics();
            break;
        case 'pilih-jurusan.html':
            initJurusanPage();
            break;
        case 'pilih-ekskul.html':
            initEkskulPage();
            break;
        case 'dashboard-siswa.html':
            loadStudentDashboard();
            break;
        case 'admin.html':
            initAdminPage();
            break;
    }
});

// Export functions for global access
window.showToast = showToast;
