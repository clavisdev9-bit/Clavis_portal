document.getElementById('exportExcel').addEventListener('click', function () {
    let table = document.getElementById('tablePurchaseOrderOutstanding');
    let wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
    XLSX.writeFile(wb, 'data.xlsx');
});