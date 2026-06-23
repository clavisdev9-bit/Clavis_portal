const columns = [
    { label: "Cust PO No", field: "cust_po_no", index: 1, visible: true },
    { label: "SO Date", field: "so_date", index: 2, visible: true, type: "date" },
    { label: "Exp Date", field: "exp_date", index: 3, visible: true, type: "date" },
    { label: "Approved Date", field: "approved_date", index: 4, visible: true, type: "date" },
    { label: "Customer", field: "customer", index: 5, visible: true },
    { label: "Customer Alias", field: "customer_alias", index: 6, visible: true },
    { label: "DC Name", field: "dc_name", index: 7, visible: true },
    { label: "Area", field: "area", index: 8, visible: true },
    { label: "Cust. Lead Time", field: "cust_lead_time", index: 9, visible: false, type: "number" },
    { label: "Product Code", field: "product_code", index: 10, visible: false },
    { label: "Std Pack", field: "std_pack", index: 11, visible: false, type: "number" },
    { label: "Qty SO", field: "qty_so", index: 12, visible: false, type: "number" },
    { label: "Qty CTN", field: "qty_ctn", index: 13, visible: false, type: "number" },
    { label: "Repack", field: "repack", index: 14, visible: false },
    { label: "Length", field: "length", index: 15, visible: false, type: "number" },
    { label: "Breadth", field: "breadth", index: 16, visible: false, type: "number" },
    { label: "Height", field: "height", index: 17, visible: false, type: "number" },
    { label: "CM3", field: "cm3", index: 18, visible: false, type: "number" },
    { label: "CBM", field: "cbm", index: 19, visible: false, type: "number" },
    { label: "KGS", field: "kgs", index: 20, visible: false, type: "number" },
];

const root = ReactDOM.createRoot(
    document.getElementById("outstanding_gr")
);

root.render(
    <ReusableTable
        title="Outstanding GR"
        endpoint="/api/odoo/outstanding-gr"
        columns={columns}
    />
);