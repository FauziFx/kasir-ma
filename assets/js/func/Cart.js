// ==========================================
// 1. STATE & GLOBAL VARIABLES
// ==========================================
let modalListCustomers = new bootstrap.Modal($("#modal-list-customers"));
let modalActiveCustomers = new bootstrap.Modal($("#modal-active-customer"));

// ==========================================
// 2. RENDERER (Fungsi khusus Gambar UI)
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

function getCustomers() {
  const transaction = db.transaction(["customers"], "readonly");
  const storeCust = transaction.objectStore("customers");
  let html = "";

  storeCust.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const customer = cursor.value;
      html += `<tr>
                <td>${customer.name} | <span class="text-secondary">${customer.transactionType.name}</span></td>
                <td class="text-end">
                  <button
                    data-id='${customer.id}'
                    class="btn btn-dark btn-sm btn-customer-choice">Pilih</button></td>
              </tr>`;
      cursor.continue();
    } else {
      $("#list-customers").html(html);
      modalListCustomers.show();
    }
  };
}

function getActiveCustomer() {
  const rawCustomer = localStorage.getItem("customer");
  if (!rawCustomer) return;

  const dataCustomer = JSON.parse(rawCustomer);

  $("#active-customer").html(dataCustomer.name);
  modalActiveCustomers.show();
}

// ==========================================
// 3. EVENT LISTENERS
// ==========================================

// Render halaman saat pertama dimuat
$(document).ready(function () {
  getCart();

  const savedCustomer = JSON.parse(localStorage.getItem("customer"));
  $("#customer-name").html(savedCustomer ? savedCustomer.name : "+ Pelanggan");
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

// Event: Klik tambah pelanggan (Toggle Modal)
$(document).on("click", "#customer-name", function () {
  if (localStorage.getItem("customer")) {
    getActiveCustomer();
  } else {
    getCustomers();
  }
});

// Event: Pilih customer
$(document).on("click", ".btn-customer-choice", function () {
  const customerId = $(this).data("id");

  const transaction = db.transaction(["customers"], "readonly");
  const storeCust = transaction.objectStore("customers");
  const request = storeCust.get(customerId);

  request.onsuccess = function (e) {
    const customerObj = e.target.result;
    if (!customerObj) return;

    const obj = {
      id: customerObj.id,
      name: customerObj.name,
      include_revenue: customerObj.include_revenue,
      transactionTypeId: customerObj.transactionTypeId,
    };

    localStorage.setItem("customer", JSON.stringify(obj));
    $("#customer-name").html(obj.name);

    modalListCustomers.hide();
  };
});

// Event: Hapus customer dari transaksi
$(document).on("click", "#btn-remove-customer", function () {
  modalActiveCustomers.hide();
  localStorage.removeItem("customer");
  $("#customer-name").html("+ Pelanggan");
  getCustomers();
});
