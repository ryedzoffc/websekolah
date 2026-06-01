// js/script.js
// ============================================
// SCRIPT UTAMA - VERSI PERBAIKAN
// SMK TI Bali Global Karangasem
// ============================================

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar && window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    });
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
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

// ============================================
// LOAD STATISTICS (INDEX PAGE)
// ============================================
async function loadStatistics() {
    try {
        console.log('Loading statistics...');
        const snapshot = await db.collection('pendaftaran').get();
        const totalSiswa = snapshot.size;
        
        console.log('Total siswa:', totalSiswa);
        
        // Count jurusan
        const jurusanCount = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.jurusan1) {
                jurusanCount[data.jurusan1] = (jurusanCount[data.jurusan1] || 0) + 1;
            }
        });
        
        // Find most popular
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
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.ekskul && Array.isArray(data.ekskul)) {
                data.ekskul.forEach(ekskul => {
                    ekskulCount[ekskul] = (ekskulCount[ekskul] || 0) + 1;
                });
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
        const totalEl = document.getElementById('totalPendaftar');
        const jurusanEl = document.getElementById('jurusanFavorit');
        const ekskulEl = document.getElementById('ekskulFavorit');
        
        if (totalEl) totalEl.textContent = totalSiswa;
        if (jurusanEl) jurusanEl.textContent = popularJurusan;
        if (ekskulEl) ekskulEl.textContent = popularEkskul;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// ============================================
// JURUSAN FORM SUBMISSION
// ============================================
function initJurusanForm() {
    const form = document.getElementById('jurusanForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        console.log('Form submitted');
        
        // Get form elements
        const namaEl = document.getElementById('nama');
        const nisnEl = document.getElementById('nisn');
        const asalSekolahEl = document.getElementById('asalSekolah');
        const whatsappEl = document.getElementById('whatsapp');
        const emailEl = document.getElementById('email');
        const jurusan1El = document.getElementById('jurusan1');
        const jurusan2El = document.getElementById('jurusan2');
        const alasanEl = document.getElementById('alasan');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Get values
        const formData = {
            nama: namaEl ? namaEl.value.trim() : '',
            nisn: nisnEl ? nisnEl.value.trim() : '',
            asalSekolah: asalSekolahEl ? asalSekolahEl.value.trim() : '',
            whatsapp: whatsappEl ? whatsappEl.value.trim() : '',
            email: emailEl ? emailEl.value.trim() : '',
            jurusan1: jurusan1El ? jurusan1El.value : '',
            jurusan2: jurusan2El ? jurusan2El.value : '',
            alasan: alasanEl ? alasanEl.value.trim() : ''
        };
        
        console.log('Form data:', formData);
        
        // Validation
        if (!formData.nama || formData.nama.length < 3) {
            showToast('Nama lengkap minimal 3 karakter', 'error');
            return;
        }
        
        if (!formData.nisn || !/^\d{10}$/.test(formData.nisn)) {
            showToast('NISN harus 10 digit angka', 'error');
            return;
        }
        
        if (!formData.asalSekolah) {
            showToast('Asal sekolah wajib diisi', 'error');
            return;
        }
        
        if (!formData.whatsapp || !/^08\d{8,11}$/.test(formData.whatsapp)) {
            showToast('Nomor WhatsApp tidak valid (contoh: 08123456789)', 'error');
            return;
        }
        
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            showToast('Email tidak valid', 'error');
            return;
        }
        
        if (!formData.jurusan1) {
            showToast('Pilih jurusan pertama', 'error');
            return;
        }
        
        if (!formData.jurusan2) {
            showToast('Pilih jurusan kedua', 'error');
            return;
        }
        
        if (formData.jurusan1 === formData.jurusan2) {
            showToast('Jurusan pertama dan kedua tidak boleh sama', 'error');
            return;
        }
        
        if (!formData.alasan || formData.alasan.length < 10) {
            showToast('Alasan minimal 10 karakter', 'error');
            return;
        }
        
        // Disable button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Menyimpan...';
        }
        
        try {
            // Check if NISN already exists
            console.log('Checking NISN...');
            const nisnQuery = await db.collection('pendaftaran')
                .where('nisn', '==', formData.nisn)
                .get();
            
            if (!nisnQuery.empty) {
                showToast('NISN sudah terdaftar!', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Daftar & Lanjut Pilih Ekskul';
                }
                return;
            }
            
            // Save to Firestore
            console.log('Saving to Firestore...');
            const docRef = await db.collection('pendaftaran').add({
                nama: formData.nama,
                nisn: formData.nisn,
                asalSekolah: formData.asalSekolah,
                whatsapp: formData.whatsapp,
                email: formData.email,
                jurusan1: formData.jurusan1,
                jurusan2: formData.jurusan2,
                alasan: formData.alasan,
                ekskul: [],
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Data saved with ID:', docRef.id);
            
            // Save to localStorage
            localStorage.setItem('pendaftaranId', docRef.id);
            localStorage.setItem('siswaData', JSON.stringify(formData));
            
            showToast('✅ Pendaftaran berhasil! Silakan pilih ekstrakurikuler.', 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'pilih-ekskul.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error saving data:', error);
            showToast('❌ Gagal menyimpan data: ' + error.message, 'error');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Daftar & Lanjut Pilih Ekskul';
            }
        }
    });
}

// ============================================
// EKSKUL SELECTION
// ============================================
let selectedEkskul = [];
const MAX_EKSKUL = 3;

function initEkskulPage() {
    const ekskulCards = document.querySelectorAll('.ekskul-card');
    if (!ekskulCards.length) return;
    
    console.log('Ekskul page initialized');
    
    // Load existing data if any
    const savedData = localStorage.getItem('siswaData');
    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.ekskul && Array.isArray(data.ekskul)) {
            selectedEkskul = [...data.ekskul];
            updateSelectedCards();
        }
    }
    
    // Add click handlers
    ekskulCards.forEach(card => {
        card.addEventListener('click', function() {
            const ekskulName = this.getAttribute('data-ekskul');
            toggleEkskul(this, ekskulName);
        });
    });
    
    // Submit button
    const submitBtn = document.getElementById('submitEkskul');
    if (submitBtn) {
        submitBtn.addEventListener('click', saveEkskul);
    }
    
    updateCounter();
}

function toggleEkskul(card, ekskulName) {
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
    
    updateCounter();
}

function updateSelectedCards() {
    document.querySelectorAll('.ekskul-card').forEach(card => {
        const ekskulName = card.getAttribute('data-ekskul');
        if (selectedEkskul.includes(ekskulName)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function updateCounter() {
    const counter = document.getElementById('ekskulCounter');
    if (counter) {
        counter.textContent = `${selectedEkskul.length}/${MAX_EKSKUL} Terpilih`;
    }
}

async function saveEkskul() {
    const pendaftaranId = localStorage.getItem('pendaftaranId');
    
    if (!pendaftaranId) {
        showToast('Silakan isi form jurusan terlebih dahulu', 'error');
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
        console.log('Saving ekskul...');
        
        // Update Firestore
        await db.collection('pendaftaran').doc(pendaftaranId).update({
            ekskul: selectedEkskul,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update localStorage
        const savedData = JSON.parse(localStorage.getItem('siswaData') || '{}');
        savedData.ekskul = selectedEkskul;
        localStorage.setItem('siswaData', JSON.stringify(savedData));
        
        showToast('✅ Ekstrakurikuler berhasil dipilih!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard-siswa.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error saving ekskul:', error);
        showToast('❌ Gagal menyimpan: ' + error.message, 'error');
    }
}

// ============================================
// DASHBOARD SISWA
// ============================================
async function loadStudentDashboard() {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;
    
    const pendaftaranId = localStorage.getItem('pendaftaranId');
    const savedData = localStorage.getItem('siswaData');
    
    if (!pendaftaranId || !savedData) {
        showToast('Data tidak ditemukan. Silakan daftar terlebih dahulu.', 'error');
        setTimeout(() => {
            window.location.href = 'pilih-jurusan.html';
        }, 1500);
        return;
    }
    
    const localData = JSON.parse(savedData);
    
    try {
        // Get fresh data from Firestore
        const doc = await db.collection('pendaftaran').doc(pendaftaranId).get();
        
        if (doc.exists) {
            const firestoreData = doc.data();
            updateDashboardUI(firestoreData);
        } else {
            // Use local data
            updateDashboardUI(localData);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        updateDashboardUI(localData);
    }
}

function updateDashboardUI(data) {
    // Helper function to safely set text content
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
    };
    
    setText('dashNama', data.nama);
    setText('dashNISN', data.nisn);
    setText('dashAsalSekolah', data.asalSekolah);
    setText('dashWhatsapp', data.whatsapp);
    setText('dashEmail', data.email);
    setText('dashJurusan1', data.jurusan1);
    setText('dashJurusan2', data.jurusan2);
    
    // Ekskul list
    const ekskulList = document.getElementById('dashEkskul');
    if (ekskulList) {
        if (data.ekskul && data.ekskul.length > 0) {
            ekskulList.innerHTML = data.ekskul.map(e => `<li>✅ ${e}</li>`).join('');
        } else {
            ekskulList.innerHTML = '<li>⚠️ Belum memilih ekskul</li>';
        }
    }
    
    // Status
    const statusBadge = document.getElementById('dashStatus');
    if (statusBadge) {
        const status = data.status || 'pending';
        statusBadge.textContent = status === 'verified' ? '✅ Terverifikasi' : '⏳ Menunggu Verifikasi';
        statusBadge.className = `status-badge status-${status}`;
    }
    
    // Tanggal
    const tglEl = document.getElementById('dashTglDaftar');
    if (tglEl && data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        tglEl.textContent = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ============================================
// ADMIN PAGE
// ============================================
function initAdminPage() {
    // Check auth state
    auth.onAuthStateChanged((user) => {
        const loginForm = document.getElementById('loginForm');
        const adminContent = document.getElementById('adminContent');
        
        if (user) {
            console.log('Admin logged in:', user.email);
            if (loginForm) loginForm.style.display = 'none';
            if (adminContent) adminContent.style.display = 'block';
            loadAdminData();
        } else {
            console.log('No admin logged in');
            if (loginForm) loginForm.style.display = 'flex';
            if (adminContent) adminContent.style.display = 'none';
        }
    });
    
    // Login form handler
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Login...';
            }
            
            try {
                await auth.signInWithEmailAndPassword(email, password);
                showToast('Login berhasil!', 'success');
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login gagal: ' + error.message, 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.signOut();
                showToast('Logout berhasil', 'success');
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
    
    // Search and filters
    const searchInput = document.getElementById('searchSiswa');
    if (searchInput) {
        searchInput.addEventListener('input', filterSiswa);
    }
    
    const filterJurusan = document.getElementById('filterJurusan');
    if (filterJurusan) {
        filterJurusan.addEventListener('change', filterSiswa);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportExcel');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
}

let allSiswaData = [];

async function loadAdminData() {
    try {
        console.log('Loading admin data...');
        const snapshot = await db.collection('pendaftaran')
            .orderBy('createdAt', 'desc')
            .get();
        
        allSiswaData = [];
        snapshot.forEach(doc => {
            allSiswaData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Data loaded:', allSiswaData.length, 'records');
        
        updateAdminStats();
        renderSiswaTable(allSiswaData);
        loadCharts();
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Gagal memuat data admin', 'error');
    }
}

function updateAdminStats() {
    const totalSiswa = allSiswaData.length;
    
    // Count jurusan
    const jurusanCount = {};
    allSiswaData.forEach(siswa => {
        if (siswa.jurusan1) {
            jurusanCount[siswa.jurusan1] = (jurusanCount[siswa.jurusan1] || 0) + 1;
        }
    });
    
    let popularJurusan = '-';
    let maxCount = 0;
    Object.entries(jurusanCount).forEach(([jurusan, count]) => {
        if (count > maxCount) {
            maxCount = count;
            popularJurusan = jurusan;
        }
    });
    
    // Count status
    let verified = 0;
    let pending = 0;
    allSiswaData.forEach(siswa => {
        if (siswa.status === 'verified') verified++;
        else pending++;
    });
    
    // Update DOM
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    setText('totalSiswa', totalSiswa);
    setText('jurusanFavorit', popularJurusan);
    setText('verifiedCount', verified);
    setText('pendingCount', pending);
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
                    ${siswa.status === 'verified' ? '✅ Verified' : '⏳ Pending'}
                </span>
            </td>
            <td>${siswa.createdAt ? new Date(siswa.createdAt.toDate()).toLocaleDateString('id-ID') : '-'}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="verifySiswa('${siswa.id}')">✓</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSiswa('${siswa.id}')">🗑</button>
            </td>
        </tr>
    `).join('');
}

function filterSiswa() {
    const searchTerm = document.getElementById('searchSiswa')?.value.toLowerCase() || '';
    const filterJurusan = document.getElementById('filterJurusan')?.value || '';
    
    let filtered = allSiswaData;
    
    if (searchTerm) {
        filtered = filtered.filter(s => 
            (s.nama && s.nama.toLowerCase().includes(searchTerm)) ||
            (s.nisn && s.nisn.includes(searchTerm)) ||
            (s.asalSekolah && s.asalSekolah.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filterJurusan) {
        filtered = filtered.filter(s => 
            s.jurusan1 === filterJurusan || s.jurusan2 === filterJurusan
        );
    }
    
    renderSiswaTable(filtered);
}

// Global functions for table actions
window.verifySiswa = async function(id) {
    if (!confirm('Verifikasi siswa ini?')) return;
    
    try {
        await db.collection('pendaftaran').doc(id).update({
            status: 'verified',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Siswa diverifikasi!', 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error:', error);
        showToast('Gagal verifikasi', 'error');
    }
};

window.deleteSiswa = async function(id) {
    if (!confirm('Hapus data ini? Tindakan ini tidak dapat dibatalkan!')) return;
    
    try {
        await db.collection('pendaftaran').doc(id).delete();
        showToast('Data dihapus!', 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error:', error);
        showToast('Gagal menghapus', 'error');
    }
};

function exportToExcel() {
    if (allSiswaData.length === 0) {
        showToast('Tidak ada data', 'warning');
        return;
    }
    
    let csv = 'Nama,NISN,Asal Sekolah,WhatsApp,Email,Jurusan 1,Jurusan 2,Ekskul,Status\n';
    
    allSiswaData.forEach(s => {
        csv += `"${s.nama || ''}","${s.nisn || ''}","${s.asalSekolah || ''}","${s.whatsapp || ''}","${s.email || ''}","${s.jurusan1 || ''}","${s.jurusan2 || ''}","${(s.ekskul || []).join('; ')}","${s.status || 'pending'}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-siswa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('Data diexport!', 'success');
}

// Simple charts
function loadCharts() {
    // Will be implemented with canvas
    console.log('Charts loaded');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    
    // Initialize navigation
    initNavigation();
    
    // Get current page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    console.log('Current page:', page);
    
    // Initialize based on page
    if (page === 'index.html' || page === '') {
        loadStatistics();
    } else if (page === 'pilih-jurusan.html') {
        initJurusanForm();
    } else if (page === 'pilih-ekskul.html') {
        initEkskulPage();
    } else if (page === 'dashboard-siswa.html') {
        loadStudentDashboard();
    } else if (page === 'admin.html') {
        initAdminPage();
    }
});
