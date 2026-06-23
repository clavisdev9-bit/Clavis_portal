$(document).ready(function () {
    const data = [
        { 
            customer: "ORAMI", dc_code: 30010001, dc_name: "ORM BEKASI",address:"JL. RAYA BEKASI KM28 (JL. WAHAB AFFAN)PONDOK UNGU, MEDAN SATRIABEKASI 17132",kode_pos:"17132",pulau:"JAWA",provinsi:"JAWA BARAT"},
    ];

    $("#courierTable").DataTable({
        data: data,
        columns: [
            {
                title: "No",
                data: null,
                render: (data, type, row, meta) => meta.row + 1
            },
            { title: "Customer", data: "customer" },
            { title: "DC Code", data: "dc_code" },
            { title: "DC Name", data: "dc_name" },
            { title: "Address", data: "address" },
            { title: "Kode Pos", data: "kode_pos" },
            { title: "Pulau", data: "pulau" },
            { title: "Provinsi", data: "provinsi" }
        ]
    });
});