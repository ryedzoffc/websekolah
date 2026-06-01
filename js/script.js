// js/script.js
// ============================================
// SCRIPT UNTUK HALAMAN SISWA
// SMK TI Bali Global Karangasem
// ============================================

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: rgba(10, 14, 39, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-left: 4px solid ${colors[type] || colors.info};
        border-radius: 8px;
        color: white;
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            hamburger.classList.toggle('active');
        });
        
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
    
    // Set active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ============================================
// LOAD STATISTICS (INDEX PAGE)
// ============================================
async function loadStatistics() {
    try {
        console.log('📊 Loading statistics...');
        
        if (typeof db === 'undefined') {
            console.log('⚠️ Firebase belum diinisialisasi');
            setTimeout(loadStatistics, 1000);
            return;
        }
        
        const snapshot = await db.collection('pendaftaran').get();
        const totalSiswa = snapshot.size;
        
        console.log(`✅ Total siswa: ${totalSiswa}`);
        
        // Hitung jurusan
        const jurusanCount = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.jurusan1) {
                jurusanCount[data.jurusan1] = (jurusanCount[data.jurusan1] || 0) + 1;
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
        
        // Hitung ekskul
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
        console.error('❌ Error loading statistics:', error);
    }
}

// ============================================
// FORM JURUSAN
// ============================================
function initJurusanForm() {
    const form = document.getElementById('jurusanForm');
    if (!form) return;
    
    console.log('📝 Jurusan form initialized');
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        console.log('🚀 Form submitted');
        
        const namaEl = document.getElementById('nama');
        const nisnEl = document.getElementById('nisn');
        const asalSekolahEl = document.getElementById('asalSekolah');
        const whatsappEl = document.getElementById('whatsapp');
        const emailEl = document.getElementById('email');
        const jurusan1El = document.getElementById('jurusan1');
        const jurusan2El = document.getElementById('jurusan2');
        const alasanEl = document.getElementById('alasan');
        const submitBtn = form.querySelector('button[type="submit"]');
        
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
        
        console.log('📦 Form data:', formData);
        
        // Validasi
        if (!formData.nama || formData.nama.length < 3) {
            showToast('❌ Nama lengkap minimal 3 karakter', 'error');
            return;
        }
        
        if (!formData.nisn || !/^\d{10}$/.test(formData.nisn)) {
            showToast('❌ NISN harus 10 digit angka', 'error');
            return;
        }
        
        if (!formData.asalSekolah) {
            showToast('❌ Asal sekolah wajib diisi', 'error');
            return;
        }
        
        if (!formData.whatsapp || !/^08\d{8,11}$/.test(formData.whatsapp)) {
            showToast('❌ Nomor WhatsApp tidak valid (contoh: 08123456789)', 'error');
            return;
        }
        
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            showToast('❌ Email tidak valid', 'error');
            return;
        }
        
        if (!formData.jurusan1) {
            showToast('❌ Pilih jurusan pertama', 'error');
            return;
        }
        
        if (!formData.jurusan2) {
            showToast('❌ Pilih jurusan kedua', 'error');
            return;
        }
        
        if (formData.jurusan1 === formData.jurusan2) {
            showToast('❌ Jurusan pertama dan kedua tidak boleh sama', 'error');
            return;
        }
        
        if (!formData.alasan || formData.alasan.length < 10) {
            showToast('❌ Alasan minimal 10 karakter', 'error');
            return;
        }
        
        // Disable button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Menyimpan...';
        }
        
        try {
            if (typeof db === 'undefined') {
                throw new Error('Firebase tidak terhubung. Cek koneksi internet!');
            }
            
            // Cek NISN
            console.log('🔍 Checking NISN...');
            const nisnQuery = await db.collection('pendaftaran')
                .where('nisn', '==', formData.nisn)
                .get();
            
            if (!nisnQuery.empty) {
                showToast('❌ NISN sudah terdaftar!', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🚀 Daftar & Lanjut Pilih Ekskul';
                }
                return;
            }
            
            // Simpan ke Firestore
            console.log('💾 Saving to Firestore...');
            
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
            
            console.log('✅ Data saved! Document ID:', docRef.id);
            
            localStorage.setItem('pendaftaranId', docRef.id);
            localStorage.setItem('siswaData', JSON.stringify(formData));
            
            showToast('✅ Pendaftaran berhasil! Silakan pilih ekstrakurikuler.', 'success');
            
            setTimeout(() => {
                window.location.href = 'pilih-ekskul.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Error saving data:', error);
            
            let errorMessage = 'Gagal menyimpan data';
            
            if (error.code === 'permission-denied') {
                errorMessage = '❌ Izin Firebase ditolak. Pastikan Firestore rules diatur ke allow read, write.';
            } else if (error.message.includes('Firebase tidak terhubung')) {
                errorMessage = '❌ ' + error.message;
            } else {
                errorMessage = '❌ ' + error.message;
            }
            
            showToast(errorMessage, 'error');
            
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Daftar & Lanjut Pilih Ekskul';
            }
        }
    });
}

// ============================================
// PILIH EKSKUL
// ============================================
let selectedEkskul = [];
const MAX_EKSKUL = 3;

function initEkskulPage() {
    const ekskulCards = document.querySelectorAll('.ekskul-card');
    if (!ekskulCards.length) return;
    
    console.log('🎯 Ekskul page initialized');
    
    const savedData = localStorage.getItem('siswaData');
    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.ekskul && Array.isArray(data.ekskul)) {
            selectedEkskul = [...data.ekskul];
            updateSelectedCards();
        }
    }
    
    ekskulCards.forEach(card => {
        card.addEventListener('click', function() {
            const ekskulName = this.getAttribute('data-ekskul');
            toggleEkskul(this, ekskulName);
        });
    });
    
    const submitBtn = document.getElementById('submitEkskul');
    if (submitBtn) {
        submitBtn.addEventListener('click', saveEkskul);
    }
    
    updateCounter();
}

function toggleEkskul(card, ekskulName) {
    if (card.classList.contains('selected')) {
        card.classList.remove('selected');
        selectedEkskul = selectedEkskul.filter(e => e !== ekskulName);
    } else {
        if (selectedEkskul.length >= MAX_EKSKUL) {
            showToast(`⚠️ Maksimal memilih ${MAX_EKSKUL} ekstrakurikuler`, 'warning');
            return;
        }
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
        showToast('❌ Silakan isi form jurusan terlebih dahulu', 'error');
        setTimeout(() => {
            window.location.href = 'pilih-jurusan.html';
        }, 1500);
        return;
    }
    
    if (selectedEkskul.length === 0) {
        showToast('⚠️ Pilih minimal 1 ekstrakurikuler', 'warning');
        return;
    }
    
    try {
        console.log('💾 Saving ekskul...');
        
        await db.collection('pendaftaran').doc(pendaftaranId).update({
            ekskul: selectedEkskul,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const savedData = JSON.parse(localStorage.getItem('siswaData') || '{}');
        savedData.ekskul = selectedEkskul;
        localStorage.setItem('siswaData', JSON.stringify(savedData));
        
        showToast('✅ Ekstrakurikuler berhasil dipilih!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard-siswa.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error saving ekskul:', error);
        showToast('❌ Gagal menyimpan: ' + error.message, 'error');
    }
}

// ============================================
// DASHBOARD SISWA
// ============================================
async function loadStudentDashboard() {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;
    
    console.log('👤 Loading student dashboard...');
    
    const pendaftaranId = localStorage.getItem('pendaftaranId');
    const savedData = localStorage.getItem('siswaData');
    
    if (!pendaftaranId || !savedData) {
        showToast('❌ Data tidak ditemukan. Silakan daftar terlebih dahulu.', 'error');
        setTimeout(() => {
            window.location.href = 'pilih-jurusan.html';
        }, 1500);
        return;
    }
    
    const localData = JSON.parse(savedData);
    
    try {
        const doc = await db.collection('pendaftaran').doc(pendaftaranId).get();
        
        if (doc.exists) {
            const firestoreData = doc.data();
            updateDashboardUI(firestoreData);
        } else {
            updateDashboardUI(localData);
        }
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        updateDashboardUI(localData);
    }
}

function updateDashboardUI(data) {
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
    
    const ekskulList = document.getElementById('dashEkskul');
    if (ekskulList) {
        if (data.ekskul && data.ekskul.length > 0) {
            ekskulList.innerHTML = data.ekskul.map(e => `<li>✅ ${e}</li>`).join('');
        } else {
            ekskulList.innerHTML = '<li>⚠️ Belum memilih ekskul</li>';
        }
    }
    
    const statusBadge = document.getElementById('dashStatus');
    if (statusBadge) {
        const status = data.status || 'pending';
        statusBadge.textContent = status === 'verified' ? '✅ Terverifikasi' : '⏳ Menunggu Verifikasi';
        statusBadge.className = `status-badge status-${status}`;
    }
    
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
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page loaded');
    console.log('📍 URL:', window.location.pathname);
    
    initNavigation();
    
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    console.log('📑 Current page:', page);
    
    switch (page) {
        case 'index.html':
        case '':
            console.log('🏠 Loading index page...');
            setTimeout(loadStatistics, 1000);
            break;
            
        case 'pilih-jurusan.html':
            console.log('📝 Loading jurusan form...');
            initJurusanForm();
            break;
            
        case 'pilih-ekskul.html':
            console.log('🎯 Loading ekskul page...');
            initEkskulPage();
            break;
            
        case 'dashboard-siswa.html':
            console.log('👤 Loading student dashboard...');
            setTimeout(loadStudentDashboard, 1000);
            break;
            
        default:
            console.log('ℹ️ Unknown page:', page);
    }
});

// Add animation style
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(animationStyle);

console.log('✅ Script.js loaded successfully');
