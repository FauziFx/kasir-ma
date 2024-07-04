let bsModalTransaksiBerhasil = new bootstrap.Modal(
  $("#modal-transaksi-berhasil")
);
let bsModalBayar = new bootstrap.Modal($("#modal-bayar"));
$(document).ready(function () {
  // load data CART/Keranjang
  getCart();

  // Modal
  let bsModalListPelanggan = new bootstrap.Modal($("#modal-list-pelanggan"));
  let bsModalPelanggan = new bootstrap.Modal($("#modal-pelanggan"));

  // Onclick delete produk from cart
  $(document).on("click", "#delete-produk", function () {
    const index = $(this).data("index");
    deleteProduct(index);
  });

  // Change jenis transaksi
  $(document).on("click", ".dropdown-item", function () {
    let jenisTransaksi = $(this).data("jenis");
    if (jenisTransaksi == "umum") {
      $("#jenis-transaksi").html("Umum");
    } else {
      $("#jenis-transaksi").html("MA Grup");
    }
  });

  // Get data pelanggan on modal show
  const modalListPelanggan = document.getElementById("modal-list-pelanggan");
  modalListPelanggan.addEventListener("show.bs.modal", (event) => {
    getPelanggan();
  });

  // Search pelenggan
  $("#search_pelanggan").keyup(function () {
    var query = $("#search_pelanggan").val();
    getPelanggan(query);
  });

  // Show modal pelanggan
  $(document).on("click", "#nama-pelanggan", function () {
    if (localStorage.getItem("data-pelanggan")) {
      let data = JSON.parse(localStorage.getItem("data-pelanggan"));
      $("#pelanggan-aktif h3").html(data.namaPelanggan);
      $("#pelanggan-aktif span").html(data.nohpPelanggan);
      bsModalPelanggan.show();
    } else {
      bsModalListPelanggan.show();
    }
  });

  // Hapus pelanggan dari transaksi
  $(document).on("click", "#hapus-pelanggan", function () {
    localStorage.removeItem("data-pelanggan");
    bsModalPelanggan.hide();
    $("#nama-pelanggan").html("+ Tambah Pelanggan");
    bsModalListPelanggan.show();
  });

  // set Nama Pelanggan
  if (localStorage.getItem("data-pelanggan")) {
    $("#nama-pelanggan").html(
      JSON.parse(localStorage.getItem("data-pelanggan")).namaPelanggan
    );
  } else {
    $("#nama-pelanggan").html("+ Tambah Pelanggan");
  }

  // Btn pilih pelanggan
  $(document).on("click", "#pilih-pelanggan", function () {
    const dataPelanggan = $(this).data();
    localStorage.setItem("data-pelanggan", JSON.stringify(dataPelanggan));
    $("#nama-pelanggan").html(dataPelanggan.namaPelanggan);
    bsModalListPelanggan.hide();
  });

  // OnClick item cart
  $(document).on("click", "#item-cart", function () {
    const data = JSON.parse(localStorage.getItem("cart-active"));
    const dataItem = data[$(this).data("indexCart")];
    getProdukById(dataItem.id_produk, dataItem, $(this).data("indexCart"));
    modalProduk.show();
    $("#btn-tambah").attr("disabled", false);
  });

  // Get data pelanggan on modal show
  const modalBayar = document.getElementById("modal-bayar");
  modalBayar.addEventListener("hidden.bs.modal", (event) => {
    $("#btn-bayar-transaksi").attr("disabled", true);
    $(".metode-pembayaran").removeClass("active").addClass("inactive");
  });

  // Btn Bayar
  $("#btn-bayar-transaksi").attr("disabled", true);
  $(document).on("click", "#btn-bayar", function () {
    let LScart = "";
    let LStotal = "";
    if (localStorage.getItem("pisah-bill")) {
      LScart = "pisah-bill";
      LStotal = "total-pisah-bill";
    } else {
      LScart = "cart-active";
      LStotal = "total";
    }

    let jenis_transaksi =
      $("#jenis-transaksi").html().trim() == "Umum" ? "Umum" : "MA Grup";
    $("#info-jenis_transaksi").html(jenis_transaksi);

    const dataCart = JSON.parse(localStorage.getItem(LScart));
    if (dataCart.length > 0) {
      $("#modal-title-bayar").html(formatRupiah(localStorage.getItem(LStotal)));
      $("#bayar-pas").html(formatRupiah(localStorage.getItem(LStotal)));
      $("#input-bayar-tunai").attr(
        "placeholder",
        localStorage.getItem(LStotal)
      );
      bsModalBayar.show();
    }
  });

  // On select metode pembayaran
  $(document).on("click", ".metode-pembayaran", function () {
    $("#btn-bayar-transaksi").attr("disabled", false);
    const attrId = $(this).attr("id");
    if (attrId == "bayar-pas") {
      $(".metode-pembayaran").removeClass("active").addClass("inactive");
    } else {
      $("#bayar-pas").removeClass("active").addClass("inactive");
    }
    $(this).removeClass("inactive").addClass("active");

    let LStotal = "";
    if (localStorage.getItem("pisah-bill")) {
      LStotal = "total-pisah-bill";
    } else {
      LStotal = "total";
    }

    const pembayaran = {
      metode_pembayaran: $(this).data("pembayaran"),
      bayar: localStorage.getItem(LStotal),
    };
    $("#input-bayar-tunai").val("");
    localStorage.setItem("pembayaran", JSON.stringify(pembayaran));
  });

  // On change input bayar tunai
  $("#input-bayar-tunai").keyup(function () {
    let LStotal = "";
    if (localStorage.getItem("pisah-bill")) {
      LStotal = "total-pisah-bill";
    } else {
      LStotal = "total";
    }
    const value = $(this).val();
    $(".metode-pembayaran").removeClass("active").addClass("inactive");
    const total = localStorage.getItem(LStotal);
    if (parseInt(value) >= parseInt(total)) {
      $("#btn-bayar-transaksi").attr("disabled", false);
    } else {
      $("#btn-bayar-transaksi").attr("disabled", true);
    }

    const pembayaran = {
      metode_pembayaran: "tunai",
      bayar: value,
    };
    localStorage.setItem("pembayaran", JSON.stringify(pembayaran));
  });

  // Btn bayar Transaksi
  $(document).on("click", "#btn-bayar-transaksi", function () {
    $("#modal-bayar").LoadingOverlay("show");
    $("#btn-bayar-transaksi").attr("disabled", true);
    let LScart = "";
    let LStotal = "";
    if (localStorage.getItem("pisah-bill")) {
      LScart = "pisah-bill";
      LStotal = "total-pisah-bill";
    } else {
      LScart = "cart-active";
      LStotal = "total";
    }

    let total = localStorage.getItem(LStotal);
    let bayar = JSON.parse(localStorage.getItem("pembayaran")).bayar;
    let jenis_transaksi =
      $("#jenis-transaksi").html().trim() == "Umum" ? "umum" : "magrup";
    let metode_pembayaran = JSON.parse(
      localStorage.getItem("pembayaran")
    ).metode_pembayaran;
    let id_pelanggan = localStorage.getItem("data-pelanggan")
      ? JSON.parse(localStorage.getItem("data-pelanggan")).idPelanggan
      : "";
    let transaksi_detail = JSON.parse(localStorage.getItem(LScart));

    const dataTransaksi = {
      total: total,
      bayar: bayar,
      jenis_transaksi: jenis_transaksi,
      metode_pembayaran: metode_pembayaran,
      id_pelanggan: id_pelanggan,
      transaksi_detail: transaksi_detail,
    };
    createTransaksi(dataTransaksi);
  });

  // ON hidden modal transaksi berhasil
  // const modalTransaksiBerhasil = document.getElementById(
  //   "modal-transaksi-berhasil"
  // );
  // modalTransaksiBerhasil.addEventListener("hide.bs.modal", (event) => {
  //   // Hapus id ada bill tersimpan
  //   if (localStorage.getItem("indexbill")) {
  //     const indexBill = JSON.parse(localStorage.getItem("indexbill").indexBill);
  //     hapusBill(indexBill);
  //     localStorage.removeItem("indexbill");
  //   }
  //   localStorage.removeItem("transaksi-berhasil");
  // });
});

function transaksiBaru() {
  if (!localStorage.getItem("pisah-bill")) {
    if (localStorage.getItem("indexbill")) {
      const indexBill = JSON.parse(localStorage.getItem("indexbill")).indexBill;
      hapusBill(indexBill);
      localStorage.removeItem("indexbill");
    }
    localStorage.removeItem("data-pelanggan");
    localStorage.removeItem("total");
    localStorage.removeItem("cart-active");
  } else {
    let dataCartActive = JSON.parse(localStorage.getItem("cart-active"));
    let indexQty = JSON.parse(localStorage.getItem("indexqty"));

    let res = [];
    dataCartActive.map((item, index) => {
      let qty = parseInt(item.qty) - parseInt(indexQty[index]);
      let part = {};
      part.harga = item.harga;
      part.id_produk = item.id_produk;
      part.id_varian = item.id_varian;
      part.nama_produk = item.nama_produk;
      part.nama_varian = item.nama_varian;
      part.qty = qty;
      part.subtotal = parseInt(item.harga) * parseInt(qty);

      res.push(part);
    });

    let result = res.filter(function (item) {
      return item.qty != 0;
    });
    localStorage.setItem("cart-active", JSON.stringify(result));
    batalPisahBill();
  }

  localStorage.removeItem("pembayaran");
  localStorage.removeItem("transaksi-berhasil");
  getCart();
}

// Delete from localstorage
function deleteProduct(index) {
  const data = JSON.parse(localStorage.getItem("cart-active"));
  data.splice(index, 1);
  localStorage.setItem("cart-active", JSON.stringify(data));
  getCart();
}

// Create Transaksi
function createTransaksi(dataTransaksi) {
  const URL = API + "api/transaksi";
  $.ajax({
    url: URL,
    method: "POST",
    data: dataTransaksi,
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      // localStorage.clear();
      localStorage.setItem("transaksi-berhasil", JSON.stringify(dataTransaksi));
      getCart();
      let kembalian =
        parseInt(dataTransaksi.bayar) - parseInt(dataTransaksi.total);
      $("#metodenya").html(dataTransaksi.metode_pembayaran.toUpperCase());
      $("#bayarnya").html(formatRupiah(dataTransaksi.bayar));
      $("#kembaliannya").html("Kembali" + formatRupiah(kembalian));
      bsModalBayar.hide();
      bsModalTransaksiBerhasil.show();
      $("#modal-bayar").LoadingOverlay("hide", true);
    },
    error: function (error) {
      console.log(error);
    },
  });
}

// Get Pelanggan
function getPelanggan(search) {
  const URL = API + "api/pelanggan";
  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ search: search }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      const datas = data.data;
      let html = "";
      datas.map((item) => {
        const nohp = item.nohp || "";
        html +=
          `<tr>
                    <td>` +
          item.nama_pelanggan +
          ` | <i class="text-lighter text-secondary">` +
          nohp +
          `</i></td>
                    <td class="text-end"><button id="pilih-pelanggan" data-id-pelanggan="` +
          item.id +
          `" data-nama-pelanggan="` +
          item.nama_pelanggan +
          `" data-nohp-pelanggan="` +
          item.nohp +
          `" class="btn btn-dark btn-sm">Pilih</button></td>
                </tr>`;
      });

      $("#list-pelanggan").html(html);
    },
  });
}

// Get car from localstorage
function getCart() {
  if (localStorage.getItem("cart-active")) {
    const dataCart = JSON.parse(localStorage.getItem("cart-active"));
    let html = "";
    let total = 0;
    dataCart.map((item, index) => {
      total += parseInt(item.subtotal);
      html +=
        `<tr>
                  <td id="item-cart" data-index-cart="` +
        index +
        `" >
                      <p class="mb-0">` +
        item.nama_produk +
        `</p>
                      <p class="mt-0 fw-light text-secondary">` +
        item.nama_varian +
        `</p>
                  </td>
                  <td class="fw-semibold">x` +
        item.qty +
        `</td>
                  <td class="text-end">` +
        formatRupiah(item.subtotal) +
        ` <span id="delete-produk" data-index="` +
        index +
        `"><i class="bi-x-circle-fill"></i></span></td>
              </tr>`;
    });
    $("#cart-active").html(html);
    localStorage.setItem("total", total);
    $("#bayar").html(formatRupiah(total));
  } else {
    $("#cart-active").html("Tidak ada Produk");
    $("#bayar").html(formatRupiah(0));
  }

  if (localStorage.getItem("data-pelanggan")) {
    const data = JSON.parse(localStorage.getItem("data-pelanggan"));
    $("#nama-pelanggan").html(data.namaPelanggan);
  } else {
    $("#nama-pelanggan").html("+ Tambah Pelanggan");
  }
}
