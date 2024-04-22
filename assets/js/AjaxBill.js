let bsModalSimpanBill = new bootstrap.Modal($("#modal-simpan-bill"));
let bsModalListBill = new bootstrap.Modal($("#modal-list-bill"));
let bsModalAlert = new bootstrap.Modal($("#modal-alert"));
let bsModalPisahBill = new bootstrap.Modal($("#modal-pisah-bill"));

const modalSimpanBill = document.getElementById("modal-simpan-bill");
const modalListBill = document.getElementById("modal-list-bill");
const modalPisahBill = document.getElementById("modal-pisah-bill");
const inputBill = document.getElementById("input-bill");

moment.locale("id");
modalSimpanBill.addEventListener("shown.bs.modal", () => {
  inputBill.focus();
});

modalSimpanBill.addEventListener("hidden.bs.modal", () => {
  inputBill.value = "";
});

function batalPisahBill() {
  localStorage.removeItem("pisah-bill");
  localStorage.removeItem("total-pisah-bill");
  localStorage.removeItem("indexqty");
  $("#total-pisah-bill").html("Rp. 0");
}

$(document).ready(function () {
  // Btn simpan
  $(document).on("click", "#btn-simpan", function () {
    const cartACtive = localStorage.getItem("cart-active");
    const indexBill = localStorage.getItem("indexbill");
    if (indexBill) {
      const dataBill = JSON.parse(localStorage.getItem("indexbill"));
      let data = JSON.parse(localStorage.getItem("list-bill"));
      const dataPelanggan = localStorage.getItem("data-pelanggan");
      const namaPelanggan = dataPelanggan
        ? JSON.parse(localStorage.getItem("data-pelanggan"))
        : "";

      const simpanBill = {
        nama: dataBill.namaBill,
        tanggal: dataBill.tanggalBill,
        total: localStorage.getItem("total"),
        nama_pelanggan: namaPelanggan,
        cart: JSON.parse(localStorage.getItem("cart-active")),
      };
      const newData = data.map((obj, index) =>
        index == dataBill.indexBill ? simpanBill : obj
      );
      localStorage.setItem("list-bill", JSON.stringify(newData));
      localStorage.removeItem("cart-active");
      localStorage.removeItem("total");
      localStorage.removeItem("data-pelanggan");
      localStorage.removeItem("indexbill");
      getCart();
    } else {
      if (cartACtive) {
        if (cartACtive != "[]") {
          bsModalSimpanBill.show();
        }
      }
    }
  });

  // Btn simpan bill ke localstorage
  $(document).on("click", "#btn-simpan-bill", function () {
    if (inputBill.value.length >= 1) {
      const dataPelanggan = localStorage.getItem("data-pelanggan");
      const tanggal = moment().tz("Asia/Jakarta").format("lll");
      const namaPelanggan = dataPelanggan
        ? JSON.parse(localStorage.getItem("data-pelanggan"))
        : "";

      const simpanBill = {
        nama: inputBill.value,
        tanggal: tanggal,
        total: localStorage.getItem("total"),
        nama_pelanggan: namaPelanggan,
        cart: JSON.parse(localStorage.getItem("cart-active")),
      };

      let data = [];

      if (localStorage.getItem("list-bill")) {
        // if localstorage exist
        data = JSON.parse(localStorage.getItem("list-bill"));
        data.push(simpanBill);
        localStorage.setItem("list-bill", JSON.stringify(data));
      } else {
        // if localstorage doesn't exist
        localStorage.setItem("list-bill", JSON.stringify([simpanBill]));
      }

      localStorage.removeItem("cart-active");
      localStorage.removeItem("total");
      localStorage.removeItem("data-pelanggan");
      bsModalSimpanBill.hide();
      getCart();
    }
  });

  //   Open list BIll
  $(document).on("click", "#btn-list-bill", function () {
    const listBill = localStorage.getItem("list-bill");
    if (listBill) {
      if (listBill != "[]") {
        const data = JSON.parse(listBill);
        let html = "";
        data.map((bill, index) => {
          html +=
            `<tr>
                        <td>
                            ` +
            bill.nama +
            ` <br>
                            <span class="text-secondary" style="font-size:12px">` +
            bill.tanggal +
            `</span>
                        </td>
                        <td class="text-end">
                        <button class="btn btn-outline-dark btn-hapus-bill" data-indexbill="` +
            index +
            `"><i class="bi-trash"></i></button>
                            <button class="btn btn-dark btn-pilih-bill px-5" data-indexbill="` +
            index +
            `" data-namabill="` +
            bill.nama +
            `" data-tanggalbill="` +
            bill.tanggal +
            `">Pilih</button>
                        </td>
                    </tr>`;
        });

        $("#list-bill").html(html);
        bsModalListBill.show();
      }
    }
  });

  // button pilih bill tersimpan / menampilkan bill terpilih
  $(document).on("click", ".btn-pilih-bill", function () {
    const indexBill = $(this).data("indexbill");
    const namaBill = $(this).data("namabill");
    const tanggalBill = $(this).data("tanggalbill");
    const dataBill = {
      indexBill: indexBill,
      namaBill: namaBill,
      tanggalBill: tanggalBill,
    };
    const cartACtive = localStorage.getItem("cart-active");
    if (cartACtive) {
      if (cartACtive != "[]") {
        bsModalListBill.hide();
        $("#alert-message").html("Transaksi sebelumnya belum tersimpan! ");
        bsModalAlert.show();
      } else {
        setCartActive(dataBill);
      }
    } else {
      setCartActive(dataBill);
    }
  });

  //   btn hapus bill
  $(document).on("click", ".btn-hapus-bill", function () {
    const index = $(this).data("indexbill");
    const indexBill = localStorage.getItem("indexbill")
      ? JSON.parse(localStorage.getItem("indexbill")).indexBill
      : -1;
    if (index != indexBill) {
      Swal.fire({
        title: "Hapus Bill?",
        showCancelButton: true,
        confirmButtonText: "Hapus",
        cancelButtonText: `Batal`,
      }).then((result) => {
        if (result.isConfirmed) {
          hapusBill(index);
          bsModalListBill.hide();
        }
      });
    } else {
      $("#alert-message").html("Transaksi sebelumnya belum tersimpan!");
      bsModalAlert.show();
    }
  });

  // Btn pisah bill
  $(document).on("click", "#btn-modal-pisah-bill", function () {
    if (localStorage.getItem("indexbill")) {
      const dataCart = JSON.parse(localStorage.getItem("cart-active"));
      let indexQty = [];
      dataCart.map((item) => {
        indexQty.push(0);
      });
      localStorage.setItem("indexqty", JSON.stringify(indexQty));
      if (dataCart.length > 1) {
        let html = "";
        dataCart.map((item, index) => {
          html +=
            `<div class="col-7">
                      <p class="mb-0">` +
            item.nama_produk +
            `</p>
                      <p class="mt-0 fw-light text-secondary">` +
            item.nama_varian +
            `<span class="fw-semibold ms-2">` +
            formatRupiah(item.subtotal) +
            `</span></p>
                  </div>
                  <div class="col-3">
                      <div class="input-group mb-3">
                          <button class="btn btn-dark input-group-text btn-increment-pisah btn-increment-` +
            index +
            `" data-increment="-1" data-index="` +
            index +
            `" disabled>
                              <i class="bi-dash-circle"></i>
                          </button>
                          <input type="number" class="form-control text-center" id="input-qty-pisah-` +
            index +
            `" value="` +
            item.qty +
            `" min="1" max="` +
            item.qty +
            `" readonly>
                          <button class="btn btn-dark input-group-text btn-increment-pisah btn-increment-` +
            index +
            `" data-increment="1" data-index="` +
            index +
            `" disabled>
                              <i class="bi-plus-circle"></i>
                          </button>
                      </div>
                  </div>
                  <div class="col-2 text-center">
                      <input type="checkbox" class="larger checkbox-pisah" data-index="` +
            index +
            `">
                  </div>
                  <hr style="margin: 0 0 0.5em 0">`;
        });
        $("#list-pisah-bill").html(html);
        bsModalPisahBill.show();
      }
    }
  });

  let dataPisahBill;
  // Toggle checkbox pisah
  $(document).on("click", ".checkbox-pisah", function () {
    const index = $(this).data("index");
    $(".btn-increment-" + index).attr("disabled", !this.checked);

    if (this.checked) {
      const dataProduk = JSON.parse(localStorage.getItem("cart-active"))[index];
      let qty = parseInt($("#input-qty-pisah-" + index).val());
      dataPisahBill = {
        index: index,
        harga: dataProduk.harga,
        id_produk: dataProduk.id_produk,
        id_varian: dataProduk.id_varian,
        nama_produk: dataProduk.nama_produk,
        nama_varian: dataProduk.nama_varian,
        qty: qty,
        subtotal: parseInt(dataProduk.harga) * qty,
      };

      // Index qty
      let indexQty = JSON.parse(localStorage.getItem("indexqty"));
      indexQty[index] = dataProduk.qty;
      localStorage.setItem("indexqty", JSON.stringify(indexQty));

      let data = [];

      if (localStorage.getItem("pisah-bill")) {
        // if localstorage exist
        data = JSON.parse(localStorage.getItem("pisah-bill"));
        data.push(dataPisahBill);
        localStorage.setItem("pisah-bill", JSON.stringify(data));
      } else {
        // if localstorage doesn't exist
        localStorage.setItem("pisah-bill", JSON.stringify([dataPisahBill]));
      }
    } else {
      const data = JSON.parse(localStorage.getItem("pisah-bill"));
      let newData = data.filter(function (item) {
        return item.index != index;
      });
      localStorage.setItem("pisah-bill", JSON.stringify(newData));
      $("#input-qty-pisah-" + index).val(
        JSON.parse(localStorage.getItem("cart-active"))[index].qty
      );
      let indexQty = JSON.parse(localStorage.getItem("indexqty"));
      indexQty[index] = 0;
      localStorage.setItem("indexqty", JSON.stringify(indexQty));
    }

    if (localStorage.getItem("pisah-bill") != "[]") {
      $("#btn-pisah-bill").attr("disabled", false);
    } else {
      $("#btn-pisah-bill").attr("disabled", true);
    }

    totalPisahBill();
  });

  // Increment qty pisah bill
  $(document).on("click", ".btn-increment-pisah", function () {
    const indexInput = $(this).data("index");
    const value = JSON.parse(localStorage.getItem("cart-active"))[indexInput]
      .qty;
    let currentValue = $("#input-qty-pisah-" + indexInput).val();
    let increment =
      parseInt(currentValue) + parseInt($(this).data("increment"));
    let resultQty = 1;
    if (increment < 1) {
      $("#input-qty-pisah-" + indexInput).val(1);
      resultQty = 1;
    } else if (increment > value) {
      $("#input-qty-pisah-" + indexInput).val(parseInt(value));
      resultQty = parseInt(value);
    } else {
      $("#input-qty-pisah-" + indexInput).val(increment);
      resultQty = increment;
    }

    let data = JSON.parse(localStorage.getItem("pisah-bill"));
    const newData = data.map((obj, index) =>
      obj.index == indexInput
        ? {
            ...obj,
            qty: resultQty,
            subtotal: parseInt(obj.harga) * parseInt(resultQty),
          }
        : obj
    );
    console.log(newData);
    let indexQty = JSON.parse(localStorage.getItem("indexqty"));
    indexQty[indexInput] = resultQty;
    localStorage.setItem("indexqty", JSON.stringify(indexQty));

    localStorage.setItem("pisah-bill", JSON.stringify(newData));
    totalPisahBill();
  });

  // btn pisahkan toggel disabled
  $("#btn-pisah-bill").attr("disabled", true);
  $("#btn-pisah-bill").on("click", function () {
    bsModalPisahBill.hide();
    $("#btn-bayar").click();
  });

  // btn print bill
  $(document).on("click", "#btn-print-bill", function () {
    if (localStorage.getItem("indexbill")) {
      const index = JSON.parse(localStorage.getItem("indexbill")).indexBill;
      window.open(
        "print-bill.html?index=" + index,
        "notaPenjualan",
        "top=100,left=100,width=700,height=600,menubar=no,status=no,titlebar=no"
      );
    }
  });
});

function totalPisahBill() {
  let dataPisahBill = JSON.parse(localStorage.getItem("pisah-bill"));
  if (dataPisahBill.length > 0) {
    let sum = 0;
    dataPisahBill.map((item) => {
      sum += item.subtotal;
    });
    localStorage.setItem("total-pisah-bill", sum);
  } else {
    localStorage.setItem("total-pisah-bill", 0);
  }

  $("#total-pisah-bill").html(
    formatRupiah(localStorage.getItem("total-pisah-bill"))
  );
}

function hapusBill(index) {
  const data = JSON.parse(localStorage.getItem("list-bill"));
  data.splice(index, 1);
  localStorage.setItem("list-bill", JSON.stringify(data));
}

function setCartActive(dataBill) {
  const data = JSON.parse(localStorage.getItem("list-bill"));
  localStorage.setItem(
    "cart-active",
    JSON.stringify(data[dataBill.indexBill].cart)
  );
  localStorage.setItem("total", data[dataBill.indexBill].total);
  localStorage.setItem(
    "data-pelanggan",
    JSON.stringify(data[dataBill.indexBill].nama_pelanggan)
  );
  localStorage.setItem("indexbill", JSON.stringify(dataBill));

  bsModalListBill.hide();
  getCart();
}
