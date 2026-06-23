const columns = [
    { label: "DC", field: "dc", index: 1, visible: true },
    { label: "CBM", field: "cbm", index: 2, visible: true, type: "number" },
    { label: "KGS", field: "kgs", index: 3, visible: true, type: "number" },
    { label: "Min KGS", field: "min_kgs", index: 4, visible: true, type: "number" },
    { label: "Lead Time", field: "lead_time", index: 5, visible: true, type: "number" },
    { label: "Ratio", field: "ratio", index: 6, visible: true, type: "number" },
    { label: "VM", field: "vm", index: 7, visible: false, type: "number" },
    { label: "CW", field: "cw", index: 8, visible: false, type: "number" },
    { label: "Cheapest", field: "cheapest", index: 9, visible: false },
    { label: "Vendor Name", field: "vendor_name", index: 10, visible: false },
    { label: "Service Name", field: "service_name", index: 11, visible: false }
];

const root = ReactDOM.createRoot(
    document.getElementById("outstanding_dispatch")
);

root.render(
    <ReusableTable
        title="Outstanding Dispatch"
        endpoint="/api/odoo/outstanding-dispatch"
        columns={columns}
    />
);