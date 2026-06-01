// js/script.js
// ============================================
// SMK TI Bali Global Karangasem
// Sistem Pendaftaran - TANPA VERIFIKASI
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
    }, 4000);
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
            console.log('Firebase not ready, retrying...');
            setTimeout(loadStatistics, 1000);
            return;
        }
        
        const snapshot = await db.collection('pendaftaran').get();
        
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
        
        let topJurusan = '-', maxJ = 0;
        Object.entries(jurusanCount).forEach(([k, v]) => { if (v > maxJ) { maxJ = v; topJurusan = k; } });
        
        let topEkskul = '-', maxE = 0;
        Object.entries(ekskulCount).forEach(([k, v]) => { if (v > maxE) { maxE = v; topEkskul = k; } });
        
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
        
        // Validasi
        if (!data.nama || data.nama.length < 3) return showToast('❌ Nama lengkap minimal 3 karakter', 'error');
        if (!data.nisn || !/^\d{10}$/.test(data.nisn)) return showToast('❌ NISN harus 10 digit angka', 'error');
        if (!data.asalSekolah) return showToast('❌ Asal sekolah wajib diisi', 'error');
        if (!data.whatsapp || !/^08\d{8,11}$/.test(data.whatsapp)) return showToast('❌ Nomor WhatsApp tidak valid (08xx)', 'error');
        if (!data.email || !data.email.includes('@')) return showToast('❌ Email tidak valid', 'error');
        if (!data.jurusan1 || !data.jurusan2) return showToast('❌ Pilih kedua jurusan', 'error');
        if (data.jurusan1 === data.jurusan2) return showToast('❌ Jurusan tidak boleh sama', 'error');
        if (!data.alasan || data.alasan.length < 10) return showToast('❌ Alasan minimal 10 karakter', 'error');
        
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyimpan...'; }
        
        try {
            // Cek NISN duplicate
            const cek = await db.collection('pendaftaran').where('nisn', '==', data.nisn).get();
            if (!cek.empty) {
                showToast('❌ NISN sudah terdaftar!', 'error');
                if (btn) { btn.disabled = false; btn.textContent = '🚀 Daftar & Lanjut Pilih Ekskul'; }
                return;
            }
            
            // Simpan ke Firestore
            const docRef = await db.collection('pendaftaran').add({
                ...data,
                ekskul: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Simpan ke localStorage
            localStorage.setItem('pendaftaranId', docRef.id);
            localStorage.setItem('siswaData', JSON.stringify({...data, ekskul: []}));
            
            showToast('✅ Pendaftaran berhasil! Silakan pilih ekstrakurikuler.', 'success');
            
            setTimeout(() => {
                window.location.href = 'pilih-ekskul.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Gagal menyimpan: ' + error.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = '🚀 Daftar & Lanjut Pilih Ekskul'; }
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
                    return showToast(`⚠️ Maksimal ${MAX_EKSKUL} ekstrakurikuler`, 'warning');
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
        showToast('❌ Silakan daftar jurusan dulu!', 'error');
        setTimeout(() => window.location.href = 'pilih-jurusan.html', 1000);
        return;
    }
    
    if (selectedEkskul.length === 0) {
        showToast('⚠️ Pilih minimal 1 ekstrakurikuler', 'warning');
        return;
    }
    
    try {
        await db.collection('pendaftaran').doc(id).update({
            ekskul: selectedEkskul,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update localStorage
        const saved = JSON.parse(localStorage.getItem('siswaData') || '{}');
        saved.ekskul = selectedEkskul;
        localStorage.setItem('siswaData', JSON.stringify(saved));
        
        showToast('✅ Pendaftaran selesai! Mengarahkan ke dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard-siswa.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Gagal menyimpan: ' + error.message, 'error');
    }
}

// ============================================
// DASHBOARD SISWA - TANPA VERIFIKASI
// ============================================
async function loadStudentDashboard() {
    console.log('📋 Loading dashboard...');
    
    const id = localStorage.getItem('pendaftaranId');
    const savedData = localStorage.getItem('siswaData');
    
    if (!id || !savedData) {
        showToast('❌ Data tidak ditemukan. Silakan daftar dulu.', 'error');
        setTimeout(() => window.location.href = 'pilih-jurusan.html', 1500);
        return;
    }
    
    const localData = JSON.parse(savedData);
    
    // Tampilkan data dari localStorage dulu (cepat)
    showDashboardData(localData);
    
    // Ambil data terbaru dari Firestore
    try {
        const doc = await db.collection('pendaftaran').doc(id).get();
        
        if (doc.exists) {
            const firestoreData = doc.data();
            
            // Update localStorage
            const updatedData = { ...localData, ...firestoreData };
            localStorage.setItem('siswaData', JSON.stringify(updatedData));
            
            // Tampilkan data terbaru
            showDashboardData(updatedData);
        }
        
    } catch (error) {
        console.error('Error loading from Firestore:', error);
        // Tetap tampilkan data lokal
    }
}

function showDashboardData(data) {
    console.log('🖼️ Menampilkan dashboard...');
    
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    };
    
    // Data Diri
    set('dashNama', data.nama);
    set('dashNISN', data.nisn);
    set('dashAsalSekolah', data.asalSekolah);
    set('dashWhatsapp', data.whatsapp);
    set('dashEmail', data.email);
    
    // Jurusan
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
    
    // STATUS - INFORMASI PENDAFTARAN
    const statusBadge = document.getElementById('dashStatus');
    if (statusBadge) {
        statusBadge.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; margin-bottom: 20px;">
                    🎉 <strong style="color: #00F0FF;">Pendaftaran Berhasil!</strong>
                </div>
                <div style="background: rgba(0,240,255,0.05); 
                            border: 2px solid rgba(0,240,255,0.2); 
                            border-radius: 20px; 
                            padding: 30px 20px; 
                            margin-top: 15px;">
                    <p style="color: #CBD5E1; margin-bottom: 20px; line-height: 1.8; font-size: 1rem;">
                        Terima kasih telah mendaftar di<br>
                        <strong style="color: #00F0FF; font-size: 1.2rem;">
                            SMK TI Bali Global Karangasem
                        </strong>
                    </p>
                    
                    <div style="background: rgba(16, 185, 129, 0.1); 
                                border: 1px solid rgba(16, 185, 129, 0.3); 
                                border-radius: 15px; 
                                padding: 20px; 
                                margin: 20px 0;">
                        <p style="color: #CBD5E1; font-size: 0.95rem; line-height: 1.8;">
                            📱 Kami akan menghubungi anda melalui<br>
                            <strong style="color: #10B981; font-size: 1.1rem;">
                                WhatsApp: ${data.whatsapp || '-'}
                            </strong><br>
                            untuk informasi selanjutnya.
                        </p>
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="color: #8892B0; font-size: 0.9rem; line-height: 1.8;">
                            ⏰ Estimasi respon: <strong style="color: #F59E0B;">1-3 hari kerja</strong><br>
                            📞 Info lebih lanjut: <strong style="color: #00F0FF;">0812-3456-7890</strong><br>
                            📧 Email: <strong style="color: #00F0FF;">info@smktibaliglobal.sch.id</strong>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Tanggal Daftar
    const tglEl = document.getElementById('dashTglDaftar');
    if (tglEl && data.createdAt) {
        let date;
        if (data.createdAt.toDate) {
            date = data.createdAt.toDate();
        } else {
            date = new Date(data.createdAt);
        }
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initialized');
    
    initNavigation();
    
    const page = window.location.pathname.split('/').pop() || 'index.html';
    console.log('📄 Page:', page);
    
    if (page === 'index.html' || page === '') {
        setTimeout(loadStatistics, 1000);
    } else if (page === 'pilih-jurusan.html') {
        initJurusanForm();
    } else if (page === 'pilih-ekskul.html') {
        initEkskulPage();
    } else if (page === 'dashboard-siswa.html') {
        loadStudentDashboard();
    }
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.4); }
        50% { box-shadow: 0 0 0 15px rgba(0, 240, 255, 0); }
    }
`;
document.head.appendChild(style);

console.log('✅ Script loaded successfully');
