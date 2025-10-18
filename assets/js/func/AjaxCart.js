let bsModalTransactionSuccessful = new bootstrap.Modal(
  $("#modal-transaction-successfull")
);
let bsModalBayar = new bootstrap.Modal($("#modal-payment"));
$(document).ready(function () {
  // load data CART/Keranjang
  getCart();
  getCustomers();

  // Modal
  let bsModalListCustomers = new bootstrap.Modal($("#modal-list-customers"));
  let bsModalCustomers = new bootstrap.Modal($("#modal-customers"));

  // Show modal pelanggan
  $(document).on("click", "#customer-name", function () {
    if (localStorage.getItem("data-customer")) {
      let data = JSON.parse(localStorage.getItem("data-customer"));
      if (data != "") {
        $("#active-customer").html(data.nameCustomer);
        bsModalCustomers.show();
      } else {
        bsModalListCustomers.show();
      }
    } else {
      bsModalListCustomers.show();
    }
  });

  // Search pelenggan
  $("#search_customer").keyup(function () {
    var query = $("#search_customer").val();
    getCustomers(query);
  });

  // Btn pilih pelanggan
  $(document).on("click", "#select-customer", function () {
    const dataCustomer = $(this).data();
    localStorage.setItem("data-customer", JSON.stringify(dataCustomer));
    $("#customer-name").html(dataCustomer.nameCustomer);
    bsModalListCustomers.hide();
  });

  // set Nama Pelanggan
  if (localStorage.getItem("data-customer")) {
    $("#customer-name").html(
      JSON.parse(localStorage.getItem("data-customer")).nameCustomer
    );
  } else {
    $("#customer-name").html("+ Tambah Pelanggan");
  }

  // Hapus pelanggan dari transaksi
  $(document).on("click", "#delete-customer", function () {
    localStorage.removeItem("data-customer");
    bsModalCustomers.hide();
    $("#customer-name").html("+ Tambah Pelanggan");
    bsModalListCustomers.show();
  });

  // Onclick delete produk from cart
  $(document).on("click", "#delete-product", function () {
    const index = $(this).data("index");
    deleteProduct(index);
  });

  // OnClick item cart
  $(document).on("click", "#item-cart", function () {
    const data = JSON.parse(localStorage.getItem("cart-active"));
    const dataItem = data[$(this).data("indexCart")];
    getProdukById(dataItem.productId, dataItem, $(this).data("indexCart"));
    modalVarian.show();
    $("#btn-add-to-cart").attr("disabled", false);
  });

  // Get data pelanggan on modal show
  const modalPayment = document.getElementById("modal-payment");
  modalPayment.addEventListener("hidden.bs.modal", (event) => {
    $("#btn-payment-transaction").attr("disabled", true);
    $(".payment-method").removeClass("active").addClass("inactive");
    localStorage.setItem("payment", "{}");
  });

  // Btn Bayar Cart
  // Cek apakah transaksi pisah bill atau bukan
  $("#btn-payment-transaction").attr("disabled", true);
  $(document).on("click", "#btn-payment", function () {
    let LScart = "";
    let LStotal = "";
    if (localStorage.getItem("split-bill")) {
      LScart = "split-bill";
      LStotal = "total-split-bill";
    } else {
      LScart = "cart-active";
      LStotal = "total";
    }

    const dataCart = JSON.parse(localStorage.getItem(LScart));
    if (dataCart.length > 0) {
      $("#modal-title-payment").html(
        formatRupiah(localStorage.getItem(LStotal))
      );
      $("#bayar-pas").html(formatRupiah(localStorage.getItem(LStotal)));
      $("#input-bayar-tunai").attr(
        "placeholder",
        localStorage.getItem(LStotal)
      );
      bsModalBayar.show();
    }
  });

  // On select metode pembayaran
  // Pilih Metode Pembayana
  $(document).on("click", ".payment-method", function () {
    $("#btn-payment-transaction").attr("disabled", false);
    const attrId = $(this).attr("id");
    if (attrId == "bayar-pas") {
      $(".payment-method").removeClass("active").addClass("inactive");
    } else {
      $("#bayar-pas").removeClass("active").addClass("inactive");
    }
    $(this).removeClass("inactive").addClass("active");

    let LStotal = "";
    if (localStorage.getItem("split-bill")) {
      LStotal = "total-split-bill";
    } else {
      LStotal = "total";
    }

    const payment = {
      payment_method: $(this).data("pembayaran"),
      payment_amount: localStorage.getItem(LStotal),
    };
    $("#input-bayar-tunai").val("");
    localStorage.setItem("payment", JSON.stringify(payment));
  });

  // On change input bayar tunai
  // Input Nominal Bayar tunai
  $("#input-bayar-tunai").keyup(function () {
    let LStotal = "";
    if (localStorage.getItem("split-bill")) {
      LStotal = "total-split-bill";
    } else {
      LStotal = "total";
    }
    const value = $(this).val();
    $(".payment-method").removeClass("active").addClass("inactive");
    const total = localStorage.getItem(LStotal);
    if (parseInt(value) >= parseInt(total)) {
      $("#btn-payment-transaction").attr("disabled", false);
    } else {
      $("#btn-payment-transaction").attr("disabled", true);
    }

    const payment = {
      payment_method: "tunai",
      payment_amount: value,
    };
    localStorage.setItem("payment", JSON.stringify(payment));
  });

  // Btn bayar Transaksi
  // Input Transaksi
  $(document).on("click", "#btn-payment-transaction", function () {
    $("#modal-payment").LoadingOverlay("show");
    $("#btn-payment-transaction").attr("disabled", true);
    let LScart = "";
    let LStotal = "";
    if (localStorage.getItem("split-bill")) {
      LScart = "split-bill";
      LStotal = "total-split-bill";
    } else {
      LScart = "cart-active";
      LStotal = "total";
    }

    const payment = JSON.parse(localStorage.getItem("payment"));
    const customer = localStorage.getItem("data-customer");

    let total_amount = localStorage.getItem(LStotal);
    let paymentAmount = payment.payment_amount;
    let paymentMethod = payment.payment_method;
    let customerId = customer ? JSON.parse(customer).idCustomer : "";
    let includeRevenue = customer ? JSON.parse(customer).revenueCustomer : "";
    let transactionTypeId = customer ? JSON.parse(customer).typeCustomer : "";
    let transactionDetail = JSON.parse(localStorage.getItem(LScart));

    const dataTransaksi = {
      total_amount: Number(total_amount),
      payment_amount: Number(paymentAmount),
      change_amount: Number(paymentAmount) - Number(total_amount),
      payment_method: paymentMethod,
      include_revenue: includeRevenue,
      customerId: customerId,
      transactionTypeId: transactionTypeId,
      transactionDetails: transactionDetail,
    };
    createTransaction(dataTransaksi);
  });

  // Print nota transaksi berhasil
  $(document).on("click", "#print-notanya", function () {
    let is_mobile = /android|mobile/gi.test(navigator.userAgent);
    let url = "print-nota-bayar.php";
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
        "Cetak Nota",
        "top=100,left=100,width=700,height=600,menubar=no,status=no,titlebar=no"
      );
    }
  });
});

function transaksiBaru() {
  if (!localStorage.getItem("split-bill")) {
    if (localStorage.getItem("indexbill")) {
      const indexBill = JSON.parse(localStorage.getItem("indexbill")).indexBill;
      deleteBill(indexBill);
      localStorage.removeItem("indexbill");
    }
    localStorage.removeItem("data-customer");
    localStorage.removeItem("total");
    localStorage.removeItem("cart-active");
  } else {
    let dataCartActive = JSON.parse(localStorage.getItem("cart-active"));
    let indexQty = JSON.parse(localStorage.getItem("indexqty"));
    let res = [];
    dataCartActive.map((item, index) => {
      let qty = parseInt(item.qty) - parseInt(indexQty[index]);
      let part = {};
      part.price = item.price;
      part.productId = item.productId;
      part.variantId = item.variantId;
      part.productName = item.productName;
      part.variantName = item.variantName;
      part.qty = qty;
      part.subtotal = parseInt(item.price) * parseInt(qty);
      res.push(part);
    });
    let result = res.filter(function (item) {
      return item.qty != 0;
    });
    localStorage.setItem("cart-active", JSON.stringify(result));
    cancelSplitBill();
  }

  localStorage.removeItem("payment");
  localStorage.removeItem("transaction-successfull");
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
function createTransaction(dataTransaction) {
  const URL = API + "/transactions";
  $.ajax({
    url: URL,
    method: "POST",
    data: dataTransaction,
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      // localStorage.clear();
      let dataTrx = {
        ...dataTransaction,
        receipt: data.receipt,
      };

      localStorage.setItem("idTransaksi", data.id);

      Cookies.set("transaction-successfull", JSON.stringify(dataTrx));
      localStorage.setItem("transaction-successfull", JSON.stringify(dataTrx));
      getCart();
      let change =
        parseInt(dataTransaction.payment_amount) -
        parseInt(dataTransaction.total_amount);
      $("#method_").html(dataTransaction.payment_method.toUpperCase());
      $("#payment_").html(formatRupiah(dataTransaction.payment_amount));
      $("#change_").html("Kembali " + formatRupiah(change));
      bsModalBayar.hide();
      bsModalTransactionSuccessful.show();
      $("#modal-payment").LoadingOverlay("hide", true);
    },
    error: function (error) {
      console.log(error);
    },
  });
}

// Get Pelanggan
function getCustomers(search) {
  const URL = API + "/customers";
  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ name: search }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      const datas = data.data;

      let html = "";
      datas.map((item) => {
        html += `<tr>
            <td>${item.name} | <span class="text-secondary">${item.transactionType.name}</span></td>
            <td class="text-end">
              <button id="select-customer"
                data-id-customer="${item.id}" 
                data-name-customer="${item.name}"
                data-revenue-customer="${item.include_revenue}"
                data-type-customer="${item.transactionTypeId}"
                class="btn btn-dark btn-sm">Pilih</button></td>
          </tr>`;
      });

      $("#list-customers").html(html);
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
      html += `<tr>
          <td id="item-cart" data-index-cart="${index}" style="cursor:pointer">
            <p class="mb-0">${item.productName}</p>
            <p class="mt-0 fw-light text-secondary">${item.variantName}</p>
          </td>
          <td class="fw-semibold">x${item.qty}</td>
          <td class="text-end">
            ${formatRupiah(item.subtotal)}
            <span id="delete-product" style="cursor:pointer" data-index="${index}">
              <i class="bi-x-circle-fill"></i>
            </span>
          </td>
        </tr>`;
    });
    $("#cart-active").html(html);
    localStorage.setItem("total", total);
    $("#payment").html(formatRupiah(total));
  } else {
    $("#cart-active").html("Tidak ada Produk");
    $("#payment").html(formatRupiah(0));
  }

  let data = JSON.parse(localStorage.getItem("data-customer"));
  if (data) {
    $("#customer-name").html(data.nameCustomer);
    $("#active-customer").html(data.nameCustomer);
  } else {
    $("#customer-name").html("+ Tambah Pelanggan");
    $("#active-customer").html("");
  }
}
