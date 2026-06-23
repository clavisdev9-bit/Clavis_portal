document.addEventListener("DOMContentLoaded", () => {
    loadPartner();
});
            
function loadPartner() {
    fetch(`${__API_URL__}/partner/master`)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if ($.fn.DataTable.isDataTable('#partnerTable')) {
                $('#partnerTable').DataTable().clear().destroy();
            }
            // siapkan array untuk DataTables
            const tableData = data.map(partner => {
                return [
                    (partner.country_id && partner.country_id[1]) ? partner.country_id[1] : "-",
                    partner.email,
                    partner.name,
                    partner.phone,
                    partner.city
                ];
            });

            // Inisialisasi DataTable
            $("#partnerTable").DataTable({
                data: tableData,
                scrollX: true,              // 🔥 PENTING
                autoWidth: false,
                columns: [
                    { title: "Country" },
                    { title: "Email" },
                    { title: "Name" },
                    { title: "Phone" },
                    { title: "City" },
                ]
            });
            $('#partnerTable').DataTable();

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