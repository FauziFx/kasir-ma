// ==========================================
// STATE & GLOBAL VARIABLES
// ==========================================
let modalSplitBill = new bootstrap.Modal($("#modal-split-bill"));
let myModalSplitBill = document.getElementById("modal-split-bill");

// ==========================================
// LOGIC (Manajemen Data & State)
// ==========================================

// Fungsi cek cart bisa split atau tidak
function canSplitBill() {
  const rawCart = localStorage.getItem("cart");
  if (!rawCart) return false;

  const cart = JSON.parse(rawCart);

  // Hitung total seluruh Qty yang ada di keranjang
  const totalQty = cart.reduce((total, item) => total + Number(item.qty), 0);

  // Tombol Split Bill HANYA AKTIF jika total Qty lebih besar dari 1
  return totalQty > 1;
}

// Fungsi hitung total belanjaan yang dicentang di modal split bill
function calculateSplitTotal() {
  let totalSplit = 0;

  // Ambil data keranjang asli untuk tahu harga produknya
  const dataCart = JSON.parse(localStorage.getItem("cart")) || [];

  // Looping setiap checkbox yang dicentang saja
  $(".checkbox-split:checked").each(function () {
    // Ambil index (0, 1, 2, dst) dari checkbox yang sedang aktif
    const index = $(this).data("index");

    // Ambil data item asli dari array berdasarkan index
    const originalItem = dataCart[index];

    if (originalItem) {
      // Cari input qty split yang pasangannya satu baris (berdasarkan index)
      const qtyToSplit = Number($(`#input-qty-split-${index}`).val());
      const price = Number(originalItem.price);

      // Tambahkan ke total split
      totalSplit += qtyToSplit * price;
    }
  });
  $("#btn-submit-split-bill").attr("disabled", totalSplit === 0);
  // Tampilkan hasil akhirnya ke judul modal split kamu
  $("#modal-split-bill-title").html(formatRupiah(totalSplit));
}

// Fungsi menampilaknlist item pada modal split bill
function showListSplitItem() {
  let html = "";
  const dataCart = JSON.parse(localStorage.getItem("cart"));
  dataCart.forEach((item, index) => {
    html += `
      <div class="row align-items-center py-2 border-bottom border-light-subtle mx-0"> 
        
        <div class="col-6 px-0">
          <p class="mb-0 fw-semibold text-dark text-truncate" style="font-size: 0.9rem;">${item.productName}</p>
          <p class="mb-0 text-muted" style="font-size: 11px;">
            ${item.variantName} <span class="font-monospace">@${formatCurrency(item.price)}</span>
          </p>
          <p class="mb-0 fw-bold text-secondary mt-05" style="font-size: 13px;">
            ${formatRupiah(item.subtotal)}
          </p>
        </div>
        
        <div class="col-5 px-1">
          <div class="input-group input-group-sm">
            <button 
              class="btn btn-outline-dark border-secondary-subtle px-2 btn-increment-split btn-increment-${index}" 
              data-diff="-1" 
              data-index="${index}" 
              type="button"
              disabled
            >
              <i class="bi-dash-lg"></i>
            </button>
            
            <input 
              type="number" 
              class="form-control text-center fw-bold bg-light border-secondary-subtle px-0 input-split-qty" 
              id="input-qty-split-${index}" 
              value="${item.qty}" 
              min="1" 
              max="${item.qty}" 
              readonly
            >
            
            <button 
              class="btn btn-outline-dark border-secondary-subtle px-2 btn-increment-split btn-increment-${index}" 
              data-diff="1" 
              data-index="${index}" 
              type="button"
              disabled
            >
              <i class="bi-plus-lg"></i>
            </button>
          </div>
        </div>
        
        <div class="col-1 text-end px-0">
          <input 
            type="checkbox" 
            class="form-check-input checkbox-split shadow-sm border-secondary-subtle" 
            data-index="${index}"
            style="width: 1.3rem; height: 1.3rem; cursor: pointer;"
          >
        </div>

      </div>`;
  });

  $("#list-item-split-bill").html(html);

  calculateSplitTotal();
}
// ==========================================
// EVENT LISTENERS
// ==========================================

// Kosongkan cart split saat close modal
myModalSplitBill.addEventListener("hidden.bs.modal", function () {
  localStorage.removeItem("cartSplitSession");
});

// Kosongkan cart split saat pertama kali di muat
$(document).ready(function () {
  localStorage.removeItem("cartSplitSession");
});

// Event: klik tombol SPLIT BILL dibawah keranjang
$(document).on("click", "#btn-split-bill", function () {
  if (!canSplitBill()) return;

  showListSplitItem();
  modalSplitBill.show();
});

// Jalankan fungsi hitung setiap kali kasir klik checkbox atau ubah qty split
$(document).on("change", ".checkbox-split", function () {
  const index = $(this).data("index");
  const isChecked = $(this).prop("checked");

  const dataCart = JSON.parse(localStorage.getItem("cart")) || [];
  const maxQty = dataCart[index] ? dataCart[index].qty : 1;
  const currentQty = Number($(`#input-qty-split-${index}`).val());

  if (isChecked) {
    // Jika dicentang, hidupkan tombol dengan melihat syarat angka saat ini
    $(`.btn-increment-${index}[data-diff="-1"]`).prop(
      "disabled",
      currentQty <= 1,
    );
    $(`.btn-increment-${index}[data-diff="1"]`).prop(
      "disabled",
      currentQty >= maxQty,
    );
  } else {
    // Jika centangan dilepas, matikan paksa kedua tombol (+ dan -) di baris tersebut
    $(`.btn-increment-${index}`).prop("disabled", true);
  }
  calculateSplitTotal();
});

// Event: klik tombol INCREMENT qty item splitbill
$(document).on("click", ".btn-increment-split", function () {
  const index = $(this).data("index"); // Tahu baris mana yang diklik (0, 1, 2, dst)
  const diff = Number($(this).data("diff")); // Nilainya bisa 1 atau -1

  // 1. Ambil data cart asli untuk tahu batas maksimal qty barang tersebut
  const dataCart = JSON.parse(localStorage.getItem("cart")) || [];
  const maxQty = dataCart[index] ? dataCart[index].qty : 1;

  // 2. Ambil elemen input qty yang satu baris dengannya
  const inputEl = $(`#input-qty-split-${index}`);
  let currentQty = Number(inputEl.val());

  // 3. Hitung calon angka baru
  let newQty = currentQty + diff;

  // Batasan Kurang: Jika kasir klik minus padahal angka sudah 1, BATALKAN!
  if (diff === -1 && currentQty <= 1) {
    return;
  }

  // Batasan Tambah: Jika kasir klik plus padahal angka sudah maksimal, BATALKAN!
  if (diff === 1 && currentQty >= maxQty) {
    return;
  }

  // 4. Jika lolos validasi, update angka di kotak input HTML
  inputEl.val(newQty);

  // 5. Atur status tombol mati/hidup secara real-time setelah angka berubah
  // Matikan tombol minus jika angka baru sudah menyentuh 1
  $(`.btn-increment-${index}[data-diff="-1"]`).prop("disabled", newQty <= 1);

  // Matikan tombol plus jika angka baru sudah menyentuh batas maksimal cart
  $(`.btn-increment-${index}[data-diff="1"]`).prop(
    "disabled",
    newQty >= maxQty,
  );

  // 6. WAJIB: Hitung ulang total harga di title modal setelah qty berubah
  calculateSplitTotal();
});

// Event Klik Submit PISAH BILL untuk menampilkan Modal Payment
$(document).on("click", "#btn-submit-split-bill", function () {
  let splitItems = [];
  // Ambil data keranjang asli untuk referensi objek barang
  const dataCart = JSON.parse(localStorage.getItem("cart")) || [];

  // 1. Loop hanya pada checkbox yang dicentang
  $(".checkbox-split:checked").each(function () {
    const index = $(this).data("index");
    const originalItem = dataCart[index];

    if (originalItem) {
      // Ambil qty yang tertera di baris tersebut
      const qtyToSplit = Number($(`#input-qty-split-${index}`).val());

      // 2. Buat objek item baru khusus untuk pecahan split ini
      splitItems.push({
        productid: originalItem.productid, // sesuaikan dengan key ID produkmu
        productName: originalItem.productName,
        variantId: originalItem.variantId,
        variantName: originalItem.variantName,
        price: Number(originalItem.price),
        qty: qtyToSplit,
        subtotal: qtyToSplit * Number(originalItem.price), // Subtotal baru khusus split
      });
    }
  });

  // ==========================================
  // JALANKAN VALIDASI (LOGIKA UTAMA)
  // ==========================================

  // JIKA LOLOS: Simpan ke session sementara sebagai tanda "Mode Split Sedang Aktif"
  localStorage.setItem("cartSplitSession", JSON.stringify(splitItems));

  // 3. Alihkan Layar ke Proses Pembayaran
  modalListBill.hide(); // Tutup modal split (sesuaikan nama variabel modal splitmu)

  // Panggil fungsi pembayaran yang sudah kamu buat sebelumnya
  showPaymentModal();
});
