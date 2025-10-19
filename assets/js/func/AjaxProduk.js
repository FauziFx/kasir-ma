let modalVarian = new bootstrap.Modal($("#modal-varian"));
let modalFavorit = new bootstrap.Modal($("#modal-favorit"));
// SELECTED Tambah ke keranjang
let selectedVarian = {};
const API = config.ENV_URL;
let dataProduct = [];
$(document).ready(function () {
  // GET
  getCategory();
  getProduk();

  const favoritList = JSON.parse(localStorage.getItem("list-favorit")) || [];
  setTimeout(function () {
    showFavorit(favoritList);
  }, 500); // 3000 milliseconds = 3 seconds delay

  // Title Produk table
  let titleProduk = $("#title-product");
  titleProduk.html("Favorit");

  // on hidden modal pilih varian
  const elModalVarian = document.getElementById("modal-varian");
  elModalVarian.addEventListener("hidden.bs.modal", (event) => {
    $("#modal-title").html("");
    $("#varian-title").html("");
    $("#varian-total").html("");
    $("#list-variants").html("");
    $("#input-qty").val(1);
    $("#input-price").val(0);
    $("#isEdit").val("");
    $("#btn-add-to-cart").attr("disabled", true);
  });

  // List Kategori
  // Get By Kategori
  $(document).on("click", ".btn-categories", function () {
    $(".btn-categories").removeClass("active").addClass("inactive");
    $(this).removeClass("inactive").addClass("active");
    const categoryId = $(this).data("id");

    showProduct(categoryId, "");

    titleProduk.html($(this).data("nama"));
    $("#search_box").val("");
    if ($(this).data("nama") == "Favorite") {
      $("#favorite").show();
    } else {
      $("#favorite").hide();
    }
  });

  // Click row produk
  // Select Produk
  $(document).on(
    "click",
    "#table-products tr, #list-favorite #favorite-item",
    function () {
      getProdukById($(this).data("id"));
      modalVarian.show();
    }
  );

  //   Load data Search
  $("#search_box").keyup(function () {
    var query = $("#search_box").val();
    if (query.length != 0) {
      titleProduk.html(`Cari "` + query + `"`);
      showProduct("", query);
    } else {
      titleProduk.html("Semua Produk");
      showProduct("", "");
    }
  });

  // Select Varian
  $(document).on("click", "#list-variants li button", function () {
    $("#btn-add-to-cart").attr("disabled", false);

    let varian = {
      productId: $(this).data("productid"),
      variantId: $(this).data("variantid"),
      variantName: $(this).data("variantname"),
      price: $(this).data("price"),
    };

    // Auto Scroll to bottom / to qty & harga
    document.getElementById("list-variants").scrollIntoView({ block: "end" });

    // Set value qty, harga & modal title
    $("#varian-title").html("&nbsp;-&nbsp;" + varian.variantName);
    $("#input-price").val(varian.price);
    let varianTotal =
      parseInt($("#input-qty").val()) * parseInt($("#input-price").val());
    $("#varian-total").html(formatRupiah(varianTotal));

    selectedVarian.productId = varian.productId;
    selectedVarian.variantId = varian.variantId;
    selectedVarian.productName = $("#modal-title").html();
    selectedVarian.variantName = varian.variantName;
  });

  // btn tambah
  $("#btn-add-to-cart").attr("disabled", true);
  // btn Tambah ke keranjang
  $(document).on("click", "#btn-add-to-cart", function () {
    selectedVarian.price = $("#input-price").val();
    selectedVarian.qty = $("#input-qty").val();
    selectedVarian.subtotal =
      parseInt($("#input-qty").val()) * parseInt($("#input-price").val());

    if ($("#isEdit").val() != "") {
      const i = $("#isEdit").val();
      let data = JSON.parse(localStorage.getItem("cart-active"));
      const newData = data.map((obj, index) =>
        index == i ? selectedVarian : obj
      );
      localStorage.setItem("cart-active", JSON.stringify(newData));
    } else {
      // save to local storage
      let data = [];

      if (localStorage.getItem("cart-active")) {
        // if localstorage exist
        data = JSON.parse(localStorage.getItem("cart-active"));
        data.push(selectedVarian);
        localStorage.setItem("cart-active", JSON.stringify(data));
      } else {
        // if localstorage doesn't exist
        localStorage.setItem("cart-active", JSON.stringify([selectedVarian]));
      }
    }

    modalVarian.hide();
    getCart();
  });

  // Input onchange HARGA
  $("#input-price").keyup(function () {
    var harga = $("#input-price").val();
    let varianTotal = parseInt($("#input-qty").val()) * parseInt(harga);
    $("#varian-total").html(formatRupiah(varianTotal));
  });

  // Input onchange QTY
  $("#input-qty").keyup(function () {
    var qty = $("#input-qty").val();
    let varianTotal = parseInt(qty) * parseInt($("#input-price").val());
    $("#varian-total").html(formatRupiah(varianTotal));
  });

  // Increment QTY
  $(document).on("click", ".btn-increment", function () {
    let currentValue = $("#input-qty").val();
    let increment =
      parseInt(currentValue) + parseInt($(this).data("increment"));
    if (increment < 1) {
      $("#input-qty").val(1);
    } else {
      $("#input-qty").val(increment);
    }

    let varianTotal =
      parseInt($("#input-qty").val()) * parseInt($("#input-price").val());
    $("#varian-total").html(formatRupiah(varianTotal));
  });

  //Add Favorit
  $("#add-favorit").on("click", function () {
    const favoritList = JSON.parse(localStorage.getItem("list-favorit")) || [];

    let html = "";
    if (dataProduct.length > 0) {
      var i;
      for (i = 0; i < dataProduct.length; i++) {
        const isFavorit = favoritList.some(
          (item) => item.id === dataProduct[i].id
        );
        html += `<tr id="row-products" data-id="${dataProduct[i].id}">
                    <td style="font-size: 12px;" class="py-2">${
                      dataProduct[i].name
                    }</td>
                    <td class="py-2">
                      <div class="form-check">
                        <input class="form-check-input favorit-checkbox" type="checkbox"  data-id="${
                          dataProduct[i].id
                        }" ${isFavorit ? "checked" : ""}>
                      </div>
                    </td>
                  </tr>`;
      }
      $("#list-products").html(html);
    } else {
      $("#list-products").html(``);
    }
    modalFavorit.show();
  });

  // Save Favorit
  $("#btn-add-favorit").on("click", function () {
    // 1. Ambil checkbox yang dicentang
    const checkedBoxes = $(".favorit-checkbox:checked");

    // 2. Ambil ID produk yang dicentang
    const checkedIds = checkedBoxes
      .map(function () {
        return Number($(this).data("id"));
      })
      .get(); // .get() untuk ubah dari jQuery object ke array JS biasa

    // 3. Ambil favorit lama dari localStorage
    const oldFavorit = JSON.parse(localStorage.getItem("list-favorit")) || [];

    // 4. Simpan hanya item favorit lama yang masih dicentang
    const stillFavorit = oldFavorit.filter((item) =>
      checkedIds.includes(item.id)
    );

    // 5. Cari ID baru yang dicentang, tapi belum ada di favorit lama
    const existingIds = stillFavorit.map((item) => item.id);
    const newFavoritItems = checkedIds
      .filter((id) => !existingIds.includes(id))
      .map((id) => dataProduct.find((product) => product.id === id))
      .filter(Boolean); // pastikan tidak null

    // 6. Gabungkan favorit lama (yang masih dicentang) + yang baru
    const updatedFavorit = [...stillFavorit, ...newFavoritItems];

    // 7. Simpan ke localStorage
    localStorage.setItem("list-favorit", JSON.stringify(updatedFavorit));
    showFavorit(updatedFavorit);
    modalFavorit.hide();
  });
});

//   Get Kategori
function getCategory() {
  const URL = API + "/categories?type=main";
  $.ajax({
    url: URL,
    method: "GET",
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      const el = $("#all-categories");
      const datas = data.data;
      $.each(datas, function (i, order) {
        el.after(
          `<button type="button" data-id="` +
            datas[i].id +
            `" data-nama="` +
            datas[i].name +
            `" class="btn-categories btn btn-outline-dark rounded-0" data-bs-toggle="button">` +
            datas[i].name +
            `</button>`
        );
      });
    },
  });
}

// Get Produk
function getProduk(categoryId = "", name) {
  const URL = API + "/products";
  let id = categoryId == null ? "null" : categoryId;
  let search = name || "";

  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({
      categoryId: id,
      name: search,
      all: true,
    }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      const datas = data.data;

      dataProduct = datas;
    },
  });
}

// Get produk Buy Id
function getProdukById(productId, objVarian, indexCart = "") {
  const id = productId;
  const URL = API + "/products/" + id;

  $.ajax({
    url: URL,
    method: "GET",
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      $("#modal-title").html(data.data.name);
      if (objVarian) {
        $("#varian-title").html("-" + objVarian.variantName);
        $("#varian-total").html(formatRupiah(objVarian.subtotal));
        $("#input-qty").val(objVarian.qty);
        $("#input-price").val(objVarian.price);
        $("#isEdit").val(indexCart);
        selectedVarian.productId = productId;
        selectedVarian.variantId = objVarian.variantId;
        selectedVarian.productName = $("#modal-title").html();
        selectedVarian.variantName = objVarian.variantName;
      }

      const datas = data.data.variants;
      let html = "";
      var i;
      let variantId = objVarian ? objVarian.variantId : "";
      for (i = 0; i < datas.length; i++) {
        let select =
          datas[i].id == variantId
            ? "btn btn-outline-dark w-100 border border-dark py-2 active"
            : "btn btn-outline-dark w-100 border border-dark py-2";
        html += `<li class="nav-item col col-6 d-flex px-1 mb-1" role="presentation">
            <button class="${select}" data-bs-toggle="tab" type="button" role="tab" aria-selected="true" 
            data-productid="${data.data.id}"
            data-variantid="${datas[i].id}"
            data-variantname="${datas[i].name}"
            data-price="${datas[i].price}">
            ${datas[i].name}
            </button>
          </li>`;
      }

      $("#list-variants").html(html);
    },
  });
}

function showProduct(id, name) {
  const data = dataProduct.filter((item) => {
    // Cek kecocokan kategori
    const matchesCategory =
      id === ""
        ? true // Jika id kosong, semua category cocok
        : id === null
        ? item.categoryId === null // Jika null, cari categoryId null
        : item.categoryId === id; // Jika angka, cocokkan langsung

    // Cek pencarian nama
    const matchesSearch =
      !name || item.name.toLowerCase().includes(name.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  let html = "";
  if (data.length > 0) {
    var i;
    for (i = 0; i < data.length; i++) {
      html += `<tr id="row-products" data-id="${data[i].id}">
                    <td class="py-3">${data[i].name}</td>
                  </tr>`;
    }
    $("#table-products").removeClass("text-center");
    $("#table-products").html(html);
  } else {
    $("#table-products").addClass("text-center");
    $("#table-products").html(`<i class="text-secondary text-center"></>`);
  }
}

function showFavorit(data) {
  $("#add-favorit").nextAll(".col").remove();
  let html = "";
  if (data.length > 0) {
    var i;
    for (i = 0; i < data.length; i++) {
      const name = data[i].name.split(" ");
      const name2 = name.length > 1 ? name[1][0] : name[0][1];
      html += `<div class="col" id="favorite-item" data-id="${data[i].id}">
                  <div
                    id="row-products"
                    class="hover-button p-1 py-1 border border-secondary rounded text-center"
                    style="cursor: pointer; min-height: 90px"
                  >
                    <div class="fs-4 fw-semibold text-secondary py-2">
                      ${name[0][0] + name2}
                    </div>
                    <p
                      style="font-size: 12px; line-height: 100%"
                      class="mb-0"
                    >
                      ${data[i].name}
                    </p>
                  </div>
                </div>`;
    }
    $("#add-favorit").after(html);
  }
}
