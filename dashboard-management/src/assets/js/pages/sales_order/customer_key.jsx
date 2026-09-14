// Kunci unik untuk 1 entri customer/brand/kategori DI DALAM 1 company —
// dipakai di CustomerLegend & SalesTrendChart supaya label yang sama
// (mis. "No Brand", yang bisa muncul di lebih dari satu company) tidak
// saling tertukar identitasnya: warna, seleksi highlight (klik legend),
// maupun pencarian data series-nya.
//
// Dibungkus lewat JSON.stringify([company, label]) supaya tidak perlu
// pilih delimiter sendiri (dan berisiko tabrakan kalau nama company/label
// asli kebetulan mengandung karakter delimiter itu) — JSON sudah
// meng-escape isinya dengan aman.
window.buildCustomerKey = function buildCustomerKey(company, label) {
    return JSON.stringify([company, label]);
};

window.parseCustomerKey = function parseCustomerKey(key) {
    try {
        const parsed = JSON.parse(key);
        if (Array.isArray(parsed) && parsed.length === 2) {
            return { company: parsed[0], label: parsed[1] };
        }
    } catch (e) {
        // bukan composite key (mis. dipakai di tempat yang belum
        // di-migrasi) — anggap seluruhnya label, tanpa company
    }
    return { company: "", label: key };
};
