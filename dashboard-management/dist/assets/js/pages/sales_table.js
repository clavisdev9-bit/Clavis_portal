
document.getElementById("searchSales").addEventListener("input", loadSales);
document.getElementById("filterDate").addEventListener("change", () => {
    isFirstLoad = true; // paksa zoom ulang
    loadSales();
});
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filterDate").value =
        new Date().toISOString().split("T")[0];
    loadSales();
});
document.getElementById("filterStatus").addEventListener("change", loadSales);
function loadSales() {
    const sales_name=document.getElementById("searchSales").value.toLowerCase();
    const filter_date=document.getElementById("filterDate").value;
    const status = document.getElementById("filterStatus").value;
    fetch(`${__API_URL__}/maps/get_sales_area?sales_name=${sales_name}&filter_date=${filter_date}&status=${status}`)
        .then(res => res.json())
        .then(data => {
            console.log(data.data);
            if ($.fn.DataTable.isDataTable('#salesTable')) {
                $('#salesTable').DataTable().clear().destroy();
            }
            // siapkan array untuk DataTables
            const tableData = data.data.map(sales => {
                let visitDate;

                if (sales.visit_status_label === 'SELESAI') {
                    visitDate = formatDate(sales.check_out_at);
                } else if (sales.visit_status_label === 'SEDANG_CHECK_IN') {
                    visitDate = formatDate(sales.check_in_at);
                } else if (sales.visit_status_label === 'VISIT') {
                    visitDate = formatDate(sales.visit_at);
                }
                const statusTextColor =
                sales.visit_status_label === 'SELESAI'
                    ? 'text-red-700'
                    : sales.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'text-green-700'
                    : 'text-gray-700';
                const statusBorder =
                sales.visit_status_label === 'SELESAI'
                    ? 'border border-red-700 px-1'
                    : sales.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'border border-green-700 px-1'
                    : 'border border-gray-700 px-1';
                const statusLabel =
                sales.visit_status_label === 'SELESAI'
                    ? 'FINISHED'
                    : sales.visit_status_label === 'SEDANG_CHECK_IN'
                    ? 'CHECK IN'
                    : 'VISIT';
                return [
                    visitDate,
                    sales.sales_name,
                    sales.gps_snapshot,
                    `<span class="${statusBorder} ${statusTextColor} font-semibold">${sales.target_type} ${statusLabel}</span>`
                ];
            });

            // Inisialisasi DataTable
            $("#salesTable").DataTable({
                data: tableData,
                order: [[0, 'desc']],
                columns: [
                    { data: 0 },
                    { data: 1 },
                    { data: 2 },
                    { data: 3 }
                ]
            });
        })
        .catch(err => console.error("API Error:", err));
        
}
const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);

    const pad = n => n.toString().padStart(2, "0");

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    const second = pad(d.getSeconds());

    return `${day}/${month}/${year} ${hour}:${minute}`;
};
const formatDollar = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    }).format(value);
};
