document.addEventListener("DOMContentLoaded", () => {
    loadPurchase();
    loadTotalPurchase();
});
function loadTotalPurchase() {
    fetch(`${__API_URL__}/purchase/total_purchase`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('total_purchase').innerHTML=formatDollar(data[0].total_amount);
        })
        .catch(err => console.error("API Error:", err));
}
            
function loadPurchase() {
    fetch(`${__API_URL__}/purchase/master`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if ($.fn.DataTable.isDataTable('#purchaseTable')) {
                $('#purchaseTable').DataTable().clear().destroy();
            }
            // siapkan array untuk DataTables
            const tableData = data.map(purchase => {
                return [
                    formatDollar(purchase.amount_total),
                    purchase.display_name,
                    purchase.name,
                    formatDate(purchase.write_date),
                    purchase.write_uid[1],
                    purchase.company_id[1]
                ];
            });

            // Inisialisasi DataTable
            $("#purchaseTable").DataTable({
                data: tableData,
                columns: [
                    { title: "Total" },
                    { title: "Number" },
                    { title: "Number" },
                    { title: "Creation Date" },
                    { title: "Sales Person" },
                    { title: "Company" },
                ]
            });
            $('#purchaseTable').DataTable();

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

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
};
const formatDollar = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    }).format(value);
};