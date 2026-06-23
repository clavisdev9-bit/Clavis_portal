document.getElementById("searchSales").addEventListener("input", loadSalesCards);
document.getElementById("filterDate").addEventListener("change", loadSalesCards);
document.getElementById("filterStatus").addEventListener("change", loadSalesCards);
window.salesState = {
    klikCount: 0,
    lastClickedId: null,
    klikId: 0
};
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
            container.innerHTML = ""; // clear sebelum render ulang
            console.log(data.data);
            data.data.forEach(async p => {
                // const locationName = await getLocationName(p.lat, p.lng);
                const created = formatTanggalIndo(p.check_in_at);
                const statusColor =
                p.visit_status_label === 'SELESAI'
                    ? 'red'
                    : p.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'green'
                    : 'gray';
                const statusBorder =
                p.visit_status_label === 'SELESAI'
                    ? 'border border-red-700 px-1'
                    : p.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'border border-green-700 px-1'
                    : 'border border-gray-700 px-1';
                const statusLabel =
                p.visit_status_label === 'SELESAI'
                    ? 'FINISHED'
                    : p.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'CHECK IN'
                    : 'VISIT';
                const isActive =
                    salesState.klikCount === 1 && String(p.id) === String(salesState.klikId);

                const activeClass = isActive ? 'bg-blue-100 text-black' : '';
                const gpsClass = isActive ? 'max-h-30' : 'max-h-0';
                const card = `
                    <div class="sales-item flex p-4 gap-2 mr-2 border border-gray-200 cursor-pointer my-2 ${activeClass}" data-lat="${p.latitude}" data-lng="${p.longitude}" data-id="${p.id}">
                        <img src="${p.sales_photo_url}" class="size-24" >
                        <div class="flex-col text-left">
                            <h5 class="mb-1 font-semibold capitalize"><i class="ri-user-line"></i>&nbsp;${p.sales_name}</h5>
                            <h5 class="mb-1 font-semibold"><i class="ri-building-4-line"></i>&nbsp;${p.target_name}</h5>
                            <span class="text-muted"><i class="ri-time-line"></i>&nbsp;${created}</span>
                            <div class="gps-info overflow-hidden transition-all duration-300 text-justify ${gpsClass} mb-1">
                                <i class="ri-map-pin-line"></i><span class="text-muted">${p.gps_snapshot}</span><br>
                            </div>
                            <span class="${statusBorder}" style="color:${statusColor}; font-weight:600;">
                                ${p.target_type} ${statusLabel}
                            </span>
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
document.addEventListener('click', function (e) {
    const el = e.target.closest('.sales-item');
    if (!el) return;
    salesState.klikId = el.dataset.id;

    // =========================
    // LOGIC BARU
    // =========================
    if (salesState.klikId === salesState.lastClickedId) {
        // klik card yg sama → toggle
        salesState.klikCount = salesState.klikCount === 0 ? 1 : 0;
    } else {
        // klik card beda → selalu aktif (1)
        salesState.klikCount = 1;
    }

    salesState.lastClickedId = salesState.klikId;

    if (window.openMarkerPopup) {
        window.openMarkerPopup(el.dataset.lat, el.dataset.lng);
    }
    document.querySelectorAll('.sales-item').forEach(card => {
        if (card !== el) {
            card.classList.remove('bg-blue-100', 'text-white');

            const gps = card.querySelector('.gps-info');
            gps.classList.remove('max-h-30');
            gps.classList.add('max-h-0');
        }
    });
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
    el.classList.toggle('bg-blue-100');

});
document.addEventListener('dblclick', function (e) {
    const el = e.target.closest('.sales-item');
    if (!el) return;
    salesState.klikId = el.dataset.id;

    // =========================
    // LOGIC BARU
    // =========================
    if (salesState.klikId === salesState.lastClickedId) {
        // klik card yg sama → toggle
        salesState.klikCount = salesState.klikCount === 0 ? 1 : 0;
    } else {
        // klik card beda → selalu aktif (1)
        salesState.klikCount = 1;
    }

    salesState.lastClickedId = salesState.klikId;
    document.querySelectorAll('.sales-item').forEach(card => {
        if (card !== el) {
            card.classList.remove('bg-blue-100', 'text-white');

            const gps = card.querySelector('.gps-info');
            gps.classList.remove('max-h-30');
            gps.classList.add('max-h-0');
        }
    });
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
    el.classList.toggle('bg-blue-100');
    openSalesDetail(el.dataset.lat, el.dataset.lng);
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
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filterDate").value =
        new Date().toISOString().split("T")[0];
    loadSalesCards();
});
const socket = new WebSocket("ws://192.168.0.101:3000");
socket.onmessage=(msg)=>{
    if(msg.data==="sales-updated"){
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
window.resetSalesCards = function () {
    document.querySelectorAll('.sales-item').forEach(card => {
        card.classList.remove('bg-blue-100', 'text-white');

        const gps = card.querySelector('.gps-info');
        if (gps) {
            gps.classList.remove('max-h-30');
            gps.classList.add('max-h-0');
        }
    });
    salesState.klikCount = 0;
    salesState.klikId = 0
};
loadSalesCards();