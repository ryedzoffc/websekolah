// ============================================
// DASHBOARD SISWA (VERSI PERBAIKAN)
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
    
    // Tampilkan loading dulu
    const statusBadge = document.getElementById('dashStatus');
    if (statusBadge) {
        statusBadge.textContent = '⏳ Memuat status...';
        statusBadge.className = 'status-badge status-pending';
    }
    
    try {
        console.log('📡 Mengambil data terbaru dari Firestore...');
        
        // AMBIL DATA TERBARU DARI FIRESTORE (REAL-TIME)
        const docRef = db.collection('pendaftaran').doc(pendaftaranId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const firestoreData = doc.data();
            console.log('✅ Data dari Firestore:', firestoreData);
            console.log('📋 Status:', firestoreData.status);
            
            // Update localStorage dengan data terbaru
            const updatedData = {
                ...JSON.parse(savedData),
                ...firestoreData,
                status: firestoreData.status || 'pending'
            };
            localStorage.setItem('siswaData', JSON.stringify(updatedData));
            
            // Tampilkan data
            updateDashboardUI(firestoreData);
            
        } else {
            console.log('⚠️ Data tidak ditemukan di Firestore, menggunakan data lokal');
            const localData = JSON.parse(savedData);
            updateDashboardUI(localData);
        }
        
        // SETUP REAL-TIME LISTENER untuk auto-update status
        setupRealtimeListener(pendaftaranId);
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        const localData = JSON.parse(savedData);
        updateDashboardUI(localData);
    }
}

// ============================================
// REAL-TIME LISTENER (Auto-update status)
// ============================================
function setupRealtimeListener(pendaftaranId) {
    console.log('👂 Mendengarkan perubahan status real-time...');
    
    db.collection('pendaftaran').doc(pendaftaranId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                console.log('🔄 Status updated:', data.status);
                
                // Update localStorage
                const savedData = JSON.parse(localStorage.getItem('siswaData') || '{}');
                savedData.status = data.status;
                localStorage.setItem('siswaData', JSON.stringify(savedData));
                
                // Update tampilan status
                const statusBadge = document.getElementById('dashStatus');
                if (statusBadge) {
                    if (data.status === 'verified') {
                        statusBadge.textContent = '✅ Terverifikasi';
                        statusBadge.className = 'status-badge status-verified';
                        showToast('🎉 Selamat! Pendaftaran kamu sudah diverifikasi!', 'success');
                    } else {
                        statusBadge.textContent = '⏳ Menunggu Verifikasi';
                        statusBadge.className = 'status-badge status-pending';
                    }
                }
                
                // Update semua data
                updateDashboardUI(data);
            }
        }, (error) => {
            console.error('❌ Error real-time listener:', error);
        });
}

// ============================================
// UPDATE DASHBOARD UI (DIPERBAIKI)
// ============================================
function updateDashboardUI(data) {
    console.log('🖼️ Updating dashboard UI...');
    console.log('📋 Data:', data);
    
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
    };
    
    // Data Diri
    setText('dashNama', data.nama);
    setText('dashNISN', data.nisn);
    setText('dashAsalSekolah', data.asalSekolah);
    setText('dashWhatsapp', data.whatsapp);
    setText('dashEmail', data.email);
    
    // Jurusan
    setText('dashJurusan1', data.jurusan1);
    setText('dashJurusan2', data.jurusan2);
    
    // Ekskul
    const ekskulList = document.getElementById('dashEkskul');
    if (ekskulList) {
        if (data.ekskul && Array.isArray(data.ekskul) && data.ekskul.length > 0) {
            ekskulList.innerHTML = data.ekskul.map(e => `<li>✅ ${e}</li>`).join('');
        } else {
            ekskulList.innerHTML = '<li>⚠️ Belum memilih ekskul</li>';
        }
    }
    
    // STATUS - DIPERBAIKI
    const statusBadge = document.getElementById('dashStatus');
    if (statusBadge) {
        const status = data.status || 'pending';
        console.log('🔄 Setting status to:', status);
        
        if (status === 'verified') {
            statusBadge.textContent = '✅ Terverifikasi';
            statusBadge.className = 'status-badge status-verified';
            statusBadge.style.cssText = `
                display: inline-block;
                padding: 12px 24px;
                background: rgba(16, 185, 129, 0.2);
                color: #10B981;
                border: 2px solid #10B981;
                border-radius: 25px;
                font-size: 1.1rem;
                font-weight: 600;
                animation: pulse 2s infinite;
            `;
        } else {
            statusBadge.textContent = '⏳ Menunggu Verifikasi';
            statusBadge.className = 'status-badge status-pending';
            statusBadge.style.cssText = `
                display: inline-block;
                padding: 12px 24px;
                background: rgba(245, 158, 11, 0.2);
                color: #F59E0B;
                border: 2px solid #F59E0B;
                border-radius: 25px;
                font-size: 1.1rem;
                font-weight: 600;
            `;
        }
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
// ANIMATION STYLE
// ============================================
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
    
    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
    }
    
    .status-verified {
        background: rgba(16, 185, 129, 0.2) !important;
        color: #10B981 !important;
        border: 2px solid #10B981 !important;
        animation: pulse 2s infinite;
    }
    
    .status-pending {
        background: rgba(245, 158, 11, 0.2) !important;
        color: #F59E0B !important;
        border: 2px solid #F59E0B !important;
    }
`;
document.head.appendChild(animationStyle);

console.log('✅ Script.js loaded successfully');
