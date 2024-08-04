let modalVarian = new bootstrap.Modal($("#modal-varian"));
// SELECTED Tambah ke keranjang
let selectedVarian = {};
const API = config.ENV_URL;
$(document).ready(function () {
  // GET
  getKategori();
  getProduk();

  // Title Produk table
  let titleProduk = $("#title-produk");
  titleProduk.html("Semua Produk");

  // on hidden modal pilih varian
  const elModalVarian = document.getElementById("modal-varian");
  elModalVarian.addEventListener("hidden.bs.modal", (event) => {
    $("#modal-title").html("");
    $("#varian-title").html("");
    $("#varian-total").html("");
    $("#list-varian").html("");
    $("#input-qty").val(1);
    $("#input-harga").val(0);
    $("#isEdit").val("");
    $("#btn-tambah").attr("disabled", true);
  });

  // List Kategori
  // Get By Kategori
  $(document).on("click", ".btn-kategori", function () {
    $(".btn-kategori").removeClass("active").addClass("inactive");
    $(this).removeClass("inactive").addClass("active");
    const id_kategori = $(this).data("id");
    getProduk(id_kategori, "");
    titleProduk.html($(this).data("nama"));
    $("#search_box").val("");
  });

  // Click row produk
  // Select Produk
  $(document).on("click", "#table-produk tr", function () {
    getProdukById($(this).data("id"));
    modalVarian.show();
  });

  // btn tambah
  $("#btn-tambah").attr("disabled", true);
  // btn Tambah ke keranjang
  $(document).on("click", "#btn-tambah", function () {
    selectedVarian.harga = $("#input-harga").val();
    selectedVarian.qty = $("#input-qty").val();
    selectedVarian.subtotal =
      parseInt($("#input-qty").val()) * parseInt($("#input-harga").val());

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

  // Select Varian
  $(document).on("click", "#list-varian li button", function () {
    $("#btn-tambah").attr("disabled", false);
    let varian = {
      id_produk: $(this).data("idproduk"),
      id_varian: $(this).data("idvarian"),
      nama_varian: $(this).data("namavarian"),
      harga: $(this).data("harga"),
    };

    // Auto Scroll to bottom / to qty & harga
    document.getElementById("list-varian").scrollIntoView({ block: "end" });

    // Set value qty, harga & modal title
    $("#varian-title").html("-" + varian.nama_varian);
    $("#input-harga").val(varian.harga);
    let varianTotal =
      parseInt($("#input-qty").val()) * parseInt($("#input-harga").val());
    $("#varian-total").html("-" + formatRupiah(varianTotal));

    selectedVarian.id_produk = varian.id_produk;
    selectedVarian.id_varian = varian.id_varian;
    selectedVarian.nama_produk = $("#modal-title").html();
    selectedVarian.nama_varian = varian.nama_varian;
  });

  // Input onchange HARGA
  $("#input-harga").keyup(function () {
    var harga = $("#input-harga").val();
    let varianTotal = parseInt($("#input-qty").val()) * parseInt(harga);
    $("#varian-total").html("-" + formatRupiah(varianTotal));
  });

  // Input onchange QTY
  $("#input-qty").keyup(function () {
    var qty = $("#input-qty").val();
    let varianTotal = parseInt(qty) * parseInt($("#input-harga").val());
    $("#varian-total").html("-" + formatRupiah(varianTotal));
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
      parseInt($("#input-qty").val()) * parseInt($("#input-harga").val());
    $("#varian-total").html("-" + formatRupiah(varianTotal));
  });

  //   Load data Search
  $("#search_box").keyup(function () {
    var query = $("#search_box").val();
    if (query.length != 0) {
      titleProduk.html(`Cari "` + query + `"`);
      getProduk("semua", query);
    } else {
      titleProduk.html("Semua Produk");
      getProduk();
    }
  });
});

//   Get Kategori
function getKategori() {
  const URL = API + "api/kategori";
  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ order: "DESC" }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      const el = $("#all-kategori");
      const datas = data.data;
      $.each(datas, function (i, order) {
        el.after(
          `<button type="button" data-id="` +
            datas[i].id +
            `" data-nama="` +
            datas[i].nama_kategori +
            `" class="btn-kategori btn btn-outline-dark rounded-0" data-bs-toggle="button">` +
            datas[i].nama_kategori +
            `</button>`
        );
      });
    },
  });
}

// Get Produk
function getProduk(id_kategori, search_box) {
  const URL = API + "api/produk";
  let id = "";
  let search = search_box || "";
  if (id_kategori == 0) {
    id = "0";
  } else if (id_kategori == "semua") {
    id = "";
  } else {
    id = id_kategori || "";
  }

  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ mobile: "y", kategori: id, search: search }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      const datas = data.data;
      let html = "";
      if (datas.length > 0) {
        var i;
        for (i = 0; i < datas.length; i++) {
          html +=
            `<tr id="row-produk" data-id="` +
            datas[i].id +
            `">
                        <td class="py-3">` +
            datas[i].nama_produk +
            `</td>
                        <td class="text-end text-secondary text-lighter py-3">` +
            datas[i].item +
            ` Item</td>
                    </tr>`;
        }
        $("#table-produk").removeClass("text-center");
        $("#table-produk").html(html);
      } else {
        $("#table-produk").addClass("text-center");
        $("#table-produk").html(
          `<i class="text-secondary text-center">Tidak ada Produk</>`
        );
      }
    },
  });
}

// Get produk Buy Id
function getProdukById(id_produk, objVarian, indexCart = "") {
  const id = id_produk;
  const URL = API + "api/produk/" + id;

  $.ajax({
    url: URL,
    method: "GET",
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      $("#modal-title").html(data.data.nama_produk);
      if (objVarian) {
        $("#varian-title").html("-" + objVarian.nama_varian);
        $("#varian-total").html("-" + formatRupiah(objVarian.subtotal));
        $("#input-qty").val(objVarian.qty);
        $("#input-harga").val(objVarian.harga);
        $("#isEdit").val(indexCart);
        selectedVarian.id_produk = id_produk;
        selectedVarian.id_varian = objVarian.id_varian;
        selectedVarian.nama_produk = $("#modal-title").html();
        selectedVarian.nama_varian = objVarian.nama_varian;
      }

      const datas = data.data.varian;
      let html = "";
      var i;
      let id_varian = objVarian ? objVarian.id_varian : "";
      for (i = 0; i < datas.length; i++) {
        let select =
          datas[i].id == id_varian
            ? "btn btn-outline-dark w-100 border border-dark py-2 active"
            : "btn btn-outline-dark w-100 border border-dark py-2";
        html +=
          `<li class="nav-item col col-6 d-flex px-1 mb-1" role="presentation">
                      <button class="` +
          select +
          `" data-bs-toggle="tab" type="button" role="tab" aria-selected="true" data-idproduk="` +
          data.data.id +
          `" data-idvarian="` +
          datas[i].id +
          `" data-namavarian="` +
          datas[i].nama_varian +
          `" data-harga="` +
          datas[i].harga +
          `">
                      ` +
          datas[i].nama_varian +
          `
                      </button>
                  </li>`;
      }

      $("#list-varian").html(html);
    },
  });
}
