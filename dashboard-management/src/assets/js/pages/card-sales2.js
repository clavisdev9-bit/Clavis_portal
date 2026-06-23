document.getElementById("searchSales").addEventListener("input", loadSalesCards);
document.getElementById("filterDate").addEventListener("change", loadSalesCards);
document.getElementById("filterStatus").addEventListener("change", loadSalesCards);
async function loadSalesCards() {
    const sales_name=document.getElementById("searchSales").value.toLowerCase();
    const filter_date=document.getElementById("filterDate").value;
    const status = document.getElementById("filterStatus").value;
    const container = document.getElementById("card-sales");
    container.classList.add("blur-sm", "opacity-50", "pointer-events-none");
    const loader = document.createElement("div");
    loader.id = "loadingOverlay";
    loader.className = `
        absolute inset-0 flex items-center justify-center
        bg-white/40 dark:bg-black/40 backdrop-blur-[1px]
    `;

    loader.innerHTML = `
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500"></div>
    `;

    container.appendChild(loader);
    fetch(`${__API_URL__}/maps/get_sales_area?sales_name=${sales_name}&filter_date=${filter_date}&status=${status}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            container.innerHTML = ""; // clear sebelum render ulang

            data.data.forEach(async p => {
                // const locationName = await getLocationName(p.lat, p.lng);
                const created = formatTanggalIndo(p.check_in_at);
                const statusColor =
                p.visit_status_label === 'SELESAI'
                    ? 'red'
                    : p.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'green'
                    : 'gray';
                const statusLabel =
                p.visit_status_label === 'SELESAI'
                    ? 'SELESAI'
                    : p.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'CHECK IN'
                    : 'VISIT';
                const card = `
                    <div class="sales-item flex pb-3 mb-3 border-b dark:border-darkborder cursor-pointer" data-lat="${p.latitude}" data-lng="${p.longitude}">
                        <img src="${p.sales_photo_url}" 
                             class="size-24" 
                             alt="${p.sales_name}">
                        
                        <div class="w-full ms-4">
                            <div class="flex justify-between">
                                <h5 class="mb-2 font-semibold">${p.sales_name}</h5><br>
                            </div>
                            <div class="flex justify-between">
                                <h5 class="mb-2 font-semibold">${p.target_name}</h5>
                            </div>
                            <div class="mb-2">
                                <span class="text-muted">${created}</span><br>
                            </div>
                            <div class="mb-2 gps-info overflow-hidden max-h-0 transition-all duration-300">
                                <i class="ri-map-pin-line"></i><span class="text-muted">${p.gps_snapshot}</span><br>
                            </div>
                            <div class="mb-2">
                               <span style="color:${statusColor}; font-weight:600;">
                                    ${statusLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += card;
            });
        })
        .catch(err => console.error("ERROR:", err))
        .finally(() => {
        // loading effect OFF
        container.classList.remove("blur-sm", "opacity-50", "pointer-events-none");
        const overlay = document.getElementById("loadingOverlay");
        if (overlay) overlay.remove();
    });
}
document.addEventListener('dblclick', function (e) {
    const el = e.target.closest('.sales-item');
    if (!el) return;

    openSalesDetail(el.dataset.lat, el.dataset.lng);
});
document.addEventListener('click', function (e) {
    const el = e.target.closest('.sales-item');
    if (!el) return;

    if (window.openMarkerPopup) {
        window.openMarkerPopup(el.dataset.lat, el.dataset.lng);
    }
    const currentGps = el.querySelector('.gps-info');
    document.querySelectorAll('.gps-info').forEach(gps => {
        if (gps !== currentGps) {
            gps.classList.remove('max-h-30');
            gps.classList.add('max-h-0');
        }
    });

    // =========================
    // toggle card yg diklik
    // =========================
    currentGps.classList.toggle('max-h-30');
    currentGps.classList.toggle('max-h-0');
});
// async function getLocationName(lat, lng) {
//     const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

//     try {
//         const res = await fetch(url, { 
//             headers: { 'User-Agent': 'YourAppName/1.0' } 
//         });
//         const data = await res.json();
//         return data.display_name || "Lokasi tidak diketahui";
//     } catch (e) {
//         console.error("Reverse geocoding error:", e);
//         return "Lokasi tidak diketahui";
//     }
// }

// Panggil pertama kali
// window.addEventListener("DOMContentLoaded", () => {
//     document.getElementById("filterDate").value =
//         new Date().toISOString().split("T")[0];
//     loadSalesCards();
// });
const socket=new WebSocket("ws://localhost:3000");
socket.onmessage=(msg)=>{
    if(msg.data==="updated"){
        loadSalesCards();
    }
}
function openSalesDetail(lat,lng) {
    if (window.zoomToLocation) {
        window.zoomToLocation(lat, lng);
    } else {
        console.error("zoomToLocation() tidak ditemukan!");
    }
}
function formatTanggalIndo(dateString) {
    const date = new Date(dateString);

    const hari = date.toLocaleDateString("id-ID", { weekday: "long" });
    const tgl = date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const jam = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });

    return `${hari}, ${tgl} - ${jam}`;
}

loadSalesCards();