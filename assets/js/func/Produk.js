// ==========================================
// 1. STATE & GLOBAL VARIABLES
// ==========================================
let currentCategoryId = null;
const modalProduct = new bootstrap.Modal($("#modal-product"));

// Satukan variabel modal yang saling berhubungan ke dalam satu Objek State
let activeTransaction = {
  cartIndex: null,
  productId: null,
  productName: "",
  variantId: null,
  variantName: "",
  price: 0,
  qty: 1,
  subtotal: 0,
};

// ==========================================
// 2. DATA LOADERS (IndexedDB)
// ==========================================

function showCategories() {
  const transaction = db.transaction(["categories"], "readonly");
  const storeCat = transaction.objectStore("categories");
  const el = $("#list-categories");
  el.html(`
          <button
            type="button"
            data-id=""
            data-name="Semua Produk"
            class="btn-categories btn btn-outline-dark rounded-0 active"
            data-bs-toggle="button"
          >
            Semua
          </button>
        `);

  storeCat.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const category = cursor.value;
      el.append(
        `<button 
          type="button" 
          data-id="${category.id}" 
          data-name="${category.name}" 
          class="btn-categories btn btn-outline-dark rounded-0" 
          data-bs-toggle="button"
        >
          ${category.name}
        </button>`,
      );
      cursor.continue();
    }
  };
}

function showProducts(categoryId = null, searchQuery = "") {
  const transaction = db.transaction(["products"], "readonly");
  const storeProd = transaction.objectStore("products");
  let source = categoryId
    ? storeProd.index("categoryId").openCursor(IDBKeyRange.only(categoryId))
    : storeProd.openCursor();

  let html = "";
  const query = searchQuery.toLowerCase();

  source.onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const product = cursor.value;
      if (query === "" || product.name.toLowerCase().includes(query)) {
        html += `<tr class="row-products" data-id="${product.id}">
                  <td class="py-3">${product.name}</td>
                </tr>`;
      }
      cursor.continue();
    } else {
      $("#list-products").html(html);
    }
  };
}

function showProductDetail(productId) {
  const transaction = db.transaction(["products"], "readonly");
  const storeProd = transaction.objectStore("products");
  const request = storeProd.get(productId);

  request.onsuccess = function (e) {
    const product = e.target.result;
    if (!product) {
      console.error("Produk tidak ditemukan di database lokal");
      return;
    }

    $("#modal-product-title").text(product.name);

    let variantHtml = "";
    const variants = product.variants || [];
    variants.sort((a, b) => Number(a.id) - Number(b.id));

    if (variants.length > 0) {
      variants.forEach((variant) => {
        // Menggunakan standard format data-attribute agar dibaca otomatis oleh jQuery .data()
        variantHtml += `<li class="nav-item col-6 px-1 mb-1" role="presentation">
                          <button
                            class="btn btn-outline-dark w-100 border border-dark py-2 btn-variant-choice"
                            type="button"
                            role="tab"
                            data-bs-toggle="tab"
                            data-productid="${product.id}"
                            data-variantid="${variant.id}"
                            data-productname="${product.name}"
                            data-variantname="${variant.name}"
                            data-price="${variant.price}">
                            ${variant.name}
                          </button>
                        </li>`;
      });
    } else {
      variantHtml = `<p class="text-muted small p-3">Produk ini tidak memiliki varian.</p>`;
    }

    $("#list-variants").html(variantHtml);
    modalProduct.show();
  };

  request.onerror = function () {
    console.error("Gagal mengambil detail produk");
  };
}

// ==========================================
// 3. CORE CART LOGIC & DOM SYNC
// ==========================================

// Fungsi Tunggal khusus sinkronisasi State ke Tampilan (DOM)
function syncModalUI() {
  const hasVariant = activeTransaction.variantId !== null;
  const isValidAmount =
    activeTransaction.qty > 0 && activeTransaction.price >= 0;

  // Render komponen teks & input
  $("#input-qty").val(activeTransaction.qty);
  $("#input-price").val(activeTransaction.price);
  $("#modal-variant-title").text(activeTransaction.variantName || "-");
  $("#modal-subtotal-title").html(formatRupiah(activeTransaction.subtotal));

  // Amankan tombol Add to Cart
  $("#btn-add-to-cart").prop("disabled", !(hasVariant && isValidAmount));
}

function updateActiveTransaction(changes) {
  // Gabungkan perubahan data baru ke state transaksi aktif
  activeTransaction = { ...activeTransaction, ...changes };

  // Hitung ulang subtotal murni berdasarkan state terbaru
  activeTransaction.subtotal = activeTransaction.qty * activeTransaction.price;

  // Perbarui tampilan layar
  syncModalUI();
}

function addToCart(cart, newItem, targetIndex = null) {
  // Amankan konversi tipe data angka demi konsistensi data storage
  const itemPrice = Number(newItem.price);
  const itemQty = Number(newItem.qty);

  // Mode Edit
  if (targetIndex !== null && targetIndex !== undefined) {
    cart[targetIndex] = {
      ...newItem,
      price: itemPrice,
      qty: itemQty,
      subtotal: itemPrice * itemQty,
    };

    delete cart[targetIndex].cartIndex;
    return cart;
  }

  // Model Tambah
  const existingItem = cart.find(
    (item) =>
      item.variantId === newItem.variantId && Number(item.price) === itemPrice,
  );

  if (existingItem) {
    existingItem.qty += itemQty;
    existingItem.subtotal = Number(existingItem.price) * existingItem.qty;
  } else {
    // Kloning objek agar tidak merusak state aktif UI
    cart.push({
      ...newItem,
      price: itemPrice,
      qty: itemQty,
      subtotal: itemPrice * itemQty,
    });
    delete cart[cart.length - 1].cartIndex;
  }

  return cart;
}

// ==========================================
// 4. EVENT LISTENERS
// ==========================================

// Reset total & kembalikan state transaksi ke default mutlak saat modal ditutup
const myModalProduct = document.getElementById("modal-product");
myModalProduct.addEventListener("hidden.bs.modal", function () {
  activeTransaction = {
    cartIndex: null,
    productId: null,
    productName: "",
    variantId: null,
    variantName: "",
    price: 0,
    qty: 1,
    subtotal: 0,
  };
  $(`#modal-product-title, #modal-variant-title, #modal-subtotal-title`).html(
    "",
  );
  syncModalUI();

  $("#btn-add-to-cart").text("Tambah");
});

// Pilih Varian produk
$(document).on("click", ".btn-variant-choice", function () {
  const data = $(this).data(); // Membaca: productid, variantid, productname, variantname, price

  updateActiveTransaction({
    productId: data.productid,
    productName: data.productname,
    variantId: data.variantid,
    variantName: data.variantname,
    price: Number(data.price),
    qty: activeTransaction.qty, // Reset qty menjadi 1 tiap ganti varian baru demi keamanan kasir
  });

  $("#container-variant").animate(
    {
      scrollTop: $("#container-variant")[0].scrollHeight,
    },
    "smooth",
  );
});

// Increment / Decrement Qty Buttons
$(document).on("click", ".btn-increment", function () {
  const diff = Number($(this).data("increment"));
  const targetQty = activeTransaction.qty + diff;

  if (targetQty > 0) {
    updateActiveTransaction({ qty: targetQty });
  }
});

// Mengubah kuantitas via input langsung
$(document).on("input keyup", "#input-qty", function () {
  const val = Number($(this).val());
  if (val > 0) {
    updateActiveTransaction({ qty: val });
  }
});

// Mengubah harga via input langsung (Khusus Open Price)
$(document).on("input keyup", "#input-price", function () {
  const val = Number($(this).val());
  if (val >= 0) {
    updateActiveTransaction({ price: val });
  }
});

// Simpan ke Keranjang Belanja
$(document).on("click", "#btn-add-to-cart", function () {
  let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
  let updateCart = addToCart(
    currentCart,
    activeTransaction,
    activeTransaction.cartIndex,
  );

  localStorage.setItem("cart", JSON.stringify(updateCart));
  modalProduct.hide(); // Tutup modal otomatis setelah berhasil simpan

  getCart(); // Render cart
});

// Kategori & Pencarian
$(document).on("click", ".btn-categories", function () {
  $(".btn-categories").removeClass("active").addClass("inactive");
  $(this).removeClass("inactive").addClass("active");
  $("#search_box").val("");
  $("#list-product-title").html($(this).data("name"));

  currentCategoryId = $(this).data("id") || null;
  showProducts(currentCategoryId, "");
});

// Pencarian Produk Debounce
const processSearch = debounce((query) =>
  showProducts(currentCategoryId, query),
);
$(document).on("keyup", "#search_box", function () {
  processSearch($(this).val());
});

$(document).on("click", ".row-products", function () {
  showProductDetail($(this).data("id"));
});

// Helper Debounce (Perbaikan scope arguments)
function debounce(func, timeout = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}
