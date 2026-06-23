document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});

function loadProducts() {
    fetch(`${__API_URL__}/product/master`)
        .then(res => res.json())
        .then(data => {
            if ($.fn.DataTable.isDataTable('#productTable')) {
                $('#productTable').DataTable().clear().destroy();
            }
            // siapkan array untuk DataTables
            const tableData = data.map(product => {
                return [
                    `<a href="#!" class="capitalize">${product.id}</a>`,
                    product.name,
                    product.cost,
                    product.sales_price,
                    product.product_category,
                    product.unit_of_measure,
                    product.costing_method,
                    product.product_type,
                    `
                    <div class="flex items-center gap-3">
                        <a onclick="showDetail('${product.id}')" class="transition duration-200 ease-linear text-muted hover:text-success cursor-pointer">
                            <i class="ri-eye-line"></i>
                        </a>
                        <a onclick="editProduct('${product.id}')" class="transition duration-200 ease-linear text-muted hover:text-purple cursor-pointer">
                            <i class="ri-edit-line"></i>
                        </a>
                        <a onclick="showDeleteModal('${product.id}')" class="transition duration-200 ease-linear text-muted hover:text-danger cursor-pointer">
                            <i class="ri-delete-bin-line"></i>
                        </a>
                    </div>
                    `
                ];
            });

            // Inisialisasi DataTable
            $("#productTable").DataTable({
                data: tableData,
                columns: [
                    { title: "ID" },
                    { title: "Name" },
                    { title: "Cost" },
                    { title: "Sales Price" },
                    { title: "Product Category" },
                    { title: "UOM" },
                    { title: "Costing Method" },
                    { title: "Product Type" },
                    { title: "Action" }
                ]
            });
            $('#productTable').DataTable();

        })
        .catch(err => console.error("API Error:", err));
        
}
function showAddModal() {
    document.getElementById("addProductModal").classList.remove("hidden");
}

function closeAddModal() {
    document.getElementById("addProductModal").classList.add("hidden");
}
async function addProduct() {
    const newProduct = {
        name: document.getElementById("add_name").value,
        cost: document.getElementById("add_cost").value,
        sales_price: document.getElementById("add_sales_price").value,
        product_category: document.getElementById("add_product_category").value,
        unit_of_measure: document.getElementById("add_unit_of_measure").value,
        costing_method: document.getElementById("add_costing_method").value,
        product_type: document.getElementById("add_product_type").value
    };

    try {
        const response = await fetch(`${__API_URL__}/product/master`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newProduct)
        });

        if (!response.ok) {
            alert("Failed to add product.");
            return;
        }

        // Tutup modal
        closeAddModal();

        // Refresh DataTable
        loadProducts();

        // Popup sukses
        $('#textSuccess').text('Product successfully added!');
        $("#successModal").removeClass("hidden");

    } catch (error) {
        console.error("Add Product Error:", error);
        alert("Error adding product.");
    }
}
function showDetail(id) {
    console.log("Show detail for ID:", id);
    fetch(`${__API_URL__}/product/master/${id}`)
        .then(res => res.json())
        .then(product => {
            console.log(product);
            document.getElementById("modalContent").innerHTML = `
                <p><strong>Name:</strong> ${product.name}</p>
                <p><strong>Cost:</strong> ${product.cost}</p>
                <p><strong>Sales Price:</strong> ${product.sales_price}</p>
                <p><strong>Product Category:</strong> ${product.product_category}</p>
                <p><strong>UOM:</strong> $${product.unit_of_measure}</p>
                <p><strong>Costing Method:</strong> ${product.costing_method} </p>
                <p><strong>Product Type:</strong> ${product.product_type} </p>
            `;

            document.getElementById("detailModal").classList.remove("hidden");
            document.getElementById("detailModal").classList.add("flex");
        }).catch(err => console.error("Detail Error:", err));
}
function closeDetail() {
    document.getElementById("detailModal").classList.add("hidden");
}
function editProduct(id) {
    fetch(`${__API_URL__}/product/master/${id}`)
    .then(res => res.json())
    .then(item => {
        document.getElementById("edit_id").value = item.id;
        document.getElementById("edit_name").value = item.name;
        document.getElementById("edit_cost").value = item.cost;
        document.getElementById("edit_sales_price").value = item.sales_price;
        document.getElementById("edit_product_category").value = item.product_category;
        document.getElementById("edit_uom").value = item.unit_of_measure;
        document.getElementById("edit_costing_method").value = item.costing_method;
        document.getElementById("edit_product_type").value = item.product_type;

        document.getElementById("editModal").classList.remove("hidden");
    });
}
function saveEdit() {
    const id = document.getElementById("edit_id").value;

    const data = {
        name: document.getElementById("edit_name").value,
        cost: document.getElementById("edit_cost").value,
        sales_price: document.getElementById("edit_sales_price").value,
        product_category: document.getElementById("edit_product_category").value,
        unit_of_measure: document.getElementById("edit_uom").value,
        costing_method: document.getElementById("edit_costing_method").value,
        product_type: document.getElementById("edit_product_type").value
    };

    fetch(`${__API_URL__}/product/master/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        closeEditModal();
        $('#textSuccess').text('Product updated successfully!');
        $("#successModal").removeClass("hidden");
        loadProducts();
    })
    .catch(err => {
        console.error("Update Error:", err);
        alert("Failed to update data");
    });
    
}
function closeEditModal() {
    document.getElementById("editModal").classList.add("hidden");
}

function showDeleteModal(id) {
    fetch(`${__API_URL__}/product/master/${id}`)
    .then(res => res.json())
    .then(item => {
        document.getElementById("deleted_id").value = item.id;

        document.getElementById("deleteModal").classList.remove("hidden");
    });
}
function deleteProduct() {
    const id=document.getElementById('deleted_id').value;
    fetch(`${__API_URL__}/product/master/${id}`, {
        method: "DELETE"
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Failed to delete product");
        }
        return res.json();
    })
    .then(result => {
        $("#successModal").removeClass("hidden");
        $('#textSuccess').text('Product deleted successfully!');
        closeDeleteModal();
        loadProducts();
    })
    .catch(err => {
        console.error("Delete Error:", err);
        alert("Failed to delete product");
    });
}
function closeDeleteModal(){
    document.getElementById("deleteModal").classList.add("hidden");
}
function closeSuccessModal(){
    document.getElementById("successModal").classList.add("hidden");
}