let bsModalSaveBill = new bootstrap.Modal($("#modal-save-bill"));
let bsModalListBill = new bootstrap.Modal($("#modal-list-bill"));
let bsModalAlert = new bootstrap.Modal($("#modal-alert"));
let bsModalSplitBill = new bootstrap.Modal($("#modal-split-bill"));

const modalSaveBill = document.getElementById("modal-save-bill");
const modalListBill = document.getElementById("modal-list-bill");
const modalSplitBill = document.getElementById("modal-split-bill");
const inputBill = document.getElementById("input-bill");

moment.locale("id");

// On Show Modal Simpan Bill
modalSaveBill.addEventListener("shown.bs.modal", () => {
  inputBill.focus();
});

// On hidden Modal Simpan Bill
modalSaveBill.addEventListener("hidden.bs.modal", () => {
  inputBill.value = "";
});

$(document).ready(function () {
  // Btn Simpan Bill
  $(document).on("click", "#btn-save", function () {
    const cartActive = localStorage.getItem("cart-active");
    const indexBill = localStorage.getItem("indexbill");
    if (indexBill) {
      const dataBill = JSON.parse(indexBill);
      let data = JSON.parse(localStorage.getItem("list-bill"));
      const customer = localStorage.getItem("data-customer");
      const dataCustomer = customer ? JSON.parse(customer) : "";

      const saveBill = {
        name: dataBill.nameBill,
        date: dataBill.dateBill,
        total: localStorage.getItem("total"),
        customer: dataCustomer,
        cart: JSON.parse(cartActive),
      };

      const newData = data.map((obj, index) =>
        index == dataBill.indexBill ? saveBill : obj
      );
      localStorage.setItem("list-bill", JSON.stringify(newData));
      localStorage.removeItem("cart-active");
      localStorage.removeItem("total");
      localStorage.removeItem("data-customer");
      localStorage.removeItem("indexbill");
      getCart();
    } else {
      if (cartActive) {
        if (cartActive != "[]") {
          bsModalSaveBill.show();
        }
      }
    }
  });

  // Btn simpan bill ke localstorage
  $(document).on("click", "#btn-save-bill", function () {
    if (inputBill.value.length >= 1) {
      const customer = localStorage.getItem("data-customer");
      const date = moment().tz("Asia/Jakarta").format("lll");
      const dataCustomer = customer ? JSON.parse(customer) : "";

      const saveBill = {
        name: inputBill.value,
        date: date,
        total: localStorage.getItem("total"),
        customer: dataCustomer,
        cart: JSON.parse(localStorage.getItem("cart-active")),
      };

      let data = [];

      if (localStorage.getItem("list-bill")) {
        // if localstorage exist
        data = JSON.parse(localStorage.getItem("list-bill"));
        data.push(saveBill);
        localStorage.setItem("list-bill", JSON.stringify(data));
      } else {
        // if localstorage doesn't exist
        localStorage.setItem("list-bill", JSON.stringify([saveBill]));
      }

      localStorage.removeItem("cart-active");
      localStorage.removeItem("total");
      localStorage.removeItem("data-customer");
      bsModalSaveBill.hide();
      getCart();
    }
  });

  //  Button Show Saved Bill / List Bill
  $(document).on("click", "#btn-list-bill", function () {
    const listBill = localStorage.getItem("list-bill");
    if (listBill) {
      if (listBill != "[]") {
        const data = JSON.parse(listBill);
        let html = "";
        data.map((bill, index) => {
          html += `<tr>
                    <td>
                      ${bill.name}<br>
                      <span class="text-secondary" style="font-size:12px">
                      ${bill.date}
                      </span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-outline-dark btn-delete-bill" data-indexbill="${index}">
                        <i class="bi-trash"></i>
                      </button>
                      <button class="btn btn-dark btn-select-bill px-5" 
                        data-indexbill="${index}" 
                        data-namebill="${bill.name}" 
                        data-datebill="${bill.date}">
                        Pilih
                      </button>
                    </td>
                  </tr>`;
        });

        $("#list-bill").html(html);
        bsModalListBill.show();
      }
    }
  });

  // Button pilih bill tersimpan / menampilkan bill terpilih
  $(document).on("click", ".btn-select-bill", function () {
    const indexBill = $(this).data("indexbill");
    const nameBill = $(this).data("namebill");
    const dateBill = $(this).data("datebill");
    const dataBill = {
      indexBill: indexBill,
      nameBill: nameBill,
      dateBill: dateBill,
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

  // Button hapus Bill
  $(document).on("click", ".btn-delete-bill", function () {
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
          deleteBill(index);
          bsModalListBill.hide();
        }
      });
    } else {
      $("#alert-message").html("Transaksi sebelumnya belum tersimpan!");
      bsModalAlert.show();
    }
  });

  // Button print bill
  $(document).on("click", "#btn-print-bill", function () {
    if (localStorage.getItem("indexbill")) {
      const indexBill = JSON.parse(localStorage.getItem("indexbill")).indexBill;
      Cookies.set(
        "print-bill",
        JSON.stringify(JSON.parse(localStorage.getItem("list-bill"))[indexBill])
      );
      let is_mobile = /android|mobile/gi.test(navigator.userAgent);
      let url = "print-bill.php";
      if (is_mobile) {
        console.log("ismobile");
        let html_container =
          "print://escpos.org/escpos/bt/print?srcTp=uri&srcObj=html&src='data:text/html,";
        $.ajax({
          url: url,
          success: function (html) {
            html_container += html;
            window.location.href = html_container;
          },
          error: function () {
            alert("Ajax Error, cek console browser");
          },
        });
      } else {
        window.open(
          url,
          "Cetak Bill",
          "top=100,left=100,width=700,height=600,menubar=no,status=no,titlebar=no"
        );
      }
    }
  });

  // // Btn pisah bill
  // $(document).on("click", "#btn-modal-split-bill", function () {
  //   if (localStorage.getItem("indexbill")) {
  //     const dataCart = JSON.parse(localStorage.getItem("cart-active"));
  //     let indexQty = [];
  //     dataCart.map((item) => {
  //       indexQty.push(0);
  //     });
  //     localStorage.setItem("indexqty", JSON.stringify(indexQty));
  //     if (dataCart.length > 1) {
  //       let html = "";
  //       dataCart.map((item, index) => {
  //         html +=
  //           `<div class="col-7">
  //                     <p class="mb-0">` +
  //           item.nama_produk +
  //           `</p>
  //                     <p class="mt-0 fw-light text-secondary">` +
  //           item.nama_varian +
  //           `<span class="fw-semibold ms-2">` +
  //           formatRupiah(item.subtotal) +
  //           `</span></p>
  //                 </div>
  //                 <div class="col-3">
  //                     <div class="input-group mb-3">
  //                         <button class="btn btn-dark input-group-text btn-increment-pisah btn-increment-` +
  //           index +
  //           `" data-increment="-1" data-index="` +
  //           index +
  //           `" disabled>
  //                             <i class="bi-dash-circle"></i>
  //                         </button>
  //                         <input type="number" class="form-control text-center" id="input-qty-pisah-` +
  //           index +
  //           `" value="` +
  //           item.qty +
  //           `" min="1" max="` +
  //           item.qty +
  //           `" readonly>
  //                         <button class="btn btn-dark input-group-text btn-increment-pisah btn-increment-` +
  //           index +
  //           `" data-increment="1" data-index="` +
  //           index +
  //           `" disabled>
  //                             <i class="bi-plus-circle"></i>
  //                         </button>
  //                     </div>
  //                 </div>
  //                 <div class="col-2 text-center">
  //                     <input type="checkbox" class="larger checkbox-pisah" data-index="` +
  //           index +
  //           `">
  //                 </div>
  //                 <hr style="margin: 0 0 0.5em 0">`;
  //       });
  //       $("#list-split-bill").html(html);
  //       bsModalSplitBill.show();
  //     }
  //   }
  // });

  // let dataPisahBill;
  // // Toggle checkbox pisah bill
  // // Select item untuk pisah bill
  // $(document).on("click", ".checkbox-pisah", function () {
  //   const index = $(this).data("index");
  //   $(".btn-increment-" + index).attr("disabled", !this.checked);

  //   if (this.checked) {
  //     const dataProduk = JSON.parse(localStorage.getItem("cart-active"))[index];
  //     let qty = parseInt($("#input-qty-pisah-" + index).val());
  //     dataPisahBill = {
  //       index: index,
  //       harga: dataProduk.harga,
  //       id_produk: dataProduk.id_produk,
  //       id_varian: dataProduk.id_varian,
  //       nama_produk: dataProduk.nama_produk,
  //       nama_varian: dataProduk.nama_varian,
  //       qty: qty,
  //       subtotal: parseInt(dataProduk.harga) * qty,
  //     };

  //     // Index qty
  //     let indexQty = JSON.parse(localStorage.getItem("indexqty"));
  //     indexQty[index] = dataProduk.qty;
  //     localStorage.setItem("indexqty", JSON.stringify(indexQty));

  //     let data = [];

  //     if (localStorage.getItem("split-bill")) {
  //       // if localstorage exist
  //       data = JSON.parse(localStorage.getItem("split-bill"));
  //       data.push(dataPisahBill);
  //       localStorage.setItem("split-bill", JSON.stringify(data));
  //     } else {
  //       // if localstorage doesn't exist
  //       localStorage.setItem("split-bill", JSON.stringify([dataPisahBill]));
  //     }
  //   } else {
  //     const data = JSON.parse(localStorage.getItem("split-bill"));
  //     let newData = data.filter(function (item) {
  //       return item.index != index;
  //     });
  //     localStorage.setItem("split-bill", JSON.stringify(newData));
  //     $("#input-qty-pisah-" + index).val(
  //       JSON.parse(localStorage.getItem("cart-active"))[index].qty
  //     );
  //     let indexQty = JSON.parse(localStorage.getItem("indexqty"));
  //     indexQty[index] = 0;
  //     localStorage.setItem("indexqty", JSON.stringify(indexQty));
  //   }

  //   if (localStorage.getItem("split-bill") != "[]") {
  //     $("#btn-split-bill").attr("disabled", false);
  //   } else {
  //     $("#btn-split-bill").attr("disabled", true);
  //   }

  //   totalPisahBill();
  // });

  // // Increment qty pisah bill
  // $(document).on("click", ".btn-increment-pisah", function () {
  //   const indexInput = $(this).data("index");
  //   const value = JSON.parse(localStorage.getItem("cart-active"))[indexInput]
  //     .qty;
  //   let currentValue = $("#input-qty-pisah-" + indexInput).val();
  //   let increment =
  //     parseInt(currentValue) + parseInt($(this).data("increment"));
  //   let resultQty = 1;
  //   if (increment < 1) {
  //     $("#input-qty-pisah-" + indexInput).val(1);
  //     resultQty = 1;
  //   } else if (increment > value) {
  //     $("#input-qty-pisah-" + indexInput).val(parseInt(value));
  //     resultQty = parseInt(value);
  //   } else {
  //     $("#input-qty-pisah-" + indexInput).val(increment);
  //     resultQty = increment;
  //   }

  //   let data = JSON.parse(localStorage.getItem("split-bill"));
  //   const newData = data.map((obj, index) =>
  //     obj.index == indexInput
  //       ? {
  //           ...obj,
  //           qty: resultQty,
  //           subtotal: parseInt(obj.harga) * parseInt(resultQty),
  //         }
  //       : obj
  //   );
  //   let indexQty = JSON.parse(localStorage.getItem("indexqty"));
  //   indexQty[indexInput] = resultQty;
  //   localStorage.setItem("indexqty", JSON.stringify(indexQty));

  //   localStorage.setItem("split-bill", JSON.stringify(newData));
  //   totalPisahBill();
  // });

  // // btn pisahkan toggel disabled
  // $("#btn-split-bill").attr("disabled", true);
  // $("#btn-split-bill").on("click", function () {
  //   bsModalSplitBill.hide();
  //   $("#btn-bayar").click();
  // });
});

// function totalSplitBill() {
//   let dataPisahBill = JSON.parse(localStorage.getItem("split-bill"));
//   if (dataPisahBill.length > 0) {
//     let sum = 0;
//     dataPisahBill.map((item) => {
//       sum += item.subtotal;
//     });
//     localStorage.setItem("total-split-bill", sum);
//   } else {
//     localStorage.setItem("total-split-bill", 0);
//   }

//   $("#total-split-bill").html(
//     formatRupiah(localStorage.getItem("total-split-bill"))
//   );
// }

function deleteBill(index) {
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
    "data-customer",
    JSON.stringify(data[dataBill.indexBill].customer)
  );
  localStorage.setItem("indexbill", JSON.stringify(dataBill));

  bsModalListBill.hide();
  getCart();
}

// Batal Pisah Bill
function cancelSplitBill() {
  localStorage.removeItem("split-bill");
  localStorage.removeItem("total-split-bill");
  localStorage.removeItem("indexqty");
  $("#total-split-bill").html("Rp. 0");
}
