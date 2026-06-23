document.getElementById("searchSales").addEventListener("input", loadSalesCards);
async function loadSalesCards() {
    const sales_name=document.getElementById("searchSales").value.toLowerCase();
    fetch(`${__API_URL__}/maps/realtime?sales_name=`+sales_name)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("card-sales");
            container.innerHTML = ""; // clear sebelum render ulang

            data.forEach(async p => {
                // const locationName = await getLocationName(p.lat, p.lng);
                const card = `
                    <div class="flex pb-3 mb-3 border-b dark:border-darkborder cursor-pointer" onclick="openSalesDetail('${p.lat}', '${p.lng}')">
                        <img src="${p.photo}" 
                             class="w-5/12 rounded-md 2xl:w-2/6 sm:w-2/12" 
                             alt="${p.sales_name}">
                        
                        <div class="w-full ms-4">
                            <div class="flex justify-between">
                                <h5 class="mb-2 font-semibold">${p.sales_name}</h5>
                                <i class="ri-more-2-line"></i>
                            </div>

                            <div class="mb-2">
                                <i class="ri-arrow-right-down-line"></i>
                                <span class="text-muted">${p.name}</span><br/>
                                <span class="text-muted">${p.created_at}</span>
                            </div>
                        </div>
                    </div>
                `;

                container.innerHTML += card;
            });
        })
        .catch(err => console.error("ERROR:", err));
}
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
function openSalesDetail(lat,lng) {
    if (window.zoomToLocation) {
        window.zoomToLocation(lat, lng);
    } else {
        console.error("zoomToLocation() tidak ditemukan!");
    }
}
loadSalesCards();
setInterval(loadSalesCards, 3000); 