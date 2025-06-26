let daftarBarang = [];
let total = 0;
let riwayat = [];
let indexTransaksiEdit = null;
let editBarang = [];
let modeHapusBarang = false;
let kategoriFilter = "";

window.onload = function() {
    loadDariStorage();
    tampilkanHalaman('belanja');
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("service-worker.js")
      .then(reg => console.log("Service Worker registered:", reg.scope))
      .catch(err => console.log("SW registration failed:", err));
  });
}

function tambahBarang(){
    let nama = document.getElementById("namaBarang").value;
    let harga = parseInt(document.getElementById("hargaBarang").value);
    let kategori = document.getElementById("kategoriBarang").value;

    if (!nama || isNaN(harga) || !kategori) {
        alert("Semua kolom wajib diisi!");
        return;
    }

    daftarBarang.push({ nama, harga, kategori, jumlah: 0 });
    tampilkanBarang();
    simpanKeStorage();

    document.getElementById('namaBarang').value = '';
    document.getElementById('hargaBarang').value = '';
    document.getElementById('kategoriBarang').value = '';    
}

function tampilkanBarang(){
    let container = document.getElementById("daftarBarang");
    container.innerHTML = "";

    let kelompok = {};

    daftarBarang.forEach((barang, index) => {
        if (!kelompok[barang.kategori]) {
            kelompok[barang.kategori] = [];
        }
        kelompok[barang.kategori].push({ ...barang, index});
    });

    let kategoriDitampilkan = kategoriFilter ? [kategoriFilter] : Object.keys(kelompok);

    kategoriDitampilkan.forEach((kategori) => {
        if (!kelompok[kategori]) return;
        let judul = document.createElement("h3");
        judul.innerText = `${kategori}`;
        container.appendChild(judul);

        let ul = document.createElement("ul");

        kelompok[kategori].forEach((barang) => {
            let item = document.createElement("li");
            item.innerHTML = `
            <span>${barang.nama}</span>
            <span>Rp${barang.harga}</span>
            ${modeHapusBarang ? `<button onclick = "hapusDariKatalog(${barang.index})">Hapus</button>` : ''}
            `;
            item.style.cursor = "pointer";
            item.onclick = (e) => {
                if (e.target.tagName === "BUTTON") return;
                tambahKeTotal(barang.index);
            }
            ul.appendChild(item);
        });
        container.appendChild(ul);
    });
}

function tambahKeTotal(index){
    daftarBarang[index].jumlah += 1;
    total += daftarBarang[index].harga;

    document.getElementById("totalHarga").innerText = total;
    tampilkanDaftarBelanja();
}

function tampilkanDaftarBelanja() {
    let list = document.getElementById("daftarBelanja");
    list.innerHTML = "";

    daftarBarang.forEach((barang, index) => {
        if (barang.jumlah > 0) {
            let item = document.createElement("li");

            item.innerHTML = `
            <div class="atas">
                <span class="nama-barang">${barang.nama}</span>
                <span class="harga-barang">= Rp${barang.harga * barang.jumlah}</span>
            </div>
            <div class="bawah">
                <span class="jumlah-control">
                    <button onclick="kurangiBarang(${index})">-</button>
                    <span>${barang.jumlah}</span>
                    <button onclick="tambahKeTotal(${index})">+</button>
                </span>
                <button class="hapus-btn" onclick="hapusBarang(${index})">Hapus</button>
            </div>
            `;

            list.appendChild(item);
        }
    });
}

function hapusDariKatalog(index) {
    daftarBarang.splice(index, 1);

    tampilkanBarang();
    tampilkanBarang();
    simpanKeStorage();
}

function kurangiBarang(index) {
    if (daftarBarang[index].jumlah > 0) {
        daftarBarang[index].jumlah -=1;
        total -= daftarBarang[index].harga;
        if (daftarBarang[index].jumlah === 0){

        }
        document.getElementById("totalHarga").innerText = total;
        tampilkanDaftarBelanja();
    }
}

function hapusBarang(index) {
    total -= daftarBarang[index].harga * daftarBarang[index].jumlah;
    daftarBarang[index].jumlah = 0;
    document.getElementById("totalHarga").innerText = total;
    tampilkanDaftarBelanja();
}

function simpanTransaksi() {
    let nama = document.getElementById("namaPelanggan").value;

    if(!nama || total === 0) {
        alert("ini nama pelanggan dan pastikan ada transaksi.");
        return;
    }

    let items = daftarBarang
        .filter(barang => barang.jumlah > 0)
        .map(barang => ({
            nama: barang.nama,
            harga: barang.harga,
            jumlah: barang.jumlah,
            kategori: barang.kategori
        }));

    let transaksi = {
        nama,
        items,
        total
    };

    riwayat.push(transaksi);
    tampilkanRiwayat();

    daftarBarang.forEach(barang => barang.jumlah = 0);
    total = 0;
    document.getElementById("totalHarga").innerText = total;
    document.getElementById("namaPelanggan").value = '';
    tampilkanDaftarBelanja();
    simpanKeStorage();
}

function tampilkanRiwayat() {
    let container = document.getElementById("riwayatTransaksi");
    container.innerHTML = "";

    riwayat.forEach((trx, index) => {
        let card = document.createElement("div");
        card.className = "kartu-riwayat";

        let header = `
          <div class="riwayat-header">
            <span class="riwayat-nama">Nama: ${trx.nama}</span>
            <span class="riwayat-total">Total: <b>Rp${trx.total}</b></span>
          </div>
        `;

        let isiTabel = `
          <table class="tabel-barang-riwayat">
            <tbody>
        `;
        trx.items.forEach(item => {
            isiTabel += `
              <tr>
                <td>${item.nama}</td>
                <td class="x-marker">&times;</td>
                <td>${item.jumlah}</td>
                <td>= Rp${item.harga * item.jumlah}</td>
              </tr>
            `;
        });
        isiTabel += `
            </tbody>
          </table>
        `;

        let actions =`
            <div class="riwayat-actions">
                <button class="edit-btn" onclick="editTransaksi(${index})">Edit</button>
                <button class="hapus-btn" onclick="hapusTransaksi(${index})">Hapus</button>
            </div>
        `;

        card.innerHTML = header + isiTabel + actions;
        container.appendChild(card);
    });
}

function editTransaksi(index) {
    indexTransaksiEdit = index;
    const trx = riwayat[index];

    document.getElementById('editNamaPelanggan').value = trx.nama;
    editBarang = trx.items.map(item => ({ ...item}));

    tampilkanEditDaftarBelanja();
    tampilkanKatalogEdit();
    document.getElementById('editTotalHarga').innerText = hitungTotalEdit();

    tampilkanHalaman('edit');
}

function tampilkanEditDaftarBelanja() {
  let container = document.getElementById('editDaftarBelanja');
  if (!editBarang.length) {
    container.innerHTML = '<div style="text-align:center;color:#c99;">Tidak ada barang</div>';
    return;
  }
  let html = '';
  editBarang.forEach((item, i) => {
    html += `
      <div class="edit-barang-card">
        <div class="atas-edit">
          <span class="nama-barang-edit">${item.nama}</span>
          <span class="harga-barang-edit">= Rp${item.harga * item.jumlah}</span>
        </div>
        <div class="bawah-edit">
          <button class="edit-qty-btn" onclick="kurangiEditBarang(${i})">-</button>
          <span class="jumlah-barang">${item.jumlah}</span>
          <button class="edit-qty-btn" onclick="tambahEditBarang(${i})">+</button>
          <button class="hapus-barang-btn" onclick="hapusEditBarang(${i})">Hapus</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function tambahEditBarang(idx) {
    editBarang[idx].jumlah++;
    tampilkanEditDaftarBelanja();
    document.getElementById('editTotalHarga').innerText = hitungTotalEdit();
}

function kurangiEditBarang(idx) {
    if (editBarang[idx].jumlah > 1) {
        editBarang[idx].jumlah--;
    } else {
        editBarang.splice(idx, 1);
    }
    tampilkanEditDaftarBelanja();
    document.getElementById('editTotalHarga').innerText = hitungTotalEdit();
}

function hapusEditBarang(idx) {
    editBarang.splice(idx, 1);
    tampilkanEditDaftarBelanja();
    tampilkanKatalogEdit();
}

function hitungTotalEdit() {
    return editBarang.reduce((t, b) => t + b.harga * b.jumlah, 0);
}

function simpanEditTransaksi() {
    if (indexTransaksiEdit === null) return;
    const nama = document.getElementById('editNamaPelanggan').value;
    riwayat[indexTransaksiEdit] = {
        nama: nama,
        items: editBarang.map(item => ({ ...item})),
        total : hitungTotalEdit()
    };
    indexTransaksiEdit = null;
    tampilkanHalaman('riwayat');
    tampilkanBarang();
    tampilkanRiwayat();
    tampilkanDaftarBelanja();
    simpanKeStorage();
}

function toggleModeHapusBarang() {
  modeHapusBarang = !modeHapusBarang;
  const btn = document.getElementById("btnModeHapusBarang");
  if (modeHapusBarang) {
    btn.classList.add("on");
  } else {
    btn.classList.remove("on");
  }
  tampilkanBarang();
}

function tampilkanKatalogEdit() {
    let container = document.getElementById("katalogEditNota");
    container.innerHTML = "<h3>Tambah Barang dari Katalog</h3>";
    let kelompok = {};
    daftarBarang.forEach(barang => {
        const sudahAda = editBarang.find(b => b.nama === barang.nama && b.kategori === barang.kategori);
        if (!sudahAda) {
            if (!kelompok[barang.kategori]) {
                kelompok[barang.kategori] = [];
            }
            kelompok[barang.kategori].push(barang);
        }
    });

    for (let kategori in kelompok) {
        let judul = document.createElement("h4");
        judul.innerText = kategori;
        container.appendChild(judul);

        kelompok[kategori].forEach((barang) => {
            let btn = document.createElement("button");
            btn.textContent = `${barang.nama} (+)`;
            btn.className = "katalog-barang-btn";
            btn.onclick = function() {
                tambahBarangBaruKeEditNota(barang);
            };
            container.appendChild(btn);
        });
    }
}

function tambahBarangBaruKeEditNota(barang) {
    editBarang.push({
        nama: barang.nama,
        harga: barang.harga,
        jumlah: 1,
        kategori: barang.kategori
    });
    tampilkanEditDaftarBelanja();
    tampilkanKatalogEdit();
}

function hapusTransaksi(index) {
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
        riwayat.splice(index, 1);
        tampilkanRiwayat();
        simpanKeStorage();
    }
}

function tampilkanHalaman(nama) {
    document.getElementById("halaman-belanja").style.display = (nama === "belanja") ? "block" : "none";
    document.getElementById("halaman-tambah").style.display = (nama === "tambah") ? "block" : "none";
    document.getElementById("halaman-edit").style.display = (nama === "edit") ? "block" : "none";
    document.getElementById("halaman-riwayat").style.display = (nama === "riwayat") ? "block" : "none";

    if (nama === "belanja") {
        tampilkanBarang();
        tampilkanDaftarBelanja();
    } else if (nama === "riwayat") {
        tampilkanRiwayat();
    }
}

function simpanKeStorage() {
    localStorage.setItem('daftarBarang', JSON.stringify(daftarBarang));
    localStorage.setItem('riwayat', JSON.stringify(riwayat));
}

function loadDariStorage() {
    let barang = localStorage.getItem('daftarBarang');
    let transaksi =  localStorage.getItem('riwayat');

    daftarBarang = barang ? JSON.parse(barang) : [];
    riwayat = transaksi ? JSON.parse(transaksi) : [];
}

function filterKategoriBarang() {
    kategoriFilter = document.getElementById("filterKategori").value;
    tampilkanBarang();
}

window.tampilkanHalaman = tampilkanHalaman;
window.tambahBarang = tambahBarang;
window.toggleModeHapusBarang = toggleModeHapusBarang;
window.simpanTransaksi = simpanTransaksi;
window.kurangiBarang = kurangiBarang;
window.tambahKeTotal = tambahKeTotal;
window.hapusBarang = hapusBarang;
window.editTransaksi = editTransaksi;
window.simpanEditTransaksi = simpanEditTransaksi;
window.kurangiEditBarang = kurangiEditBarang;
window.tambahEditBarang = tambahEditBarang;
window.hapusEditBarang = hapusEditBarang;
window.hapusDariKatalog = hapusDariKatalog;
window.hapusTransaksi = hapusTransaksi;
window.filterKategoriBarang = filterKategoriBarang;
