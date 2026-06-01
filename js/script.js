// js/script.js
// ============================================
// SCRIPT STABLE - SMK TI Bali Global
// FOKUS: Dashboard real-time update
// ============================================

// Toast Notification
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();
    
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: rgba(10,14,39,0.95); backdrop-filter: blur(10px);
        border-left: 4px solid ${colors[type]}; border-radius: 8px;
        color: white; z-index: 9999; font-family: 'Poppins', sans-serif;
        font-size: 0.9rem; animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 400px;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, 3000);
}

// Navigation
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });
    }
    
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 100);
        }
    });
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// ============================================
// INDEX PAGE - STATISTICS
// ============================================
async function loadStatistics() {
    try {
        if (typeof db === 'undefined') {
            console.log('Firebase not ready');
            return;
        }
        
        const snapshot = await db.collection('pendaftaran').get();
        
        // Hitung statistik
        const total = snapshot.size;
        const jurusanCount = {};
        const ekskulCount = {};
        
        snapshot.forEach(doc => {
            const d = doc.data();
            if (d.jurusan1) jurusanCount[d.jurusan1] = (jurusanCount[d.jurusan1] || 0) + 1;
            if (d.ekskul && Array.isArray(d.ekskul)) {
                d.ekskul.forEach(e => ekskulCount[e] = (ekskulCount[e] || 0) + 1);
            }
        });
        
        // Cari terfavorit
        let topJurusan = '-', maxJ = 0;
        Object.entries(jurusanCount).forEach(([k, v]) => { if (v > maxJ) { maxJ = v; topJurusan = k; } });
        
        let topEkskul = '-', maxE = 0;
        Object.entries(ekskulCount).forEach(([k, v]) => { if (v > maxE) { maxE = v; topEkskul = k; } });
        
        // Update DOM
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('totalPendaftar', total);
        set('jurusanFavorit', topJurusan);
        set('ekskulFavorit', topEkskul);
        
    } catch (error) {
        console.error('Error stats:', error);
    }
}

// ============================================
// FORM JURUSAN
// ============================================
function initJurusanForm() {
    const form = document.getElementById('jurusanForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const getVal = (id) => document.getElementById(id)?.value.trim() || '';
        
        const data = {
            nama: getVal('nama'),
            nisn: getVal('nisn'),
            asalSekolah: getVal('asalSekolah'),
            whatsapp: getVal('whatsapp'),
            email: getVal('email'),
            jurusan1: getVal('jurusan1'),
            jurusan2: getVal('jurusan2'),
            alasan: getVal('alasan')
        };
        
        // Validasi simple
        if (!data.nama || data.nama.length < 3) return showToast('❌ Nama minimal 3 karakter', 'error');
        if (!data.nisn || !/^\d{10}$/.test(data.nisn)) return showToast('❌ NISN harus 10 digit', 'error');
        if (!data.asalSekolah) return showToast('❌ Asal sekolah wajib diisi', 'error');
        if (!data.whatsapp || !/^08\d{8,11}$/.test(data.whatsapp)) return showToast('❌ No WA tidak valid', 'error');
        if (!data.email || !data.email.includes('@')) return showToast('❌ Email tidak valid', 'error');
        if (!data.jurusan1 || !data.jurusan2) return showToast('❌ Pilih kedua jurusan', 'error');
        if (data.jurusan1 === data.jurusan2) return showToast('❌ Jurusan tidak boleh sama', 'error');
        if (!data.alasan || data.alasan.length < 10) return showToast('❌ Alasan minimal 10 karakter', 'error');
        
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }
        
        try {
            // Cek NISN
            const cek = await db.collection('pendaftaran').where('nisn', '==', data.nisn).get();
            if (!cek.empty) {
                showToast('❌ NISN sudah terdaftar!', 'error');
                if (btn) { btn.disabled = false; btn.textContent = '🚀 Daftar & Lanjut'; }
                return;
            }
            
            // Simpan
            const docRef = await db.collection('pendaftaran').add({
                ...data,
                ekskul: [],
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Simpan ke localStorage
            localStorage.setItem('pendaftaranId', docRef.id);
            localStorage.setItem('siswaData', JSON.stringify({...data, ekskul: [], status: 'pending'}));
            
            showToast('✅ Pendaftaran berhasil!', 'success');
            setTimeout(() => window.location.href = 'pilih-ekskul.html', 1000);
            
        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Gagal menyimpan: ' + error.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = '🚀 Daftar & Lanjut'; }
        }
    });
}

// ============================================
// PILIH EKSKUL
// ============================================
let selectedEkskul = [];
const MAX_EKSKUL = 3;

function initEkskulPage() {
    const cards = document.querySelectorAll('.ekskul-card');
    if (!cards.length) return;
    
    // Load existing
    const saved = JSON.parse(localStorage.getItem('siswaData') || '{}');
    if (saved.ekskul && Array.isArray(saved.ekskul)) {
        selectedEkskul = [...saved.ekskul];
    }
    
    cards.forEach(card => {
        const name = card.getAttribute('data-ekskul');
        if (selectedEkskul.includes(name)) card.classList.add('selected');
        
        card.addEventListener('click', function() {
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedEkskul = selectedEkskul.filter(e => e !== name);
            } else {
                if (selectedEkskul.length >= MAX_EKSKUL) {
                    return showToast(`⚠️ Maksimal ${MAX_EKSKUL} ekskul`, 'warning');
                }
                this.classList.add('selected');
                selectedEkskul.push(name);
            }
            updateEkskulCounter();
        });
    });
    
    document.getElementById('submitEkskul')?.addEventListener('click', saveEkskul);
    updateEkskulCounter();
}

function updateEkskulCounter() {
    const counter = document.getElementById('ekskulCounter');
    if (counter) counter.textContent = `${selectedEkskul.length}/${MAX_EKSKUL} Terpilih`;
}

async function saveEkskul() {
    const id = localStorage.getItem('pendaftaranId');
    if (!id) {
        showToast('❌ Daftar jurusan dulu!', 'error');
        return setTimeout(() => window.location.href = 'pilih-jurusan.html', 1000);
    }
    
    if (selectedEkskul.length === 0) return showToast('⚠️ Pilih minimal 1 ekskul', 'warning');
    
    try {
        await db.collection('pendaftaran').doc(id).update({
            ekskul: selectedEkskul,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const saved = JSON.parse(localStorage.getItem('siswaData') || '{}');
        saved.ekskul = selectedEkskul;
        localStorage.setItem('siswaData', JSON.stringify(saved));
        
        showToast('✅ Ekskul tersimpan!', 'success');
        setTimeout(() => window.location.href = 'dashboard-siswa.html', 1000);
        
    } catch (error) {
        showToast('❌ Gagal: ' + error.message, 'error');
    }
}

// ============================================
// DASHBOARD SISWA - VERSI STABLE
// ============================================
async function loadStudentDashboard() {
    console.log('📋 Loading dashboard...');
    
    const id = localStorage.getItem('pendaftaranId');
    
    if (!id) {
        showToast('❌ Silakan daftar dulu', 'error');
        return setTimeout(() => window.location.href = 'pilih-jurusan.html', 1000);
    }
    
    try {
        // AMBIL DATA REAL-TIME DARI FIRESTORE
        const docRef = db.collection('pendaftaran').doc(id);
        
        // Gunakan onSnapshot untuk real-time update
        docRef.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                console.log('✅ Data diterima:', data.status);
                
                // Update localStorage
                const saved = JSON.parse(localStorage.getItem('siswaData') || '{}');
                saved.status = data.status;
                saved.ekskul = data.ekskul || saved.ekskul || [];
                localStorage.setItem('siswaData', JSON.stringify(saved));
                
                // TAMPILKAN DATA
                showDashboardData(data);
                
            } else {
                // Fallback ke localStorage
                const saved = JSON.parse(localStorage.getItem('siswaData') || '{}');
                showDashboardData(saved);
            }
        }, (error) => {
            console.error('❌ Error:', error);
            // Fallback ke localStorage
            const saved = JSON.parse(localStorage.getItem('siswaData') || '{}');
            showDashboardData(saved);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        const saved = JSON.parse(localStorage.getItem('siswaData') || '{}');
        showDashboardData(saved);
    }
}

function showDashboardData(data) {
    console.log('🖼️ Menampilkan data:', data.status);
    
    // Helper
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };
    
    // Data diri
    set('dashNama', data.nama);
    set('dashNISN', data.nisn);
    set('dashAsalSekolah', data.asalSekolah);
    set('dashWhatsapp', data.whatsapp);
    set('dashEmail', data.email);
    set('dashJurusan1', data.jurusan1);
    set('dashJurusan2', data.jurusan2);
    
    // Ekskul
    const ekskulList = document.getElementById('dashEkskul');
    if (ekskulList) {
        if (data.ekskul && data.ekskul.length > 0) {
            ekskulList.innerHTML = data.ekskul.map(e => `<li>✅ ${e}</li>`).join('');
        } else {
            ekskulList.innerHTML = '<li>⚠️ Belum memilih ekskul</li>';
        }
    }
    
    // STATUS - INI YANG PENTING
    const statusBadge = document.getElementById('dashStatus');
    if (statusBadge) {
        if (data.status === 'verified') {
            statusBadge.textContent = '✅ TERVERIFIKASI';
            statusBadge.className = 'status-badge status-verified';
            statusBadge.style.background = '#10B981';
            statusBadge.style.color = 'white';
            statusBadge.style.padding = '10px 20px';
            statusBadge.style.borderRadius = '20px';
            statusBadge.style.fontWeight = 'bold';
        } else {
            statusBadge.textContent = '⏳ MENUNGGU VERIFIKASI';
            statusBadge.className = 'status-badge status-pending';
            statusBadge.style.background = '#F59E0B';
            statusBadge.style.color = 'white';
            statusBadge.style.padding = '10px 20px';
            statusBadge.style.borderRadius = '20px';
            statusBadge.style.fontWeight = 'bold';
        }
    }
    
    // Tanggal
    const tglEl = document.getElementById('dashTglDaftar');
    if (tglEl && data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        tglEl.textContent = date.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    
    const page = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Page:', page);
    
    if (page === 'index.html' || page === '') setTimeout(loadStatistics, 1000);
    else if (page === 'pilih-jurusan.html') initJurusanForm();
    else if (page === 'pilih-ekskul.html') initEkskulPage();
    else if (page === 'dashboard-siswa.html') loadStudentDashboard();
});

// Animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

console.log('✅ Script ready');
