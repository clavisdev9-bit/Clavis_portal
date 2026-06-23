document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});

const fileInput = document.getElementById('file');
const preview = document.getElementById('preview');
const previewPdf = document.getElementById('previewPdf');
const scanBtn = document.getElementById('scanBtn');
const submitButton=document.getElementById('submitButton');
const successModal=document.getElementById('successModal');
const textSuccess=document.getElementById('textSuccess');

fileInput.addEventListener('change', function () {
    document.getElementById('Toko').value='';
    document.getElementById('Date').value='';
    document.getElementById('Note').value='';
    document.getElementById('Bruto').value='';
    document.getElementById('Pajak').value='';
    document.getElementById('Total').value='';
    document.getElementById('item_list').innerHTML = '';
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
        previewPdf.classList.add('hidden');
        return;
    }
    // if (!file.type.startsWith('image/')) {
    //     alert('File harus berupa gambar (jpg, png, jpeg, dll)');
    //     this.value = ''; // reset input file
    //     scanBtn.classList.add('hidden');
    //     preview.classList.add('hidden');
    //     return;
    // }
    // (opsional) validasi ekstensi
    const allowedExt = ['jpg', 'jpeg', 'png', 'webp','pdf'];
    const ext = file.name.split('.').pop().toLowerCase();
    const url = URL.createObjectURL(file);
    if (['jpg','jpeg','png','webp','pdf'].includes(ext)) {
        preview.src = url;
        preview.classList.remove('hidden');
        previewPdf.src = '';
        previewPdf.classList.add('hidden');
    }

    if (!allowedExt.includes(ext)) {
        alert('Format gambar tidak didukung');
        this.value = '';
        scanBtn.classList.add('hidden');
        preview.classList.add('hidden');
        previewPdf.classList.add('hidden');
        return;
    }
    else if (ext === 'pdf') {
        previewPdf.src = url;
        previewPdf.classList.remove('hidden');
        preview.src = '';
        preview.classList.add('hidden');
    }

    // tampilkan scan button
    scanBtn.classList.remove('hidden');
});
async function scanned(){
    const file = document.getElementById("file").files[0];
    const extension = file.name.split('.').pop().toLowerCase();

    if(extension==='pdf'){
        scaning();
    }else{
        scan();
    }
}
async function scaning() {
    setScanLoading(true);

    const file = document.getElementById("file").files[0];
    if (!file) {
        setScanLoading(false);
        return alert("Pilih file");
    }

    const fileReader = new FileReader();
    let items=[];

    fileReader.onload = async function() {

        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({data: typedarray}).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        canvas.toBlob(async (blob)=>{

            try{
                const formData = new FormData();
                formData.append("file", blob, "scan.jpg");
                formData.append("OCREngine","2");

                const res = await fetch("https://api.ocr.space/parse/image",{
                    method:"POST",
                    headers:{ apikey:"K86235854388957" },
                    body:formData
                });

                const data = await res.json();
                const lines = data.ParsedResults?.[0]?.TextOverlay?.Lines || [];
                const orderDateIndex = lines.findIndex(line =>
                    line.LineText.toLowerCase().includes("order date")
                );
                // ambil line setelahnya
                let orderDateValue = null;
                if (orderDateIndex !== -1 && lines[orderDateIndex + 1]) {
                    orderDateValue = lines[orderDateIndex + 1].LineText;
                }

                if (orderDateValue) {
                    const [month, day, year] = orderDateValue.split("/");
                    const formattedDate = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;

                    const dateInput = document.getElementById("Date");
                    dateInput.value = formattedDate;
                    const date = new Date(formattedDate);

                    const formatted = date.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    document.getElementById('label_date').innerHTML=': '+formatted;
                }
                const logicalLines2 = mergeLinesByY(lines);
                const shippingLine = logicalLines2.find(line =>
                    line.toLowerCase().includes("shipping address")
                );

                let shippingValue = "";

                if (shippingLine) {
                    shippingValue = shippingLine.split(":")[1]?.trim();
                }

                let untaxedValue = "";
                document.getElementById('Toko').value = shippingValue;
                const untaxedLine = logicalLines2.find(line =>
                    line.toLowerCase().includes("untaxed amount")
                );

                const totalLine = logicalLines2.find(line =>
                    line.toLowerCase().startsWith("total")
                );

                let totalValue = "";

                if (untaxedLine) {
                    untaxedValue = parseRupiahToNumber(untaxedLine.replace(/.*untaxed amount/i, "").trim());
                }

                if (totalLine) {
                    totalValue = parseRupiahToNumber(totalLine.replace(/.*total/i, "").trim());
                }

                // masukkan ke input
                document.getElementById("Bruto").value = untaxedValue;
                document.getElementById("Total").value = totalValue;
                const logicalLines = mergeLinesByY2(lines);
                items = parseItemsByColumns(logicalLines);
                document.getElementById('label_toko').innerHTML=': '+shippingValue;
                document.getElementById('label_bruto').innerHTML=': '+formatCurrency(untaxedValue);
                document.getElementById('label_total').innerHTML =': '+formatCurrency(totalValue);
                document.getElementById("nama_toko").hidden = false;
                document.getElementById("date_text").hidden = false;
                document.getElementById("note_text").hidden = false;
                document.getElementById("bruto_text").hidden = false;
                document.getElementById("pajak_text").hidden = false;
                document.getElementById("netto_text").hidden = false;
                document.getElementById("nama_empty").hidden = true;
                document.getElementById("clearButton").hidden = false;
                if(items.length>0){
                    document.getElementById('Note').value =
                    JSON.stringify(items, null, 2);
                    const container = document.getElementById('item_list');
                    container.innerHTML = ''; // kosongkan dulu
                    items.forEach((i, index) => {
                        document.getElementById('item_list').insertAdjacentHTML('beforeend', `
                            <table class="border-collapse border border-gray-400 table-fixed text-sm">
                                <colgroup>
                                    <col class="w-[50px]">
                                    <col class="w-[340px]">
                                    <col class="w-[110px]">
                                    <col class="w-[110px]">
                                    <col class="w-[90px]">
                                    <col class="w-[90px]">
                                    <col class="w-[110px]">
                                </colgroup>

                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="border border-gray-300">No</th>
                                        <th class="border border-gray-300 text-left">Description</th>
                                        <th class="border border-gray-300 text-right">Qty</th>
                                        <th class="border border-gray-300 text-right">Unit Price</th>
                                        <th class="border border-gray-300 text-right">Disc.</th>
                                        <th class="border border-gray-300 text-right">Taxes</th>
                                        <th class="border border-gray-300 text-right">Amount</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr>
                                        <td class="border border-gray-300 text-center">${index + 1}</td>
                                        <td class="border border-gray-300 whitespace-normal break-words text-justify">
                                            ${i.description}
                                        </td>
                                        <td class="border border-gray-300 text-right whitespace-normal break-words">${i.qty}</td>
                                        <td class="border border-gray-300 text-right whitespace-normal break-words">${i.unit_price}</td>
                                        <td class="border border-gray-300 text-right">${i.disc}</td>
                                        <td class="border border-gray-300 text-right">${i.taxes}</td>
                                        <td class="border border-gray-300 text-right whitespace-normal break-words">${i.subtotal}</td>
                                    </tr>
                                </tbody>
                            </table>
                        `)
                    });
                }else{
                    document.getElementById('Note').value = '';
                }
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
                submitButton.classList.remove('hidden');
            }catch(err){
                console.error(err);
            }

            setScanLoading(false); // ✅ di akhir proses
            
        }, "image/jpeg", 0.7);

    };

    fileReader.readAsArrayBuffer(file);
}
function parseRupiahToNumber(text) {
  return Number(
    text
      .replace(/rp/gi, "")   // hapus Rp
      .replace(/,/g, "")     // hapus koma
      .replace(/\.00$/, "")  // hapus .00 di belakang
      .trim()
  );
}
function parseItemsByColumns(lines){
    const columns = detectTableColumns(lines);
    const items = [];
    let currentItem = null;
    for(const line of lines){

        let row = {
            description:"",
            qty:"",
            unit_price:"",
            disc:"",
            taxes:"",
            amount:""
        };
        
        const lineText = line.words.map(w=>w.WordText).join(" ");

        if(/payment\s*terms/i.test(lineText)){
            if(currentItem) items.push(currentItem);
            break;
        }
        for(const w of line.words){

            const col = getColumnByX(w,columns);

            if(!col) continue;

            row[col] += w.WordText + " ";
        }

        const hasNumbers =
            row.qty.trim() !== "" &&
            row.unit_price.trim() !== "" &&
            row.amount.trim() !== "";
        if(hasNumbers){

            if(currentItem)
                items.push(currentItem);

            currentItem = {
                description: row.description.trim(),
                qty: row.qty,
                unit_price: Number(row.unit_price.replace(/,/g,'')),
                disc: Number(row.disc.replace(/\D/g,'')) || 0,
                taxes: Number(row.taxes.replace(/\D/g,'')) || 0,
                subtotal: Number(row.amount.replace(/,/g,''))
            };

        }else{

            if(currentItem && row.description.trim()){
                currentItem.description += " " + row.description.trim();
            }

        }

    }
    const index = items.findIndex(
        i => i.description.trim().toLowerCase() === "description"
    );

    const result = index !== -1 ? items.slice(index + 1) : [];

    return result;
}
function getColumnByX(word, columns){

    const center = word.Left + word.Width / 2;

    const entries = Object.entries(columns)
        .sort((a,b)=>a[1]-b[1]);

    for(let i=0;i<entries.length;i++){

        const [name,pos] = entries[i];
        const next = entries[i+1];

        if(!next || center < next[1])
            return name;
    }

    return null;
}
function detectTableColumns(lines){
    const columns = {};
    for(const line of lines){
        const text = line.words.map(w => w.WordText).join(" ").toLowerCase();
        if(
            text.includes("description") &&
            text.includes("qty") &&
            text.includes("unit")
        ){

            for(const word of line.words){

                const w = word.WordText.toLowerCase();

                if(w.includes("description"))
                    columns.description = word.Left;

                if(w.includes("qty"))
                    columns.qty = word.Left;

                if(w === "unit")
                    columns.unit_price = word.Left;

                if(w === "disc")
                    columns.disc = word.Left;

                if(w.includes("taxes"))
                    columns.taxes = word.Left;

                if(w.includes("amount") || w.includes("total"))
                    columns.amount = word.Left;
            }

            break;
        }
    }
    return columns;
}
async function scan() {
    let items_bbm=[];
    setScanLoading(true);
    const file = document.getElementById('file').files[0];
    if (!file) return alert('Pilih gambar');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('isOverlayRequired', 'true');
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');
    formData.append('isCreateSearchablePdf', 'false');
    formData.append('isSearchablePdfHideTextLayer', 'true');

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
    let pajak = null;
    let total = null;
    let tunai = null;
    let jenis_bbm = null;
    let harga_liter = null;
    let jumlah_liter = null;
    let tanggal = null;
    let toko = null;
    const items = [];
    const logicalLines = mergeLinesByY(lines);
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
        if(!pajak){
            const matchPajak = line.match(
                /\b(?:Pajak|Tax)\b\s*[:\-]?\s*[^0-9]*([\d.,]+)/i
            );

            if (matchPajak) {
                pajak = Number(matchPajak[1].replace(/[^\d]/g, ""));
            }
        }
        if (!total) {
            if(toko!=='PERTAMINA'){
                const match2 = line.match(
                    /\bTOTAL(?!\s*(?:PAJAK|SUBTOTAL))\b(?:\s+ITEM)?[\s:-]*.*?(\d+(?:\s*[.,]\s*\d+)*)\s*$/i
                );
                if (match2) {
                    total = Number(match2[1].replace(/[^\d]/g, ""));
                }
            }else{
                const matchPertamina = line.match(
                    /(?:JUMLAH\s+BELI|\bTOTAL(?!\s*(?:PAJAK|SUBTOTAL))\s+HARGA)\s*[:\-]?\s*[^0-9]*([\d.,]+)/i
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
        
        const container = document.getElementById('item_list');
        container.innerHTML = ''; // kosongkan dulu
        
        if (tanggal && hargaJual) break;
    }
    document.getElementById('Toko').value = toko;
    document.getElementById('Date').value = tanggal;
    const date = new Date(tanggal);

    const formatted = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('label_toko').innerHTML=': '+toko;
    document.getElementById('label_date').innerHTML=': '+formatted;
    document.getElementById('label_bruto').innerHTML=': '+pajak===null?0:formatCurrency(pajak+total);
    document.getElementById('label_pajak').innerHTML=': '+pajak===null?0:formatCurrency(pajak);
    document.getElementById('label_total').innerHTML = total;
    document.getElementById("nama_toko").hidden = false;
    document.getElementById("date_text").hidden = false;
    document.getElementById("note_text").hidden = false;
    document.getElementById("bruto_text").hidden = false;
    document.getElementById("pajak_text").hidden = false;
    document.getElementById("netto_text").hidden = false;
    document.getElementById("nama_empty").hidden = false;
    document.getElementById("clearButton").hidden = false;
    if(toko==='PERTAMINA' && harga_liter){
        const container = document.getElementById('item_list');
        container.innerHTML = ''; // kosongkan dulu
        items_bbm=
        [
            {
                "jenis_bbm": jenis_bbm,
                "harga_liter": harga_liter,
                "jumlah_liter": jumlah_liter
            }
        ];
        document.getElementById('Note').value = JSON.stringify(items_bbm, null, 2);
        container.insertAdjacentHTML('beforeend', `
            <table class="border-collapse border border-gray-400 table-fixed text-sm w-full">
                <colgroup>
                    <col class="w-[110px]">
                    <col class="w-[110px]">
                    <col class="w-[160px]">
                </colgroup>

                <thead class="bg-gray-100">
                    <tr>
                        <th class="border border-gray-300 text-left">Jenis BBM</th>
                        <th class="border border-gray-300 text-right">Harga/Liter</th>
                        <th class="border border-gray-300 text-right">Jumlah Liter</th>
                    </tr>
                </thead>

                <tbody>
                    <td class="border border-gray-300 whitespace-normal break-words text-justify">
                        ${jenis_bbm}
                    </td>
                    <td class="border border-gray-300 text-right whitespace-normal break-words">${formatCurrency(harga_liter)}</td>
                    <td class="border border-gray-300 text-right whitespace-normal break-words">${jumlah_liter}</td>
                </tbody>
            </table>
        `);
    }else{
        if(items.length>0){
            const container = document.getElementById('item_list');
            container.innerHTML = ''; // kosongkan dulu
            document.getElementById('Note').value = JSON.stringify(items, null, 2);
            let rows = '';

            items.forEach((i, index) => {
                rows += `
                    <tr>
                        <td class="border border-gray-300 text-center">${index + 1}</td>
                        <td class="border border-gray-300 whitespace-normal break-words text-justify">
                            ${i.description}
                        </td>
                        <td class="border border-gray-300 text-right">${i.qty}</td>
                        <td class="border border-gray-300 text-right">${formatCurrency(i.unit_price)}</td>
                        <td class="border border-gray-300 text-right">${formatCurrency(i.subtotal)}</td>
                    </tr>
                `;
            });

            container.insertAdjacentHTML('beforeend', `
                <table class="border-collapse border border-gray-400 table-fixed text-sm w-full">
                    <colgroup>
                        <col class="w-[50px]">
                        <col class="w-[370px]">
                        <col class="w-[110px]">
                        <col class="w-[110px]">
                        <col class="w-[160px]">
                    </colgroup>

                    <thead class="bg-gray-100">
                        <tr>
                            <th class="border border-gray-300">No</th>
                            <th class="border border-gray-300 text-left">Description</th>
                            <th class="border border-gray-300 text-right">Qty</th>
                            <th class="border border-gray-300 text-right">Unit Price</th>
                            <th class="border border-gray-300 text-right">Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `);
        }else{
            document.getElementById('Note').value = '';
        }
    }
    

    document.getElementById('Bruto').value = pajak+total;
    document.getElementById('Pajak').value = pajak;
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
function mergeLinesByY2(lines, tolerance = 40){

    const rows = [];

    for(const line of lines){

        const y = line.MinTop;

        let row = rows.find(r => Math.abs(r.y - y) < tolerance);

        if(!row){
            row = { y, words: [] };
            rows.push(row);
        }

        row.words.push(...line.Words);
    }

    return rows;
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
function parseItemsFromLines(lines){

    const items = [];
    let currentItem = null;
    for(const line of lines){
        const cleanLine = line.trim();
        if(/payment\s*terms/i.test(cleanLine)){
            if(currentItem){
                items.push(currentItem);
            }
            break;
        }
        const item = parseItemLine2(cleanLine);

        if(item){

            // simpan item sebelumnya
            if(currentItem){
                items.push(currentItem);
            }

            currentItem = item;

        }else{

            // jika bukan item → kemungkinan lanjutan description
            if(currentItem){
                currentItem.description += " " + line.trim();
            }

        }
    }

    return items;
}
function parseItemLine2(line) {

    // blacklist teks NON ITEM
    if (
        /JL\.|RT|RW|KEL|KEC|KOTA|KAB|NPWP|LAYANAN|CALL|SMS|TELP|WWW|HTTP/i.test(line)
    ) return null;

    const match = line.match(
        /^\s*(.+?)\s+(\d+(?:\.\d+)?)\s+([\d,.]+)\s+([\d,.]+)\s*%?\s*(?:([\d,.]+))?\s*Rp?\s*([\d,.]+)\s*$/
    );

    if (!match) return null;
    const description = match[1].trim();
    const qty = Number(match[2]);
    const unit_price = Number(match[3].replace(/\D/g, ''));
    const disc = Number(match[4]);
    const taxes = match[5]
        ? Number(match[5].replace(/,/g,''))
        : 0;
    const subtotal = Number(
        match[6].replace(/,/g,'')
    );
    return {
        description,
        qty,
        unit_price,
        disc,
        taxes,
        subtotal
    };
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

    const description = match[1].trim();
    const qty = Number(match[2]);
    const unit_price = Number(match[3].replace(/\D/g, ''));
    const subtotal = Number(match[4].replace(/\D/g, ''));

    // VALIDASI LOGIKA
    if (qty <= 0 || qty > 99) return null;
    if (unit_price < 1000) return null;
    if (subtotal !== qty * unit_price) return null;

    return {
        description,
        qty,
        unit_price,
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
    const bruto = document.getElementById('Bruto').value;
    const tax = document.getElementById('Pajak').value;
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
    formData.append('bruto', bruto);
    formData.append('tax', tax);
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

        successModal.classList.remove('hidden');
        document.getElementById('textSuccess').textContent = 'Data berhasil disimpan';
        clearForm();
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
let rawData = [];
const formatCurrency = (value) => {
    if (value == null) return "-";
    return "Rp." + new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
};
function loadProducts() {
    fetch(`${__API_URL__}/module/expense`)
    .then(res => res.json())
    .then(data => {
        console.log(data);
        if ($.fn.DataTable.isDataTable('#productTable')) {
            $('#productTable').DataTable().clear().destroy();
        }
        // siapkan array untuk DataTables
        
        const tableData = data.map((product, index) => {
            let name = product.name;
            let notes = product.note;
            if (typeof notes === "string") {
                notes = JSON.parse(notes);
            }
            let noteList = "";
            if (Array.isArray(notes)) {
                const limited = notes.slice(0,3);
                if(name==='PERTAMINA'){
                    noteList = `
                    <div class="note-cell">
                        <ul style="padding-left:1px;margin:0">
                            ${limited.map((n, i) => `<li>${i + 1}. ${n.jenis_bbm} ${n.jumlah_liter} liter</li>`).join("")}
                        </ul>
                    </div>
                    `;
                }else{
                    noteList = `
                    <div class="note-cell">
                        <ul style="padding-left:1px;margin:0">
                            ${limited.map((n, i) => `<li>${i + 1}. ${n.description}</li>`).join("")}
                        </ul>
                    </div>
                    `;
                }

                if (notes.length > 3) {
                    noteList += `<small>+${notes.length - 3} more</small>`;
                }
            }
            const date = new Date(product.date);

            const formatted = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            return [
                index + 1,
                product.id,
                renderReceiptImage(product.receipt_attachment),
                product.name,
                formatted,
                noteList,
                formatCurrency(product.amount),
                product.sender
            ];
        });

        // Inisialisasi DataTable
        const table = $("#productTable").DataTable({
            data: tableData,
            scrollX: true,              // 🔥 PENTING
            autoWidth: false,
            columns: [
                { title: "No" },
                { title: "ID" },
                { title: "Image" },
                { title: "Name" },
                { title: "Date" },
                { title: "Item List" },
                { title: "Amount" },
                { title: "Sender" }
            ],
            columnDefs: [
                { targets: 1, visible: false },
                { targets: 4, width: "340px" } // kolom Note
            ]
        });
        $('#productTable tbody').on('click', 'tr', function () {
            const rowData = table.row(this).data();
            if (!rowData) return;

            // ambil ID
            const productId = rowData[1];

            // cari data asli
            const product = data.find(p => p.id == productId);
            if (!product) return;

            fillFormFromTable(product);
        });
        $('#productTable tbody').on('click', 'tr', function () {
            $('#productTable tbody tr').removeClass('selected');
            $(this).addClass('selected');
            scanBtn.classList.add('hidden')
        });
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
    const ext = filename.split('.').pop().toLowerCase();
    let imageUrl='';
    if(ext === 'pdf'){
        imageUrl = `${__API_URL__}/uploads/pdf_icon.png`;
        return `
            <img 
                src="${imageUrl}" alt="Receipt"= class="size-9"
            />
        `;
    }else{
        imageUrl = `${__API_URL__}/uploads/${filename}`;
        return `
            <img 
                src="${imageUrl}" 
                alt="Receipt"
                class="w-16 h-16 object-cover rounded cursor-pointer"
                onclick="openImageModal('${imageUrl}')"
            />
        `;
    }

    
}
function fillFormFromTable(product) {
    // Isi form
    document.getElementById('Toko').value = product.name;
    document.getElementById('label_toko').innerHTML=': '+product.name;
    document.getElementById('Date').value = product.date;
    const date = new Date(product.date);

    const formatted = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('label_date').innerHTML=': '+formatted;
    document.getElementById('Total').value = formatCurrency(product.amount);
    document.getElementById('label_bruto').innerHTML=': '+formatCurrency(product.bruto);
    document.getElementById('Pajak').value = product.tax===null?'':product.tax;
    document.getElementById('label_pajak').innerHTML=': '+formatCurrency(product.tax);
    document.getElementById('Bruto').value = product.bruto===null?'':product.bruto;
    document.getElementById('label_total').innerHTML=': '+formatCurrency(product.bruto);
    document.getElementById("clearButton").hidden = false;
    document.getElementById("nama_toko").hidden = false;
    document.getElementById("date_text").hidden = false;
    document.getElementById("note_text").hidden = false;
    document.getElementById("bruto_text").hidden = false;
    document.getElementById("pajak_text").hidden = false;
    document.getElementById("netto_text").hidden = false;
    document.getElementById("nama_empty").hidden = true;
    document.getElementById("submitButton").hidden = true;
    document.getElementById('file').classList.add('hidden');

    // Preview image
    const fileName = product.receipt_attachment;
    if(fileName){

        const ext = fileName.split('.').pop().toLowerCase();

        if(ext === 'pdf'){
            const previewPdf = document.getElementById('previewPdf');
            previewPdf.src = `${__API_URL__}/uploads/${product.receipt_attachment}`;
            previewPdf.classList.remove('hidden');
            preview.classList.add('hidden');
        }else{
            const preview = document.getElementById('preview');
            preview.src = `${__API_URL__}/uploads/${product.receipt_attachment}`;
            preview.classList.remove('hidden');
            previewPdf.classList.add('hidden');
        }
    }
    
    let items_bbm=[];
    if(product.name==='PERTAMINA'){
        const container = document.getElementById('item_list');
        container.innerHTML = ''; // kosongkan dulu
        
        let jenis_bbm = product.note[0].jenis_bbm;
        let harga_liter = product.note[0].harga_liter;
        let jumlah_liter = product.note[0].jumlah_liter;
        document.getElementById('Note').value = JSON.stringify(items_bbm, null, 2);
        container.insertAdjacentHTML('beforeend', `
            <table class="border-collapse border border-gray-400 table-fixed text-sm w-full">
                <colgroup>
                    <col class="w-[110px]">
                    <col class="w-[110px]">
                    <col class="w-[160px]">
                </colgroup>

                <thead class="bg-gray-100">
                    <tr>
                        <th class="border border-gray-300 text-left">Jenis BBM</th>
                        <th class="border border-gray-300 text-right">Harga/Liter</th>
                        <th class="border border-gray-300 text-right">Jumlah Liter</th>
                    </tr>
                </thead>

                <tbody>
                    <td class="border border-gray-300 whitespace-normal break-words text-justify">
                        ${jenis_bbm}
                    </td>
                    <td class="border border-gray-300 text-right whitespace-normal break-words">${formatCurrency(harga_liter)}</td>
                    <td class="border border-gray-300 text-right whitespace-normal break-words">${jumlah_liter}</td>
                </tbody>
            </table>
        `);
    }else{
        console.log(product.note);
        if(product.note.length>0){
            const container = document.getElementById('item_list');
            container.innerHTML = ''; // kosongkan dulu
            document.getElementById('Note').value = JSON.stringify(product.note, null, 2);
            let rows = '';

            product.note.forEach((i, index) => {
                rows += `
                    <tr>
                        <td class="border border-gray-300 text-center">${index + 1}</td>
                        <td class="border border-gray-300 whitespace-normal break-words text-justify">
                            ${i.description}
                        </td>
                        <td class="border border-gray-300 text-right">${i.qty}</td>
                        <td class="border border-gray-300 text-right">${formatCurrency(i.unit_price)}</td>
                        <td class="border border-gray-300 text-right">${formatCurrency(i.subtotal)}</td>
                    </tr>
                `;
            });

            container.insertAdjacentHTML('beforeend', `
                <table class="border-collapse border border-gray-400 table-fixed text-sm w-full">
                    <colgroup>
                        <col class="w-[50px]">
                        <col class="w-[340px]">
                        <col class="w-[110px]">
                        <col class="w-[110px]">
                        <col class="w-[110px]">
                    </colgroup>

                    <thead class="bg-gray-100">
                        <tr>
                            <th class="border border-gray-300">No</th>
                            <th class="border border-gray-300 text-left">Description</th>
                            <th class="border border-gray-300 text-right">Qty</th>
                            <th class="border border-gray-300 text-right">Unit Price</th>
                            <th class="border border-gray-300 text-right">Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `);
        }else{
            document.getElementById('Note').value = '';
        }
    }
}
document.getElementById('clearButton').addEventListener('click', () => {
    clearForm();
});
function clearForm() {

    // reset input
    
    document.getElementById('label_toko').innerHTML='';
    document.getElementById('label_date').innerHTML='';
    document.getElementById('label_bruto').innerHTML='';
    document.getElementById('label_pajak').innerHTML='';
    document.getElementById('label_total').innerHTML = '';
    document.getElementById('Toko').value='';
    document.getElementById('Date').value='';
    document.getElementById('Note').value='';
    document.getElementById('Bruto').value='';
    document.getElementById('Pajak').value='';
    document.getElementById('Total').value='';
    document.getElementById('item_list').innerHTML = '';
    
    document.getElementById("nama_toko").hidden = true;
    document.getElementById("date_text").hidden = true;
    document.getElementById("note_text").hidden = true;
    document.getElementById("bruto_text").hidden = true;
    document.getElementById("pajak_text").hidden = true;
    document.getElementById("netto_text").hidden = true;
    document.getElementById("nama_empty").hidden = false;
    document.getElementById("clearButton").hidden = true;
    document.getElementById('file').classList.remove('hidden');

    // reset file input
    const fileInput = document.getElementById('file');
    fileInput.value = '';
    fileInput.disabled = false;

    // hide preview
    const preview = document.getElementById('preview');
    preview.src = '';
    preview.classList.add('hidden');

    const previewPdf = document.getElementById('previewPdf');
    previewPdf.src = '';
    previewPdf.classList.add('hidden');

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