// ======== INISIALISASI MAP ========
const map = L.map('map').setView([-6.200000, 106.816666], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

// ======== LAYER UNTUK MENYIMPAN MARKER ========
let markerLayer = L.layerGroup().addTo(map);
let isFirstLoad = true;

async function loadMarkers() {
    const sales_name=document.getElementById("searchSales").value.toLowerCase();
    try {
        const res = await fetch(`${__API_URL__}/maps/realtime?sales_name=`+sales_name);
        const data = await res.json();

        markerLayer.clearLayers();

        let bounds = [];

        data.forEach(p => {
            const photoIcon = L.icon({
                iconUrl: p.photo,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40],
                className: 'rounded-icon'
            });

            const marker = L.marker([p.lat, p.lng], { icon: photoIcon })
                .bindPopup(`
                    <b>${p.name}</b><br>
                    <img src="${p.photo}" width="100" style="border-radius:6px;margin-top:6px;" />
                `);

            markerLayer.addLayer(marker);

            bounds.push([p.lat, p.lng]);
        });

        // 👇 Zoom only the first time
        if (isFirstLoad && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
            isFirstLoad = false;
        }

    } catch (err) {
        console.error("Gagal fetch:", err);
    }
}
// === Fungsi global untuk zoom ke lokasi tertentu ===
window.zoomToLocation = function(lat, lng) {
    map.flyTo([lat, lng], 16, {
        animate: true,
        duration: 1.5  // durasi animasi dalam detik
    });
};

loadMarkers();
setInterval(loadMarkers, 3000);

