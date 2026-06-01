    <!-- ============================================ -->
    <!-- SCRIPTS -->
    <!-- ============================================ -->
    <script>
        // ============================================
        // FIREBASE CONFIGURATION
        // ============================================
        const firebaseConfig = {
            apiKey: "AIzaSyBMdBOguRVd02u79idp4xAoTfjDy-h28EQ",
            authDomain: "osisedimahendra.firebaseapp.com",
            projectId: "osisedimahendra",
            storageBucket: "osisedimahendra.firebasestorage.app",
            messagingSenderId: "382159139986",
            appId: "1:382159139986:web:f33b3470b1136ccf50a24b"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        console.log('✅ Firebase Admin initialized');

        // ============================================
        // GLOBAL VARIABLES
        // ============================================
        const ADMIN_PASSWORD = 'admin123';
        let allData = [];
        let isLoggedIn = false;

        // ============================================
        // AUTHENTICATION
        // ============================================
        function handleLogin(event) {
            event.preventDefault();
            
            const password = document.getElementById('adminPassword').value;
            
            if (password === ADMIN_PASSWORD) {
                isLoggedIn = true;
                sessionStorage.setItem('adminLoggedIn', 'true');
                
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                
                showToast('✅ Login berhasil! Selamat datang Admin.', 'success');
                loadAllData();
            } else {
                showToast('❌ Password salah! Silakan coba lagi.', 'error');
            }
        }

        function handleLogout() {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                isLoggedIn = false;
                sessionStorage.removeItem('adminLoggedIn');
                
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('adminDashboard').style.display = 'none';
                document.getElementById('adminPassword').value = '';
                
                showToast('👋 Logout berhasil!', 'info');
            }
        }

        // Check session on load
        function checkSession() {
            if (sessionStorage.getItem('adminLoggedIn') === 'true') {
                isLoggedIn = true;
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                loadAllData();
            }
        }

        // ============================================
        // SECTION NAVIGATION
        // ============================================
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionName).classList.add('active');
            
            // Update active menu
            document.querySelectorAll('.sidebar-menu a').forEach(link => {
                link.classList.remove('active');
            });
            
            // Set active on clicked link
            const links = document.querySelectorAll('.sidebar-menu a');
            const sectionMap = {
                'dashboard': 0,
                'dataSiswa': 1,
                'statistik': 2
            };
            
            if (sectionMap[sectionName] !== undefined) {
                links[sectionMap[sectionName]].classList.add('active');
            }
            
            // Redraw charts when switching to statistik
            if (sectionName === 'statistik') {
                setTimeout(() => {
                    drawJurusanChart('jurusanDetailChart');
                    drawEkskulChart('ekskulDetailChart');
                    drawTrendChart('trendDetailChart');
                }, 200);
            }
        }

        // ============================================
        // LOAD DATA
        // ============================================
        async function loadAllData() {
            try {
                console.log('📥 Loading data...');
                
                // Show loading
                document.getElementById('totalSiswa').textContent = '...';
                document.getElementById('jurusanFavorit').textContent = '...';
                document.getElementById('ekskulFavorit').textContent = '...';
                document.getElementById('verifiedCount').textContent = '...';
                document.getElementById('pendingCount').textContent = '...';
                
                const snapshot = await db.collection('pendaftaran')
                    .orderBy('createdAt', 'desc')
                    .get();
                
                allData = [];
                snapshot.forEach((doc) => {
                    allData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                console.log(`✅ Loaded ${allData.length} records`);
                
                updateDashboardStats();
                renderTable(allData);
                drawAllCharts();
                
            } catch (error) {
                console.error('❌ Error:', error);
                showToast('❌ Gagal memuat data: ' + error.message, 'error');
                
                // Set default values on error
                document.getElementById('totalSiswa').textContent = '0';
                document.getElementById('jurusanFavorit').textContent = '-';
                document.getElementById('ekskulFavorit').textContent = '-';
                document.getElementById('verifiedCount').textContent = '0';
                document.getElementById('pendingCount').textContent = '0';
            }
        }

        // ============================================
        // UPDATE STATS
        // ============================================
        function updateDashboardStats() {
            const total = allData.length;
            
            // Count jurusan
            const jurusanCount = {};
            const ekskulCount = {};
            let verified = 0;
            let pending = 0;
            
            allData.forEach((item) => {
                if (item.jurusan1) {
                    jurusanCount[item.jurusan1] = (jurusanCount[item.jurusan1] || 0) + 1;
                }
                
                if (item.ekskul && Array.isArray(item.ekskul)) {
                    item.ekskul.forEach((e) => {
                        ekskulCount[e] = (ekskulCount[e] || 0) + 1;
                    });
                }
                
                if (item.status === 'verified') verified++;
                else pending++;
            });
            
            // Find most popular
            let topJurusan = '-';
            let maxJurusan = 0;
            Object.entries(jurusanCount).forEach(([key, val]) => {
                if (val > maxJurusan) {
                    maxJurusan = val;
                    topJurusan = key;
                }
            });
            
            let topEkskul = '-';
            let maxEkskul = 0;
            Object.entries(ekskulCount).forEach(([key, val]) => {
                if (val > maxEkskul) {
                    maxEkskul = val;
                    topEkskul = key;
                }
            });
            
            // Update DOM
            document.getElementById('totalSiswa').textContent = total;
            document.getElementById('jurusanFavorit').textContent = topJurusan;
            document.getElementById('ekskulFavorit').textContent = topEkskul;
            document.getElementById('verifiedCount').textContent = verified;
            document.getElementById('pendingCount').textContent = pending;
        }

        // ============================================
        // RENDER TABLE
        // ============================================
        function renderTable(data) {
            const tbody = document.getElementById('tableBody');
            
            if (!tbody) {
                console.error('❌ tableBody not found');
                return;
            }
            
            if (data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="11" style="text-align: center; padding: 30px; color: #8892B0;">
                            📭 Belum ada data pendaftar
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = data.map((item, index) => {
                const date = item.createdAt ? 
                    new Date(item.createdAt.toDate()).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : '-';
                
                const isVerified = item.status === 'verified';
                
                const statusBadge = isVerified ?
                    '<span class="badge badge-success">✅ Verified</span>' :
                    '<span class="badge badge-warning">⏳ Pending</span>';
                
                const ekskul = (item.ekskul && Array.isArray(item.ekskul)) ?
                    item.ekskul.join(', ') : '-';
                
                // Tombol aksi
                let actionButtons = '';
                
                if (!isVerified) {
                    // Jika belum verified, tampilkan tombol verify
                    actionButtons += `
                        <button class="btn btn-success btn-sm" onclick="verifyData('${item.id}')" 
                            style="margin-right: 5px;" title="Verifikasi siswa ini">
                            ✅ Verifikasi
                        </button>
                    `;
                } else {
                    // Jika sudah verified, tampilkan badge
                    actionButtons += `
                        <span class="badge badge-success" style="margin-right: 5px;">✅ Terverifikasi</span>
                    `;
                }
                
                // Tombol hapus selalu ada
                actionButtons += `
                    <button class="btn btn-danger btn-sm" onclick="deleteData('${item.id}')" 
                        title="Hapus data">
                        🗑️ Hapus
                    </button>
                `;
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${item.nama || '-'}</strong></td>
                        <td>${item.nisn || '-'}</td>
                        <td>${item.asalSekolah || '-'}</td>
                        <td>${item.whatsapp || '-'}</td>
                        <td>${item.jurusan1 || '-'}</td>
                        <td>${item.jurusan2 || '-'}</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${ekskul}">
                            ${ekskul}
                        </td>
                        <td>${statusBadge}</td>
                        <td>${date}</td>
                        <td style="white-space: nowrap;">
                            ${actionButtons}
                        </td>
                    </tr>
                `;
            }).join('');
            
            console.log('✅ Table rendered with ' + data.length + ' rows');
        }

        // ============================================
        // FILTER DATA
        // ============================================
        function filterData() {
            const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
            const jurusan = document.getElementById('filterJurusan')?.value || '';
            
            let filtered = allData;
            
            if (search) {
                filtered = filtered.filter((item) =>
                    (item.nama && item.nama.toLowerCase().includes(search)) ||
                    (item.nisn && item.nisn.includes(search)) ||
                    (item.asalSekolah && item.asalSekolah.toLowerCase().includes(search))
                );
            }
            
            if (jurusan) {
                filtered = filtered.filter((item) =>
                    item.jurusan1 === jurusan || item.jurusan2 === jurusan
                );
            }
            
            renderTable(filtered);
        }

        // ============================================
        // VERIFY DATA - DIPERBAIKI
        // ============================================
        async function verifyData(id) {
            console.log('🔍 Verifying data with ID:', id);
            
            // Cari data siswa berdasarkan ID
            const siswa = allData.find(item => item.id === id);
            const namaSiswa = siswa ? siswa.nama : 'siswa ini';
            
            // Konfirmasi dengan nama siswa
            if (!confirm(`✅ Verifikasi pendaftaran atas nama "${namaSiswa}"?\n\nStatus akan berubah menjadi "Terverifikasi".`)) {
                console.log('❌ Verification cancelled by user');
                return;
            }
            
            try {
                console.log('📝 Updating Firestore...');
                
                // Update status di Firestore
                await db.collection('pendaftaran').doc(id).update({
                    status: 'verified',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('✅ Firestore updated successfully');
                
                // Update data lokal
                const index = allData.findIndex(item => item.id === id);
                if (index !== -1) {
                    allData[index].status = 'verified';
                }
                
                // Refresh tampilan
                updateDashboardStats();
                renderTable(allData);
                drawAllCharts();
                
                showToast(`✅ Pendaftaran "${namaSiswa}" berhasil diverifikasi!`, 'success');
                
            } catch (error) {
                console.error('❌ Error verifying:', error);
                
                let errorMessage = 'Gagal verifikasi data';
                
                if (error.code === 'permission-denied') {
                    errorMessage = '❌ Izin ditolak. Cek Firestore rules.';
                } else if (error.code === 'not-found') {
                    errorMessage = '❌ Data tidak ditemukan.';
                } else {
                    errorMessage = '❌ ' + error.message;
                }
                
                showToast(errorMessage, 'error');
            }
        }

        // ============================================
        // DELETE DATA - DIPERBAIKI
        // ============================================
        async function deleteData(id) {
            console.log('🗑️ Deleting data with ID:', id);
            
            // Cari data siswa berdasarkan ID
            const siswa = allData.find(item => item.id === id);
            const namaSiswa = siswa ? siswa.nama : 'siswa ini';
            
            // Konfirmasi dengan peringatan keras
            if (!confirm(`⚠️ PERINGATAN!\n\nAnda akan menghapus data pendaftaran atas nama:\n"${namaSiswa}"\n\nTindakan ini TIDAK DAPAT dibatalkan!\n\nLanjutkan?`)) {
                console.log('❌ Deletion cancelled by user');
                return;
            }
            
            // Double confirm
            if (!confirm(`🔴 KONFIRMASI TERAKHIR!\n\nHapus data "${namaSiswa}"?\n\nKlik OK untuk menghapus permanen.`)) {
                console.log('❌ Deletion cancelled on second confirmation');
                return;
            }
            
            try {
                console.log('📝 Deleting from Firestore...');
                
                // Hapus dari Firestore
                await db.collection('pendaftaran').doc(id).delete();
                
                console.log('✅ Firestore deleted successfully');
                
                // Hapus dari data lokal
                allData = allData.filter(item => item.id !== id);
                
                // Refresh tampilan
                updateDashboardStats();
                renderTable(allData);
                drawAllCharts();
                
                showToast(`🗑️ Data "${namaSiswa}" berhasil dihapus!`, 'success');
                
            } catch (error) {
                console.error('❌ Error deleting:', error);
                
                let errorMessage = 'Gagal menghapus data';
                
                if (error.code === 'permission-denied') {
                    errorMessage = '❌ Izin ditolak. Cek Firestore rules.';
                } else if (error.code === 'not-found') {
                    errorMessage = '❌ Data tidak ditemukan.';
                } else {
                    errorMessage = '❌ ' + error.message;
                }
                
                showToast(errorMessage, 'error');
            }
        }

        // ============================================
        // EXPORT EXCEL
        // ============================================
        function exportToExcel() {
            if (allData.length === 0) {
                showToast('⚠️ Tidak ada data untuk diexport', 'warning');
                return;
            }
            
            console.log('📥 Exporting ' + allData.length + ' records to Excel...');
            
            // Buat header CSV dengan BOM untuk Excel
            let csv = '\uFEFF';
            csv += 'No,Nama,NISN,Asal Sekolah,WhatsApp,Email,Jurusan 1,Jurusan 2,Ekskul,Status,Tanggal Daftar\n';
            
            allData.forEach((item, index) => {
                const date = item.createdAt ? 
                    new Date(item.createdAt.toDate()).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    }) : '-';
                
                const ekskul = (item.ekskul && Array.isArray(item.ekskul)) ? 
                    item.ekskul.join('; ') : '-';
                
                const status = item.status === 'verified' ? 'Terverifikasi' : 'Pending';
                
                // Escape quotes dan koma
                const escapeCsv = (str) => {
                    if (!str) return '';
                    str = str.toString();
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        str = '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                };
                
                csv += `${index + 1},`;
                csv += `${escapeCsv(item.nama)},`;
                csv += `${escapeCsv(item.nisn)},`;
                csv += `${escapeCsv(item.asalSekolah)},`;
                csv += `${escapeCsv(item.whatsapp)},`;
                csv += `${escapeCsv(item.email)},`;
                csv += `${escapeCsv(item.jurusan1)},`;
                csv += `${escapeCsv(item.jurusan2)},`;
                csv += `${escapeCsv(ekskul)},`;
                csv += `${status},`;
                csv += `${date}\n`;
            });
            
            // Download file
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `data-siswa-smkti-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast(`✅ ${allData.length} data berhasil diexport ke Excel!`, 'success');
        }

        // ============================================
        // CHARTS
        // ============================================
        function drawAllCharts() {
            drawJurusanChart('jurusanChart');
            drawEkskulChart('ekskulChart');
            drawTrendChart('trendChart');
        }

        function drawJurusanChart(canvasId) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 300;
            
            const jurusanCount = {};
            allData.forEach((item) => {
                if (item.jurusan1) {
                    jurusanCount[item.jurusan1] = (jurusanCount[item.jurusan1] || 0) + 1;
                }
            });
            
            const labels = Object.keys(jurusanCount);
            const values = Object.values(jurusanCount);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (labels.length === 0) {
                ctx.fillStyle = '#8892B0';
                ctx.font = '14px Poppins';
                ctx.textAlign = 'center';
                ctx.fillText('📭 Belum ada data jurusan', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            const barWidth = Math.min(100, (canvas.width - 100) / labels.length);
            const maxVal = Math.max(...values, 1);
            
            values.forEach((val, i) => {
                const barHeight = (val / maxVal) * (canvas.height - 100);
                const x = 50 + i * (barWidth + 20);
                const y = canvas.height - 50 - barHeight;
                
                // Gradient
                const grad = ctx.createLinearGradient(x, y, x, canvas.height - 50);
                grad.addColorStop(0, '#00F0FF');
                grad.addColorStop(1, '#0066FF');
                
                // Shadow
                ctx.shadowColor = 'rgba(0, 240, 255, 0.3)';
                ctx.shadowBlur = 10;
                
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, barWidth, barHeight);
                
                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                
                // Value
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Poppins';
                ctx.textAlign = 'center';
                ctx.fillText(val, x + barWidth / 2, y - 10);
                
                // Label
                ctx.fillStyle = '#8892B0';
                ctx.font = '10px Poppins';
                const label = labels[i].length > 15 ? labels[i].substring(0, 15) + '...' : labels[i];
                ctx.fillText(label, x + barWidth / 2, canvas.height - 20);
            });
        }

        function drawEkskulChart(canvasId) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 300;
            
            const ekskulCount = {};
            allData.forEach((item) => {
                if (item.ekskul && Array.isArray(item.ekskul)) {
                    item.ekskul.forEach((e) => {
                        ekskulCount[e] = (ekskulCount[e] || 0) + 1;
                    });
                }
            });
            
            const entries = Object.entries(ekskulCount).sort((a, b) => b[1] - a[1]);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (entries.length === 0) {
                ctx.fillStyle = '#8892B0';
                ctx.font = '14px Poppins';
                ctx.textAlign = 'center';
                ctx.fillText('📭 Belum ada data ekskul', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            const barH = Math.min(25, (canvas.height - 80) / entries.length);
            const maxVal = Math.max(...entries.map(e => e[1]), 1);
            
            entries.forEach(([label, val], i) => {
                const barW = (val / maxVal) * (canvas.width - 200);
                const y = 30 + i * (barH + 5);
                
                const grad = ctx.createLinearGradient(0, y, barW, y);
                grad.addColorStop(0, '#0066FF');
                grad.addColorStop(1, '#00F0FF');
                
                ctx.fillStyle = grad;
                ctx.fillRect(150, y, barW, barH);
                
                ctx.fillStyle = '#fff';
                ctx.font = '11px Poppins';
                ctx.textAlign = 'right';
                ctx.fillText(label, 140, y + barH / 2 + 4);
                
                ctx.textAlign = 'left';
                ctx.fillText(val, 155 + barW, y + barH / 2 + 4);
            });
        }

        function drawTrendChart(canvasId) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 300;
            
            const dateCount = {};
            allData.forEach((item) => {
                if (item.createdAt) {
                    const date = new Date(item.createdAt.toDate()).toLocaleDateString('id-ID');
                    dateCount[date] = (dateCount[date] || 0) + 1;
                }
            });
            
            const dates = Object.keys(dateCount).sort();
            const values = dates.map(d => dateCount[d]);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (dates.length < 2) {
                ctx.fillStyle = '#8892B0';
                ctx.font = '14px Poppins';
                ctx.textAlign = 'center';
                ctx.fillText('📅 Data belum cukup untuk grafik tren', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            const maxVal = Math.max(...values, 1);
            const xStep = (canvas.width - 100) / (dates.length - 1 || 1);
            
            // Draw line
            ctx.beginPath();
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            
            // Gradient fill
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
            
            values.forEach((val, i) => {
                const x = 50 + i * xStep;
                const y = canvas.height - 50 - (val / maxVal) * (canvas.height - 100);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            values.forEach((val, i) => {
                const x = 50 + i * xStep;
                const y = canvas.height - 50 - (val / maxVal) * (canvas.height - 100);
                
                ctx.fillStyle = '#00F0FF';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#0A0E27';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Value
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Poppins';
                ctx.textAlign = 'center';
                ctx.fillText(val, x, y - 15);
                
                // Date
                ctx.fillStyle = '#8892B0';
                ctx.font = '9px Poppins';
                ctx.fillText(dates[i], x, canvas.height - 20);
            });
        }

        // ============================================
        // TOAST NOTIFICATION
        // ============================================
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
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: rgba(10, 14, 39, 0.95);
                backdrop-filter: blur(10px);
                border-left: 4px solid ${colors[type]};
                border-radius: 8px;
                color: white;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
                font-size: 0.9rem;
                animation: slideIn 0.3s ease;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                max-width: 450px;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100px)';
                toast.style.transition = 'all 0.3s';
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }, 3000);
        }

        // ============================================
        // INITIALIZATION
        // ============================================
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Admin page loaded');
            checkSession();
        });

        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(100px); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ Admin script ready');
        console.log('📋 Features: Login, Dashboard, Data Siswa, Verifikasi, Hapus, Export Excel, Charts');
    </script>
