
const map = L.map('map').setView([-6.200000, 106.816666], 11);
let markersMap = {};

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

// ======== LAYER UNTUK MENYIMPAN MARKER ========
let markerLayer = L.layerGroup().addTo(map);
let isFirstLoad = true;
document.getElementById("searchSales").addEventListener("input", () => {
    initMap();
});
document.getElementById("filterDate").addEventListener("change", () => {
    isFirstLoad = true; // paksa zoom ulang
    initMap();
});
document.getElementById("filterStatus").addEventListener("change", () => {
    initMap();
});

let bounds = [];
async function loadMarkers() {
    bounds=[];
    const sales_name=document.getElementById("searchSales").value.toLowerCase();
    const filter_date=document.getElementById("filterDate").value;
    const status = document.getElementById("filterStatus").value;
    
    try{
        const response = await axios.get(`${__API_URL__}/maps/get_sales_area?sales_name=${sales_name}&filter_date=${filter_date}&status=${status}`);
        const data=response.data.data;
        markerLayer.clearLayers();
        data.forEach(p => {
            const wrapperClass =
                p.visit_status_label === 'SELESAI'
                    ? 'pin-wrapper-close'
                    : 'pin-wrapper';
            const statusColor =
                p.visit_status_label === 'SELESAI'
                    ? 'red'
                    : p.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'green'
                    : 'gray';
            const statusLabel =
                p.visit_status_label === 'SELESAI'
                    ? 'FINISHED'
                    : p.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'CHECK IN'
                    : 'VISIT';
            const photoIcon = L.divIcon({
                className: 'custom-marker',
                html: `
                    <div class="${wrapperClass}">
                        <img src="${p.sales_photo_url}" />
                    </div>
                `,
                iconSize: [60, 70],
                iconAnchor: [30, 60],
                popupAnchor: [0, -60]
            });
            const visitDate =
            p.visit_status_label === 'SELESAI'
                ? p.check_out_at
                : p.check_in_at;

            const marker = L.marker([p.latitude, p.longitude], { icon: photoIcon })
            .bindPopup(`
                <b>${p.sales_name}</b><br>
                ${formatTanggalIndo(visitDate)}<br>
                <span style="color:${statusColor}; font-weight:600;">
                    ${p.target_type} ${statusLabel}
                </span>
            `);

            markerLayer.addLayer(marker);
            // simpan marker by key
            const key = `${p.latitude},${p.longitude}`;
            markersMap[key] = marker;

            bounds.push([p.latitude, p.longitude]);
        });
        
    } catch (err) {
        console.error("Gagal fetch:", err);
    }
}
function jumpToAllMarker(){
    if (bounds.length > 0) {
        map.flyToBounds(bounds, {
            padding: [50, 50],
            animate: true,
            duration: 1.5
        });
    }
}
window.openMarkerPopup = function(lat, lng) {
    const key = `${lat},${lng}`;
    const marker = markersMap[key];

    if (marker) {
        marker.openPopup();
        map.panTo([lat, lng]);
    }
};
function formatTanggalIndo(dateString) {
    const date = new Date(dateString);

    const hari = date.toLocaleDateString("id-ID", { weekday: "long" });
    const tgl = date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const jam = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });

    return `${hari}, ${tgl} - ${jam}`;
}
// === Fungsi global untuk zoom ke lokasi tertentu ===
window.zoomToLocation = function(lat, lng) {
    map.flyTo([lat, lng], 16, {
        animate: true,
        duration: 1.5  // durasi animasi dalam detik
    });
};
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filterDate").value =
        new Date().toISOString().split("T")[0];
    initMap();
});
const socketeu = new WebSocket("ws://192.168.0.101:3000");

socketeu.onmessage = (msg) => {
    if (msg.data === "sales-updated") {

        if (window.salesState.klikCount !== 0) {
            loadMarkers();
        } else {
            initMap();
        }
    }
};
// ===============================
// Custom Refresh Button
// ===============================
const refreshControl = L.Control.extend({
    options: {
        position: 'topleft' // sama dengan zoom default
    },

    onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

        const button = L.DomUtil.create('a', '', container);
        button.innerHTML = '<i class="ri-restart-line"></i>'; // icon refresh
        button.href = '#';
        button.title = 'Refresh Data';

        button.style.fontSize = '18px';
        button.style.textAlign = 'center';
        button.style.lineHeight = '26px';

        // cegah map ikut drag saat klik
        L.DomEvent.disableClickPropagation(container);

        L.DomEvent.on(button, 'click', function (e) {
            L.DomEvent.preventDefault(e);

            if (window.resetSalesCards) {
                window.resetSalesCards(); // 🔥 reset semua card
            }

            initMap(); // reload marker
        });

        return container;
    }
});

map.addControl(new refreshControl());
async function initMap() {
    await loadMarkers();   // tunggu selesai dulu
    jumpToAllMarker();     // baru zoom
}

