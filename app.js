// Impor Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// GANTI BAGIAN INI DENGAN KODE FIREBASE ANDA
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDVczkiBBESoE-OWkYcodpxNGt6rFK60k8",
  authDomain: "cbt-sman1pb.firebaseapp.com",
  projectId: "cbt-sman1pb",
  storageBucket: "cbt-sman1pb.firebasestorage.app",
  messagingSenderId: "603846976742",
  appId: "1:603846976742:web:ffd95d6d4065b40325c727",
  measurementId: "G-Z3K431DLNG"
};


let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch(e) {
    console.warn("Jalan tanpa Firebase");
}

let isExamRunning = false;
let warningCount = 0;
const MAX_WARNINGS = 3;

const screens = {
    login: document.getElementById('login-screen'),
    exam: document.getElementById('exam-screen'),
    warning: document.getElementById('warning-screen')
};
const dom = {
    tokenInput: document.getElementById('token-input'),
    btnLogin: document.getElementById('btn-login'),
    errorMsg: document.getElementById('login-error'),
    iframe: document.getElementById('google-form-frame'),
    warningCounter: document.getElementById('warning-counter'),
    warningText: document.getElementById('warning-text')
};

// Logika Tombol Login
dom.btnLogin.addEventListener('click', async () => {
    const token = dom.tokenInput.value.trim().toUpperCase();
    
    if (!token) {
        dom.errorMsg.textContent = "Token ujian tidak boleh kosong!";
        return;
    }

    // Cek Token Demo
    if (token === "DEMO") {
        dom.errorMsg.textContent = "";
        mulaiUjian("https://docs.google.com/forms/d/e/1FAIpQLSeqN-k-M6O82J8b_31xWj6W9U0w_0Y9/viewform?embedded=true");
        return;
    }

    // Proses Cek Database Firebase
    dom.btnLogin.textContent = "Memeriksa ke server...";
    try {
        const docRef = doc(db, "daftar_ujian", token);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().status_aktif === true) {
            dom.errorMsg.textContent = "";
            mulaiUjian(docSnap.data().url_form);
        } else {
            dom.errorMsg.textContent = "Token tidak valid atau ujian telah ditutup.";
        }
    } catch (err) {
        dom.errorMsg.textContent = "Koneksi ke database gagal. Cek konfigurasi Firebase Anda.";
        console.error(err);
    }
    dom.btnLogin.textContent = "Mulai Ujian";
});

// Masuk Mode Ujian
function mulaiUjian(url) {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(e => console.log(e));

    isExamRunning = true;
    
    screens.login.classList.remove('active');
    screens.exam.classList.add('active');
    
    dom.iframe.src = url;
}

// ==========================================
// SENSOR ANTI KECURANGAN
// ==========================================

// 1. Deteksi Pindah Tab (Visibility)
document.addEventListener("visibilitychange", () => {
    if (isExamRunning && document.visibilityState === 'hidden') {
        eksekusiHukuman("Terdeteksi pindah tab atau membuka aplikasi lain.");
    }
});

// 2. Deteksi Keluar Fullscreen
document.addEventListener("fullscreenchange", () => {
    if (isExamRunning && !document.fullscreenElement) {
        eksekusiHukuman("Terdeteksi keluar dari layar penuh.");
    }
});

// 3. Blokir Klik Kanan
document.addEventListener('contextmenu', e => {
    if (isExamRunning) e.preventDefault(); 
});

// 4. Blokir Copy-Paste & Inspect Element
document.addEventListener('keydown', e => {
    if (!isExamRunning) return;
    if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        alert("Fungsi Copy-Paste dilarang!");
    }
    if (e.key === 'F12') e.preventDefault();
});

// Fungsi Hukuman
function eksekusiHukuman(alasan) {
    warningCount++;
    dom.warningCounter.textContent = `Pelanggaran: ${warningCount}/${MAX_WARNINGS}`;
    
    if (warningCount >= MAX_WARNINGS) {
        isExamRunning = false;
        screens.exam.classList.remove('active');
        dom.iframe.src = ""; 
        
        screens.warning.classList.add('active');
        dom.warningText.textContent = alasan + " Batas toleransi telah habis.";
    } else {
        alert(`⚠️ PERINGATAN ${warningCount}/${MAX_WARNINGS}\n\n${alasan}\n\nJangan ulangi pelanggaran!`);
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e=>console.log(e));
        }
    }
}