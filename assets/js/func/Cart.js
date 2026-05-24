// ==========================================
// 1. RENDERER (Fungsi khusus Gambar UI)
// ==========================================

function getCart() {
  // Ambil data dari localstorage
  const rawCart = localStorage.getItem("cart");

  if (!rawCart) {
    $("#cart-list").html(
      '<p class="text-muted small text-center">Keranjang kosong</p>',
    );
    $("#cart-total").text("Rp0");
    return;
  }

  const items = JSON.parse(rawCart);

  // Hitung total keseluruhan
  const grandTotal = items.reduce(
    (total, item) => total + Number(item.subtotal),
    0,
  );

  // Buat HTML string
  let htmlContent = "";
  items.forEach((item, index) => {
    htmlContent += `
            <div class="cart-item pt-2" data-index="${index}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-0 text-dark">${item.productname}</h6>
                        <span class="text-muted">${item.variantname}</span>
                    </div>
                    <!-- TOMBOL HAPUS: Simpan variantid dan price di data-attribute -->
                    <button 
                        type="button" 
                        class="btn-delete-cart-item btn btn-sm btn-link text-danger p-1 px-2 border-0"
                        data-index="${index}"
                    >
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="d-flex justify-content-between text-muted small mt-1">
                    <span>${item.qty} x ${item.price}</span>
                    <strong>${formatRupiah(item.subtotal)}</strong>
                </div>
            </div>
            <hr class="my-1">
        `;
  });

  // Tampilkan ke layar
  $("#cart-list").html(htmlContent);
  $("#cart-total").text(formatRupiah(grandTotal));
}

// ==========================================
// 2. EVENT LISTENERS
// ==========================================

// Render halaman saat pertama dimuat
$(document).ready(function () {
  getCart();
});

// Event: Klik item keranjang untuk EDIT
$(document).on("click", ".cart-item", function (e) {
  // Cegah trigger jika yang diklik adalah tombol hapus di dalamnya
  if ($(e.target).closest(".btn-delete-cart-item").length) return;

  const index = $(this).data("index");
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const selectedCartItem = cart[index];

  if (!selectedCartItem) return;

  // 1. Ubah teks tombol modal
  $("#btn-add-to-cart").text("Simpan");

  // 2. Tampilkan Detail Produk
  showProductDetail(selectedCartItem.productid);

  // 3. Set nilai varian aktif dan update transaksi modal (menunggu render DB selesai)
  setTimeout(() => {
    // Cari tombol varian di dalam modal yang variantid-nya cocok
    const variantButton = $(
      `.btn-variant-choice[data-variantid="${selectedCartItem.variantid}"]`,
    );

    if (variantButton.length > 0) {
      variantButton.addClass("active");
    }

    // Sinkronisasi state transaksi modal
    updateActiveTransaction({
      cartIndex: index,
      productid: selectedCartItem.productid,
      productname: selectedCartItem.productname,
      variantid: selectedCartItem.variantid,
      variantname: selectedCartItem.variantname,
      price: Number(selectedCartItem.price),
      qty: Number(selectedCartItem.qty),
    });
  }, 150); // Jeda 150ms aman untuk proses asinkronus IndexedDB
});

// Event: Klik tombol HAPUS item
$(document).on("click", ".btn-delete-cart-item", function () {
  const targetIndex = $(this).data("index");
  let currentCart = JSON.parse(localStorage.getItem("cart")) || [];

  // Potong array berdasarkan index tombol
  currentCart.splice(targetIndex, 1);

  // Simpan atau bersihkan localstorage
  if (currentCart.length > 0) {
    localStorage.setItem("cart", JSON.stringify(currentCart));
  } else {
    localStorage.removeItem("cart"); // Jika keranjang kosong melompong, hapus key-nya sekalian
  }

  // Render Cart
  getCart();
});
