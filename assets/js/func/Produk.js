// Global Variabel
let currentCategoryId = null;
let modalProduct = new bootstrap.Modal($("#modal-product"));
let selectedVariant = {};
let currentQty = 1;
let currentPrice = 0;

// Show Categories
function showCategories() {
  const transaction = db.transaction(["categories"], "readonly");
  const storeCat = transaction.objectStore("categories");

  storeCat.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const category = cursor.value;
      const el = $("#list-categories");
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

// Show Products
function showProducts(categoryId = null, searchQuery = "") {
  const transaction = db.transaction(["products"], "readonly");
  const storeProd = transaction.objectStore("products");

  let source;

  if (categoryId) {
    const myIndex = storeProd.index("categoryId");
    source = myIndex.openCursor(IDBKeyRange.only(categoryId));
  } else {
    source = storeProd.openCursor();
  }

  let html = "";
  const query = searchQuery.toLowerCase();

  source.onsuccess = function (e) {
    const cursor = e.target.result;

    if (cursor) {
      const product = cursor.value;
      const productName = product.name.toLowerCase();

      if (query === "" || productName.includes(query)) {
        html += `<tr
                  class="row-products"
                  data-id="${product.id}"
                >
                  <td class="py-3">${product.name}</td>
                </tr>`;
      }
      cursor.continue();
    } else {
      $("#list-products").html(html);
    }
  };
}

// Show Product Detail
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

    // 2. Loop Variant (Asumsi dari API struktur datanya berupa array: product.variants)
    let variantHtml = "";
    const variants = product.variants || []; // Pengaman jika produk tidak punya varian

    // Sort by variant.id
    variants.sort((a, b) => Number(a.id) - Number(b.id));
    if (variants.length > 0) {
      variants.forEach((variant) => {
        variantHtml += `<li class="nav-item col-6 px-1 mb-1" role="presentation">
                          <button
                            class="btn btn-outline-dark w-100 border border-dark py-2"
                            type="button"
                            role="tab"
                            data-bs-toggle="tab"
                            aria-selected="false"
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
      variantHtml = `<p class="text-muted small">Produk ini tidak memiliki varian.</p>`;
    }

    // Masukkan list varian ke dalam container di modal
    $("#list-variants").html(variantHtml);

    // 3. Tampilkan Modal Bootstrap
    modalProduct.show();
  };

  request.onerror = function () {
    console.error("Gagal mengambil detail produk");
  };
}

// Debounce
function debounce(func, timeout = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

// Set Selected Variant
function setSelectedVariant(variant) {
  currentPrice = variant.price;
  const subTotal = currentQty * currentPrice;

  // Set Input value
  $("#input-qty").val(currentQty);
  $("#input-price").val(currentPrice);

  selectedVariant = variant;
  selectedVariant.qty = currentQty;
  selectedVariant.subtotal = subTotal;

  $("#modal-variant-title").html(variant.variantname);
  $("#modal-subtotal-title").html(formatRupiah(subTotal));
}

function calculateSubtotal(qty, price) {
  if (!qty || !price) {
    $("#btn-add-to-cart").attr("disabled", true);
    return;
  }

  if (qty <= 0 || price <= 0) {
    $("#input-qty").val(currentQty);
    $("#input-price").val(currentPrice);
    return;
  }

  // Set input value
  $("#input-qty").val(qty);
  $("#input-price").val(price);

  // Set variabel
  currentQty = qty;
  currentPrice = price;

  const subTotal = qty * price;

  selectedVariant.qty = qty;
  selectedVariant.price = price;
  selectedVariant.subtotal = subTotal;

  $("#modal-subtotal-title").html(formatRupiah(subTotal)); // Set modal title
  $("#btn-add-to-cart").attr("disabled", false); // Set button tambah active
}

// Add to cart
function addToCart(cart, newItem) {
  // 1. Cari tahu apakah ada item yang variantid & price-nya sama
  const existingItem = cart.find(
    (item) =>
      item.variantid == newItem.variantid && item.price == newItem.price,
  );

  if (existingItem) {
    // Jika ketemu, tambahkan qty-nya sesuai dengan qty item baru
    existingItem.qty += newItem.qty;
    // Hitung ulang subtotalnya
    existingItem.subtotal = existingItem.price * existingItem.qty;
  } else {
    // Jika tidak ketemu (beda variantid atau beda price), tinggal push ke dalam array
    cart.push(newItem);
  }

  return cart;
}

// Event on Modal Product Hidden
const myModalProduct = document.getElementById("modal-product");
myModalProduct.addEventListener("hidden.bs.modal", function (event) {
  selectedVariant = {};
  // Reset semua title di Modal Product
  $(`#modal-product-title, 
    #modal-variant-title, 
    #modal-subtotal-title`).html("");

  // Reset input di Modal product
  $("#input-qty").val(1);
  $("#input-price").val(0);
});

// Event: tombol kategori diklik
$(document).on("click", ".btn-categories", function () {
  $(".btn-categories").removeClass("active").addClass("inactive");
  $(this).removeClass("inactive").addClass("active");
  $("#search_box").val("");
  $("#list-product-title").html($(this).data("name"));

  currentCategoryId = $(this).data("id") || null;

  showProducts(currentCategoryId, "");

  if ($(this).data("id") == "favorite") {
    $("#favorite").show();
  } else {
    $("#favorite").hide();
  }
});

// Event: kolom pencarian diklik
$(document).on("keyup", "#search_box", function () {
  const currentSearch = $(this).val();
  $("#list-favorite").hide();
  debounce(() => showProducts(currentCategoryId, currentSearch))();
});

// Event: tombol produk diklik
$(document).on("click", ".row-products", function () {
  const productId = $(this).data("id");
  $("#btn-add-to-cart").attr("disabled", true);

  // Panggil fungsi baru untuk mengambil detail dan menampilkan modal
  showProductDetail(productId);
});

// Event: klik varian yang dipilih
$(document).on("click", "#list-variants li button", function () {
  $("#btn-add-to-cart").attr("disabled", false);
  setSelectedVariant($(this).data());
});

// Event: klik increment atau decrement qty
$(document).on("click", ".btn-increment", function () {
  const increment = Number($(this).data("increment"));
  const newQty = Number(currentQty) + increment;

  calculateSubtotal(newQty, currentPrice);
});

// Event: onChange input qty
$(document).on("keyup", "#input-qty", function () {
  const newQty = Number($(this).val());

  calculateSubtotal(newQty, currentPrice);
});

// Event: onChange input price
$(document).on("keyup", "#input-price", function () {
  const newPrice = Number($(this).val());

  calculateSubtotal(currentQty, newPrice);
});

// Event: klik Button add to cart
$(document).on("click", "#btn-add-to-cart", function () {
  let currentCart = JSON.parse(localStorage.getItem("cart")) || [];

  let updateCart = addToCart(currentCart, selectedVariant);
  localStorage.setItem("cart", JSON.stringify(updateCart));
});
