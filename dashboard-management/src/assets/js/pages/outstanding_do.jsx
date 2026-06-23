const columns = [
    { label: "Customer", field: "customer", index: 1, visible: true },
    { label: "Cust PO No", field: "cust_po_no", index: 2, visible: true },
    { label: "DC Name", field: "dc_name", index: 3, visible: true },
    { label: "Area", field: "area", index: 4, visible: true },
    { label: "Pulau", field: "pulau", index: 5, visible: true },
    { label: "Provinsi", field: "provinsi", index: 6, visible: true },
    { label: "Kabupaten", field: "kabupaten", index: 7, visible: false },
    { label: "Kecamatan", field: "kecamatan", index: 8, visible: false },
    { label: "Kelurahan", field: "kelurahan", index: 9, visible: false },
    { label: "Kode Pos", field: "kode_pos", index: 10, visible: false },
    { label: "PO Date", field: "po_date", index: 11, visible: false, type: "date" },
    { label: "Expired Date", field: "expired_date", index: 12, visible: false, type: "date" },
    { label: "GR No", field: "gr_no", index: 13, visible: false },
    { label: "GR Date", field: "gr_date", index: 14, visible: false, type: "date" },
    { label: "Location", field: "location", index: 15, visible: false },
    { label: "DO No", field: "do_no", index: 16, visible: false },
    { label: "DO Date", field: "do_date", index: 17, visible: false, type: "date" },
    { label: "Total SKU PO", field: "total_sku_po", index: 18, visible: false, type: "number" },
    { label: "Total CTN PO", field: "total_ctn_po", index: 19, visible: false, type: "number" },
    { label: "Total SKU GR", field: "total_sku_gr", index: 20, visible: false, type: "number" },
    { label: "Total CTN GR", field: "total_ctn_gr", index: 21, visible: false, type: "number" },
    { label: "Total M3 GR", field: "total_m3_gr", index: 22, visible: false, type: "number" },
    { label: "Total KGS GR", field: "total_kgs_gr", index: 23, visible: false, type: "number" },
    { label: "Print Label Date", field: "print_label_date", index: 24, visible: false, type: "date" }
];

const root = ReactDOM.createRoot(
    document.getElementById("outstanding_do")
);

root.render(
    <ReusableTable
        title="Outstanding DO"
        endpoint="/api/odoo/outstanding-do"
        columns={columns}
    />
);