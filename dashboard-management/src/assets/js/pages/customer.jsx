const columns = [
    {
        label: "Customer Code",
        field: "customer_code",
        index: 1,
        visible: true,
    },
    {
        label: "Customer Name",
        field: "customer_name",
        index: 2,
        visible: true,
    },
    {
        label: "Alias Name",
        field: "alias_name",
        index: 3,
        visible: true,
    },
    {
        label: "Billing Address",
        field: "billing_address",
        index: 4,
        width: "390px",
        className: "break-words whitespace-normal",
        visible: true,
    },
    {
        label: "Delivery Address",
        field: "delivery_address",
        index: 5,
        width: "390px",
        className: "break-words whitespace-normal",
        visible: true,
    },
    {
        label: "Phone 1",
        field: "phone_1",
        index: 6,
        visible: true,
    },
    {
        label: "Phone 2",
        field: "phone_2",
        index: 7,
        visible: false,
    },
    {
        label: "Fax",
        field: "fax",
        index: 8,
        visible: false,
    },
    {
        label: "Email",
        field: "email",
        index: 9,
        visible: false,
    },
    {
        label: "Website",
        field: "website",
        index: 10,
        visible: false,
    },
    {
        label: "Attention",
        field: "attention",
        index: 11,
        visible: false,
    },
    {
        label: "Contact",
        field: "contact",
        index: 12,
        visible: false,
    },
    {
        label: "Terms",
        field: "terms",
        index: 13,
        visible: false,
    },
    {
        label: "Credit Limit",
        field: "credit_limit",
        index: 14,
        visible: false,
    },
    {
        label: "Account No",
        field: "account_no",
        index: 15,
        visible: false,
    },
    {
        label: "Currency",
        field: "currency",
        index: 16,
        visible: false,
    },
    {
        label: "Nature of Business",
        field: "nature_of_business",
        index: 17,
        visible: false,
    },
    {
        label: "Bank Acc No",
        field: "bank_acc_no",
        index: 18,
        visible: false,
    },
    {
        label: "Registration No",
        field: "registration_no",
        index: 19,
        visible: false,
    },
    {
        label: "Tax No",
        field: "tax_no",
        index: 20,
        visible: false,
    },
    {
        label: "Active",
        field: "active",
        index: 21,
        visible: false,
    },
    {
        label: "Remark 1",
        field: "remark_1",
        index: 22,
        visible: false,
    },
    {
        label: "Remark 2",
        field: "remark_2",
        index: 23,
        visible: false,
    },
    {
        label: "Remark 3",
        field: "remark_3",
        index: 24,
        visible: false,
    },
    {
        label: "Remark 4",
        field: "remark_4",
        index: 25,
        visible: false,
    },
    {
        label: "Remark 5",
        field: "remark_5",
        index: 26,
        visible: false,
    },
    {
        label: "Note",
        field: "note",
        index: 27,
        visible: false,
    },
    {
        label: "Created At",
        field: "created_at",
        index: 28,
        visible: false,
    },
    {
        label: "Updated At",
        field: "updated_at",
        index: 29,
        visible: false,
    },
];

const root = ReactDOM.createRoot(
    document.getElementById("customer")
);

root.render(
    <ReusableTable
        title="Customer"
        endpoint="/api/odoo/customers"
        columns={columns}
    />
);
