const columns = [
    {
        label: "Do Sent",
        field: "do_sent",
        index: 1,
        visible: true,
    },
    {
        label: "Do Received",
        field: "do_received",
        index: 2,
        visible: true,
    },
    {
        label: "Cancel Status",
        field: "cancel_status",
        index: 3,
        visible: true,
    },
    {
        label: "Cust PO No",
        field: "cust_po_no",
        index: 4,
        visible: true,
    },
    {
        label: "AWB No",
        field: "awb_no",
        index: 5,
        visible: true,
    },
    {
        label: "Cust PO Date",
        field: "cust_po_date",
        index: 6,
        visible: true,
        type: "date",
    },
    {
        label: "Customer Name",
        field: "customer_name",
        index: 7,
        visible: false,
    },
    {
        label: "DC Name",
        field: "dc_name",
        index: 8,
        visible: false,
    },
    {
        label: "DO No",
        field: "do_no",
        index: 9,
        visible: false,
    },
    {
        label: "DO Date",
        field: "do_date",
        index: 10,
        visible: false,
        type: "date",
    },
    {
        label: "Shipped By",
        field: "shipped_by",
        index: 11,
        visible: false,
    },
    {
        label: "Qty Shipped",
        field: "qty_shipped",
        index: 12,
        visible: false,
        type: "number",
    },
    {
        label: "Qty Shipped Box",
        field: "qty_shipped_box",
        index: 13,
        visible: false,
        type: "number",
    },
    {
        label: "Do Sent By",
        field: "do_sent_by",
        index: 14,
        visible: false,
    },
    {
        label: "Do Sent At",
        field: "do_sent_at",
        index: 15,
        visible: false,
        type: "date",
    },
    {
        label: "Do Received By",
        field: "do_received_by",
        index: 16,
        visible: false,
    },
    {
        label: "Do Received At",
        field: "do_received_at",
        index: 17,
        visible: false,
        type: "date",
    },
];

const root = ReactDOM.createRoot(
    document.getElementById("pod_hand_over")
);

root.render(
    <ReusableTable
        title="POD Hand Over"
        endpoint="/api/odoo/pod-hand-over"
        columns={columns}
    />
);