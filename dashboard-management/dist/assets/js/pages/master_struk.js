document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});
const fileInput = document.getElementById('file');
const preview = document.getElementById('preview');
const scanBtn = document.getElementById('scanBtn');
const submitButton=document.getElementById('submitButton');
const successModal=document.getElementById('successModal');
const textSuccess=document.getElementById('textSuccess');

fileInput.addEventListener('change', function () {
    document.getElementById('Toko').value='';
    document.getElementById('Date').value='';
    document.getElementById('Note').value='';
    document.getElementById('Total').value='';
    document.getElementById('Toko').classList.remove('border-red-500');
    document.getElementById('Date').classList.remove('border-red-500');
    document.getElementById('Note').classList.remove('border-red-500');
    document.getElementById('Total').classList.remove('border-red-500');
    document.getElementById('error-toko').classList.add('hidden');
    document.getElementById('error-date').classList.add('hidden');
    document.getElementById('error-note').classList.add('hidden');
    document.getElementById('error-total').classList.add('hidden');
    document.getElementById('submitButton').classList.add('hidden');
    const file = this.files[0];
    if (!file) {
        scanBtn.classList.add('hidden');
        preview.classList.add('hidden');
        return;
    }
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar (jpg, png, jpeg, dll)');
        this.value = ''; // reset input file
        scanBtn.classList.add('hidden');
        preview.classList.add('hidden');
        return;
    }

    // (opsional) validasi ekstensi
    const allowedExt = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExt.includes(ext)) {
        alert('Format gambar tidak didukung');
        this.value = '';
        scanBtn.classList.add('hidden');
        preview.classList.add('hidden');
        return;
    }

    preview.src = URL.createObjectURL(file);
    preview.classList.remove('hidden');

    // tampilkan scan button
    scanBtn.classList.remove('hidden');
});
async function scan() {
    setScanLoading(true);
    const file = document.getElementById('file').files[0];
    if (!file) return alert('Pilih gambar');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('isOverlayRequired', 'true');
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');

    const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
            'apikey': 'K86235854388957'
        },
        body: formData
    });
    submitButton.disabled = false;
    submitButton.classList.remove(
        'bg-gray-600',
        'text-gray-100',
        'cursor-not-allowed'
    );

    submitButton.classList.add(
        'bg-blue-500',
        'text-white',
        'cursor-pointer'
    );
    const data = await res.json();
    const lines = data.ParsedResults?.[0]?.TextOverlay?.Lines || [];
    let hargaJual = null;
    let total = null;
    let tunai = null;
    let jenis_bbm = null;
    let harga_liter = null;
    let jumlah_liter = null;
    let tanggal = null;
    let toko = null;
    const items = [];
    const logicalLines = mergeLinesByY(lines);
    console.log(logicalLines)
    for (const line of logicalLines) {
        if (!tanggal) {

            // Tangkap berbagai format:
            // 19-12-2025 | 19/12/25 | 19.12.25 | 19 12 25
            const dateMatch = line.match(
                /(\d{2})\s*[-./ ]\s*(\d{2})\s*[-./ ]\s*(\d{2,4})/
            );

            if (dateMatch) {
                let dd = dateMatch[1];
                let mm = dateMatch[2];
                let yy = dateMatch[3];

                // Jika tahun hanya 2 digit → ubah jadi 20yy
                if (yy.length === 2) {
                    yy = "20" + yy;
                }

                tanggal = `${yy}-${mm}-${dd}`;   // ISO format
            }
        }
        if(!toko){
            if (/(?:INDOMARET\b|PT\s+INDOMARCO\s+PRISMATAMA)/i.test(line)) toko = 'INDOMARET';
            if (/PERTAMINA/i.test(line)) toko = "PERTAMINA";
            if (/SUMBER.*ALFA.*TRI.*AYA\.|ALFAMART/i.test(line)) {
                toko = "ALFAMART";
            }
        }
        // ===== TOTAL =====
        if (!total) {
            if(toko!=='PERTAMINA'){
                const match2 = line.match(/TOTAL(?:\s+ITEM)?[\s:-]*.*?(\d+(?:\s*[.,]\s*\d+)*)\s*$/i);
                if (match2) {
                    total = Number(match2[1].replace(/[^\d]/g, ""));
                }
            }else{
                const matchPertamina = line.match(
                    /(?:JUMLAH\s+BELI|TOTAL\s+HARGA)\s*[:\-]?\s*[^0-9]*([\d.,]+)/i
                );

                if (matchPertamina) {
                    total = Number(matchPertamina[1].replace(/[^\d]/g, ""));
                }
            }
        }
        // ===== TUNAI =====
        if (!tunai) {
            const matchTunai = line.match(/TUNAI\s*[:\-]?\s*([\d.,]+)/i);
            if (matchTunai) {
                tunai = Number(matchTunai[1].replace(/[.,]/g, ''));
            }
        }
        if(!jenis_bbm){
            const matchJenisBBM = line.match(/(JENIS\s*BBM|NAMA\s*PRODUK)\s*[:\-]?\s*(.+)$/i);
            if (matchJenisBBM) {
                jenis_bbm = matchJenisBBM[2].trim();
            }
        }

        if (!harga_liter) {
            const matchHargaLiter = line.match(
                /HARGA\s*(?:\/\s*)?LITER\s*[:\-]?\s*(?:Rp[\s.]*?)?(\d[\d.,]*)/i
            );

            if (matchHargaLiter) {
                harga_liter = matchHargaLiter[1];   // "9.850"
                harga_liter = harga_liter.replace(/[^\d]/g, ""); // "9850"
            }
        }
        
        const match = line.match(/(?:VOLUME|JUMLAH\s*LITER)\s*[:\-]?\s*\(?\s*L?\s*\)?\s*([\d.,]+)/i);

        if (match) {
            jumlah_liter = match[1].replace(/\s/g, '');
        }

        if (/TOTAL|TUNAI|PPN|HARGA JUAL/i.test(line)) continue;

        const item = parseItemLine(line);
        if (item) items.push(item);
        if (tanggal && hargaJual) break;
    }
    document.getElementById('Toko').value = toko;
    document.getElementById('Date').value = tanggal;
    if(toko==='PERTAMINA' && harga_liter){
        document.getElementById('Note').value =
        `Jenis BBM : ${jenis_bbm}\nHARGA/LITER : ${harga_liter}\nJumlah Liter : ${jumlah_liter}\n`;
    }else{
        if(items.length>0){
            document.getElementById('Note').value =
            'Item list\n' +
            items.map(i =>
                `Nama : ${i.nama}\nQty : ${i.qty}\nHarga satuan : ${i.hargaSatuan}\nTotal : ${i.subtotal}`
            ).join('\n\n');
        }else{
            document.getElementById('Note').value = '';
        }
    }
    

    document.getElementById('Total').value = total;
    document.getElementById('result').textContent = logicalLines.join('\n');
    submitButton.classList.remove('hidden');
    setScanLoading(false);
    if(!toko || !tanggal || !total || (items.length===0&&toko!=='PERTAMINA')){
        errorModal.classList.remove('hidden');
        let errorMsg='';
        if(!toko) errorMsg+='- Nama toko tidak terdeteksi\n';
        if(!tanggal) errorMsg+='- Tanggal tidak terdeteksi\n';
        if(!document.getElementById('Note').value) errorMsg+='- Item list tidak terdeteksi\n';
        if(!total) errorMsg+='- Total belanja tidak terdeteksi\n';
        document.getElementById('textError').textContent = errorMsg;
        return;
    }
}
function toISODate(ddmmyy) {
    const [dd, mm, yy] = ddmmyy.split('.');
    return `20${yy}-${mm}-${dd}`;
}
function mergeLinesByY(lines, tolerance = 10) {
    const merged = [];

    lines.forEach(line => {
        const y = line.MinTop;

        // cari grup dengan Y mirip
        let group = merged.find(g =>
        Math.abs(g.y - y) <= tolerance
        );

        if (!group) {
        group = {
            y,
            words: []
        };
        merged.push(group);
        }

        group.words.push(...line.Words);
    });

    // urutkan word dari kiri ke kanan
    return merged
    .map(group =>group.words
        .sort((a, b) => a.Left - b.Left)
        .map(w => w.WordText)
        .join(' ')
    );
}
function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 },
        (_, i) => [i]).map((row, i) =>
        row.concat(Array.from({ length: a.length }, (_, j) =>
        i === 0 ? j + 1 : 0)));

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i-1] === a[j-1]
            ? matrix[i-1][j-1]
            : Math.min(
                matrix[i-1][j-1] + 1,
                matrix[i][j-1] + 1,
                matrix[i-1][j] + 1
            );
        }
    }
    return matrix[b.length][a.length];
}
function parseItemLine(line) {
    // blacklist teks NON ITEM
    if (
        /JL\.|RT|RW|KEL|KEC|KOTA|KAB|NPWP|LAYANAN|CALL|SMS|TELP|WWW|HTTP/i.test(line)
    ) return null;

    const match = line.match(
        /^\s*(.+?)\s+(\d{1,2})\s+([\d\s.,]+?)\s+([\d\s.,]+)\s*$/
    );

    if (!match) return null;

    const nama = match[1].trim();
    const qty = Number(match[2]);
    const hargaSatuan = Number(match[3].replace(/\D/g, ''));
    const subtotal = Number(match[4].replace(/\D/g, ''));

    // VALIDASI LOGIKA
    if (qty <= 0 || qty > 99) return null;
    if (hargaSatuan < 1000) return null;
    if (subtotal !== qty * hargaSatuan) return null;

    return {
        nama,
        qty,
        hargaSatuan,
        subtotal
    };
}
function parseTokoAlamat(lines) {
    const idx = lines.findIndex(l =>
        /^IND[O0]M[A4]RET$/i.test(l.trim())
    );

    let toko = null;
    let alamat = '';

    if (idx !== -1) {
        toko = 'Indomaret';

        const alamatLines = [];

        for (let i = idx + 1; i < lines.length; i++) {
            // STOP jika ketemu tanggal / jam / transaksi
            if (/\d{2}[.,]\d{2}[.,]\d{2}|\d{2}:\d{2}/.test(lines[i])) break;

            alamatLines.push(lines[i]);
        }

        alamat = alamatLines.join(' ');
    }

    return { toko, alamat };
}
function validateField(id) {
    const el = document.getElementById(id);
    const error_toko = document.getElementById('error-toko');
    const error_date = document.getElementById('error-date');
    const error_note = document.getElementById('error-note');
    const error_total = document.getElementById('error-total');

    if (!el.value.trim()) {
        el.classList.add('border-red-500');
        el.classList.remove('hidden');
        if(id==='Toko') error_toko.classList.remove('hidden')
        if(id==='Date') error_date.classList.remove('hidden')
        if(id==='Note') error_note.classList.remove('hidden')
        if(id==='Total') error_total.classList.remove('hidden')
        return false;
    } else {
        el.classList.remove('border-red-500');
        return true;
    }
}

submitButton.addEventListener('click', async function () {
    // ambil nilai input
    const file = fileInput.files[0];
    const toko = document.getElementById('Toko').value;
    const date = document.getElementById('Date').value;
    const note = document.getElementById('Note').value;
    const total = document.getElementById('Total').value;
    const id_user = localStorage.getItem('id_user');
    
    const isTokoValid = validateField('Toko');
    const isDateValid = validateField('Date');
    const isNoteValid = validateField('Note');
    const isTotalValid = validateField('Total');

    if (!isTokoValid || !isDateValid || !isNoteValid || !isTotalValid) {
        return;
    }
    const formData = new FormData();
    formData.append('toko', toko);
    formData.append('date', date);
    formData.append('note', note);
    formData.append('total', Number(total));
    formData.append('id_user',id_user);
    if (file) {
        formData.append('image', file);
    }

    try {
        const response = await fetch(`${__API_URL__}/module/expense`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Gagal mengirim data');
        }

        const result = await response.json();
        console.log('Success:', result);

        successModal.classList.remove('hidden');
        document.getElementById('textSuccess').textContent = 'Data berhasil disimpan';
        
        document.getElementById('Toko').value='';
        document.getElementById('Date').value='';
        document.getElementById('Note').value='';
        document.getElementById('Total').value='';
        document.getElementById('submitButton').classList.add('hidden');
        loadProducts();

    } catch (error) {
        console.error(error);
        alert('Terjadi kesalahan saat mengirim data');
    }
});
function setScanLoading(isLoading) {
    const btn = document.getElementById('scanBtn');
    const spinner = document.getElementById('scanSpinner');
    const text = document.getElementById('scanText');

    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        spinner.classList.remove('hidden');
        text.textContent = 'Scanning...';
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
        spinner.classList.add('hidden');
        text.textContent = 'Scan OCR';
    }
}
function setSubmitLoading(isLoading) {
    const btn = document.getElementById('submitButton');
    const spinner = document.getElementById('submitSpinner');
    const text = document.getElementById('submitText');

    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        spinner.classList.remove('hidden');
        text.textContent = 'Submitting...';
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
        spinner.classList.add('hidden');
        text.textContent = 'Submit';
    }
}
function closeSuccessModal(){
    document.getElementById("successModal").classList.add("hidden");
}
function closeErrorModal(){
    document.getElementById("errorModal").classList.add("hidden");
}
function loadProducts() {
    fetch(`${__API_URL__}/module/expense`)
        .then(res => res.json())
        .then(data => {
            if ($.fn.DataTable.isDataTable('#productTable')) {
                $('#productTable').DataTable().clear().destroy();
            }
            const tableData = data.map(product => {
                return [
                    `<a href="#!" class="capitalize">${product.id}</a>`,
                    renderReceiptImage(product.receipt_attachment),
                    product.name,
                    product.date,
                    product.note,
                    product.amount,
                    product.sender
                ];
            });

            // Inisialisasi DataTable
            $("#productTable").DataTable({
                data: tableData,
                scrollX: true,              // 🔥 PENTING
                autoWidth: false,
                columns: [
                    { title: "ID" },
                    { title: "Image" },
                    { title: "Name" },
                    { title: "Date" },
                    { title: "Note" },
                    { title: "Amount" },
                    { title: "Sender" }
                ]
            });
            $('#productTable').DataTable();

            $('#productTable tbody').on('click', 'tr', function () {
                const rowData = table.row(this).data();
                if (!rowData) return;

                // ambil ID
                const productId = rowData[0];

                // cari data asli
                const product = rawData.find(p => p.id == productId);
                if (!product) return;

                fillFormFromTable(product);
            });
            $('#productTable tbody').on('click', 'tr', function () {
                $('#productTable tbody tr').removeClass('selected');
                $(this).addClass('selected');
                scanBtn.classList.add('hidden')
            });

            $('#productTable').DataTable();

        })
        .catch(err => console.error("API Error:", err));
        
}
function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    img.src = src;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

document.getElementById('imageModal').addEventListener('click', function () {
    this.classList.add('hidden');
    this.classList.remove('flex');
});

function renderReceiptImage(filename) {
    if (!filename) {
        return '-';
    }

    const imageUrl = `${__API_URL__}/uploads/${filename}`;

    return `
        <img 
            src="${imageUrl}" 
            alt="Receipt"
            class="w-16 h-16 object-cover rounded cursor-pointer"
            onclick="openImageModal('${imageUrl}')"
        />
    `;
}
function fillFormFromTable(product) {
    // Isi form
    document.getElementById('Toko').value = product.name;
    document.getElementById('Date').value = product.date;
    document.getElementById('Note').value = product.note_full;
    document.getElementById('Total').value = product.amount;
    document.getElementById('file').classList.add('hidden');

    // Preview image
    if (product.receipt_attachment) {
        const preview = document.getElementById('preview');
        preview.src = `${__API_URL__}/uploads/${product.receipt_attachment}`;
        preview.classList.remove('hidden');
    }


}
document.getElementById('clearButton').addEventListener('click', () => {
    clearForm();
});
function clearForm() {

    // reset input
    document.getElementById('Toko').value = '';
    document.getElementById('Date').value = '';
    document.getElementById('Note').value = '';
    document.getElementById('Total').value = '';
    document.getElementById('file').classList.remove('hidden');

    // reset file input
    const fileInput = document.getElementById('file');
    fileInput.value = '';
    fileInput.disabled = false;

    // hide preview
    const preview = document.getElementById('preview');
    preview.src = '';
    preview.classList.add('hidden');

    // hide scan button
    document.getElementById('scanBtn').classList.add('hidden');

    // toggle buttons
    document.getElementById('submitButton').classList.add('hidden');

    // optional: hapus error validasi
    ['Toko','Date','Note','Total'].forEach(id => {
        document.getElementById(id).classList.remove('border-red-500');
        const err = document.getElementById(`error-${id.toLowerCase()}`);
        if (err) err.classList.add('hidden');
    });
    document
        .querySelectorAll('#productTable tbody tr.selected')
        .forEach(tr => tr.classList.remove('selected'));
}
// function showAddModal() {
//     document.getElementById("addProductModal").classList.remove("hidden");
// }

// function closeAddModal() {
//     document.getElementById("addProductModal").classList.add("hidden");
// }
// function showDetail(id) {
//     console.log("Show detail for ID:", id);
//     fetch(`${__API_URL__}/product/master/${id}`)
//         .then(res => res.json())
//         .then(product => {
//             console.log(product);
//             document.getElementById("modalContent").innerHTML = `
//                 <p><strong>Name:</strong> ${product.name}</p>
//                 <p><strong>Cost:</strong> ${product.cost}</p>
//                 <p><strong>Sales Price:</strong> ${product.sales_price}</p>
//                 <p><strong>Product Category:</strong> ${product.product_category}</p>
//                 <p><strong>UOM:</strong> $${product.unit_of_measure}</p>
//                 <p><strong>Costing Method:</strong> ${product.costing_method} </p>
//                 <p><strong>Product Type:</strong> ${product.product_type} </p>
//             `;

//             document.getElementById("detailModal").classList.remove("hidden");
//             document.getElementById("detailModal").classList.add("flex");
//         }).catch(err => console.error("Detail Error:", err));
// }
// function closeDetail() {
//     document.getElementById("detailModal").classList.add("hidden");
// }
// function editProduct(id) {
//     fetch(`${__API_URL__}/product/master/${id}`)
//     .then(res => res.json())
//     .then(item => {
//         document.getElementById("edit_id").value = item.id;
//         document.getElementById("edit_name").value = item.name;
//         document.getElementById("edit_cost").value = item.cost;
//         document.getElementById("edit_sales_price").value = item.sales_price;
//         document.getElementById("edit_product_category").value = item.product_category;
//         document.getElementById("edit_uom").value = item.unit_of_measure;
//         document.getElementById("edit_costing_method").value = item.costing_method;
//         document.getElementById("edit_product_type").value = item.product_type;

//         document.getElementById("editModal").classList.remove("hidden");
//     });
// }
// function saveEdit() {
//     const id = document.getElementById("edit_id").value;

//     const data = {
//         name: document.getElementById("edit_name").value,
//         cost: document.getElementById("edit_cost").value,
//         sales_price: document.getElementById("edit_sales_price").value,
//         product_category: document.getElementById("edit_product_category").value,
//         unit_of_measure: document.getElementById("edit_uom").value,
//         costing_method: document.getElementById("edit_costing_method").value,
//         product_type: document.getElementById("edit_product_type").value
//     };

//     fetch(`${__API_URL__}/product/master/${id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data)
//     })
//     .then(res => res.json())
//     .then(() => {
//         closeEditModal();
//         $('#textSuccess').text('Product updated successfully!');
//         $("#successModal").removeClass("hidden");
//         loadProducts();
//     })
//     .catch(err => {
//         console.error("Update Error:", err);
//         alert("Failed to update data");
//     });
    
// }
// function closeEditModal() {
//     document.getElementById("editModal").classList.add("hidden");
// }

// function showDeleteModal(id) {
//     fetch(`${__API_URL__}/product/master/${id}`)
//     .then(res => res.json())
//     .then(item => {
//         document.getElementById("deleted_id").value = item.id;

//         document.getElementById("deleteModal").classList.remove("hidden");
//     });
// }
// function deleteProduct() {
//     const id=document.getElementById('deleted_id').value;
//     fetch(`${__API_URL__}/product/master/${id}`, {
//         method: "DELETE"
//     })
//     .then(res => {
//         if (!res.ok) {
//             throw new Error("Failed to delete product");
//         }
//         return res.json();
//     })
//     .then(result => {
//         $("#successModal").removeClass("hidden");
//         $('#textSuccess').text('Product deleted successfully!');
//         closeDeleteModal();
//         loadProducts();
//     })
//     .catch(err => {
//         console.error("Delete Error:", err);
//         alert("Failed to delete product");
//     });
// }
// function closeDeleteModal(){
//     document.getElementById("deleteModal").classList.add("hidden");
// }
// function closeSuccessModal(){
//     document.getElementById("successModal").classList.add("hidden");
// }