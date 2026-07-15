document.addEventListener("DOMContentLoaded", () => {
    loadSales();
    loadTotalSales();
    loadTotalOrders();
    loadAverageOrders();
    loadTotalMargin();
    loadMarginPercent();
    loadDeliveryFull();
});
function loadTotalSales() {
    fetch(`${__API_URL__}/sales/total_sales`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('total_sales').innerHTML=formatDollar(data[0].total_amount);
        })
        .catch(err => console.error("API Error:", err));
}
            
function loadTotalOrders() {
    fetch(`${__API_URL__}/sales/total_orders`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('total_orders').innerHTML=formatDollar(data[0].total_orders);
        })
        .catch(err => console.error("API Error:", err));
}
function loadAverageOrders() {
    fetch(`${__API_URL__}/sales/average_orders`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('average_orders').innerHTML=formatDollar(data[0].average_orders);
        })
        .catch(err => console.error("API Error:", err));
}
function loadTotalMargin() {
    fetch(`${__API_URL__}/sales/total_margin`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('total_margin').innerHTML=formatDollar(data[0].total_margin);
        })
        .catch(err => console.error("API Error:", err));
}
function loadMarginPercent() {
    fetch(`${__API_URL__}/sales/margin_percent`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('margin_percent').innerHTML=formatDollar(data[0].margin_percent);
        })
        .catch(err => console.error("API Error:", err));
}
function loadDeliveryFull() {
    fetch(`${__API_URL__}/sales/delivery_full`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('delivery_full').innerHTML=formatDollar(data[0].order_delivery_full);
        })
        .catch(err => console.error("API Error:", err));
}
function loadSales(startDate = "", endDate = "") {
    const params = new URLSearchParams();

    if (startDate) {
        params.append("date_from", startDate);
    }

    if (endDate) {
        params.append("date_to", endDate);
    }
    const url = `${__API_URL__}/sales/master${
        params.toString() ? `?${params.toString()}` : ""
    }`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            console.log(data);

            if ($.fn.DataTable.isDataTable('#salesTable')) {
                $('#salesTable').DataTable().clear().destroy();
            }

            // Siapkan data untuk DataTables
            const tableData = data.map((sales, i) => [
                i + 1, // Nomor
                sales.display_name,
                formatDate(sales.write_date),
                sales.partner_invoice_id?.[1] ?? "-",
                sales.write_uid?.[1] ?? "-",
                formatCurrency(sales.amount_total),
                sales.type_name,
                sales.company_id?.[1] ?? "-"
            ]);

            // Inisialisasi DataTable
            $("#salesTable").DataTable({
                data: tableData,
                columns: [
                    { title: "No", width: "50px" },
                    { title: "Number" },
                    { title: "Creation Date" },
                    { title: "Customers" },
                    { title: "Sales Person" },
                    { title: "Total" },
                    { title: "Status" },
                    { title: "Company" }
                ]
            });
        })
        .catch(err => console.error("API Error:", err));
}
loadSales();

document.getElementById("startDate").addEventListener("change", reloadData);
document.getElementById("endDate").addEventListener("change", reloadData);

function reloadData() {
    loadSales(
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
const formatCurrency = (value) => {
    if (value == null) return "-";
    return "Rp." + new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
};
const socketeu = new WebSocket("ws://localhost:3000");

socketeu.onmessage = (msg) => {
    if (msg.data === "updated") {
        loadSales();
    }
};
loadSales();