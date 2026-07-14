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
            
function loadPurchase(startDate = "", endDate = "") {

    const params = new URLSearchParams();

    if (startDate) {
        params.append("date_from", startDate);
    }

    if (endDate) {
        params.append("date_to", endDate);
    }

    const url = `${__API_URL__}/purchase/master${
        params.toString() ? `?${params.toString()}` : ""
    }`;

    fetch(url)
        .then(res => res.json())
        .then(data => {

            if ($.fn.DataTable.isDataTable('#purchaseTable')) {
                $('#purchaseTable').DataTable().clear().destroy();
            }

            const tableData = data.map((purchase, i) => [
                i + 1,
                purchase.display_name,
                purchase.partner_id[1] ? purchase.partner_id[1]:"-",
                formatRupiah(purchase.amount_total),
                formatDate(purchase.write_date),
                purchase.invoice_status,
            ]);

            $("#purchaseTable").DataTable({
                data: tableData,
                columns: [
                    { title: "No", width: "50px" },
                    { title: "Number" },
                    { title: "Vendor" },
                    { title: "Total" },
                    { title: "Creation Date" },
                    { title: "Status" },
                ]
            });

        })
        .catch(err => console.error(err));
}

loadPurchase();

document.getElementById("startDate").addEventListener("change", reloadData);
document.getElementById("endDate").addEventListener("change", reloadData);

function reloadData() {
    loadPurchase(
        document.getElementById("startDate").value,
        document.getElementById("endDate").value
    );
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
const formatRupiah = (value) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0, // Rupiah biasanya tanpa desimal
        maximumFractionDigits: 0
    }).format(value);
};