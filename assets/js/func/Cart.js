// ==========================================
// 1. STATE & GLOBAL VARIABLES
// ==========================================
let modalListCustomers = new bootstrap.Modal($("#modal-list-customers"));
let modalActiveCustomers = new bootstrap.Modal($("#modal-active-customer"));
let modalPayment = new bootstrap.Modal($("#modal-payment"));
let myModalPayment = document.getElementById("modal-payment");
let modalTransactionSuccess = new bootstrap.Modal(
  $("#modal-transaction-success"),
);
let myModalTransactionSuccess = document.getElementById(
  "modal-transaction-success",
);

let transactionPayment = {
  totalAmount: 0, // Total belanja
  paymentMethod: "", // "cash", "qris", "transfer", dll
  paymentAmount: 0, // Uang yang dibayarkan/diterima
  changeAmount: 0, // Kembalian (jika cash)
  isManualCash: false, // Penanda apakah kasir mengetik manual uang cash
};

let lastTransactionId = 0;

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
                        <h6 class="mb-0 text-dark">${item.productName}</h6>
                        <span class="text-muted">${item.variantName}</span>
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

function renderCashSuggestions(grandTotal) {
  if (grandTotal <= 0) return [];

  const suggestions = new Set();

  // Opsi pertama: Uang Pas
  suggestions.add(grandTotal);

  // Opsi Pembulatan ke Kelipatan Rp10.000 terdekat di atasnya
  const roundTo10k = Math.ceil(grandTotal / 10000) * 10000;
  if (roundTo10k > grandTotal) suggestions.add(roundTo10k);

  // Tambahkan standar pecahan uang Indonesia yang logis di atas total belanja
  const indonesianBanknotes = [10000, 50000, 100000];

  indonesianBanknotes.forEach((note) => {
    if (note > grandTotal) {
      suggestions.add(note);
    }
    // Skenario uang pas lembaran: misal belanja 65rb, orang bayar 50rb + 20rb = 70rb
    const comboNote = Math.ceil(grandTotal / note) * note;
    if (comboNote > grandTotal) {
      suggestions.add(comboNote);
    }
  });

  // Ubah Set kembali ke Array, urutkan dari yang terkecil, dan ambil maksimal 4 saran teratas
  const result = Array.from(suggestions)
    .sort((a, b) => a - b)
    .slice(0, 3);

  let htmlCash = "";

  result.map((cash, i) => {
    htmlCash += `<input
                  type="radio"
                  class="btn-check cash-suggestion"
                  name="payment-method"
                  id="tunai${i}"
                  autocomplete="off"
                  data-amount="${cash}"
                />
                <label class="btn btn-outline-dark py-3 flex-fill" for="tunai${i}">
                  ${formatRupiah(cash)}
                </label>`;
  });

  $("#list-payment-cash").html(htmlCash);
}

function showPaymentModal() {
  const rawCart = localStorage.getItem("cart");
  if (!rawCart) return;

  const items = JSON.parse(rawCart);

  // Hitung total keseluruhan
  const totalAmount = items.reduce(
    (total, item) => total + Number(item.subtotal),
    0,
  );

  updatePaymentState({ totalAmount: totalAmount });

  $("#modal-payment-title").html(formatRupiah(totalAmount));

  renderCashSuggestions(totalAmount);

  modalPayment.show();
}

function updatePaymentState(changes) {
  // 1. Gabungkan perubahan data baru
  transactionPayment = { ...transactionPayment, ...changes };

  // 2. Hitung otomatis kembalian (hanya jika metodenya cash)
  if (transactionPayment.paymentMethod === "cash") {
    transactionPayment.changeAmount =
      transactionPayment.paymentAmount - transactionPayment.totalAmount;
  } else {
    transactionPayment.changeAmount = 0;
  }

  // 3. SINKRONISASI UI MODAL
  $("#input-payment").val(transactionPayment.paymentAmount || "");

  // Tampilkan nama metode di judul modal (jika ada)
  const methodTitle = transactionPayment.paymentMethod
    ? `${transactionPayment.paymentMethod.toUpperCase()} -`
    : "";
  $("#modal-payment-method-title").html(methodTitle);

  if (
    transactionPayment.paymentMethod === "cash" &&
    transactionPayment.changeAmount > 0
  ) {
    $("#payment-change").val(formatRupiah(transactionPayment.changeAmount));
  } else {
    $("#payment-change").val("");
  }

  // Disable submit button jika nominal PEMBAYARAN/PAYMENT tidak SESUAI
  if (transactionPayment.paymentAmount < transactionPayment.totalAmount) {
    $("#btn-submit-transaction").attr("disabled", true);
  } else {
    $("#btn-submit-transaction").attr("disabled", false);
  }

  // Toggle Class Highlight untuk input manual Cash
  const isManual = transactionPayment.isManualCash;
  $("#label-input-payment").toggleClass("bg-black text-white", isManual);
  $("#input-payment").toggleClass("border-2 border-black", isManual);
}

function createTransaction(dataTransaction) {
  $.LoadingOverlay("show");
  const URL = API + "/transactions";
  $.ajax({
    url: URL,
    method: "POST",
    data: dataTransaction,
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      lastTransactionId = data.id;

      $("#success-payment").html(formatRupiah(dataTransaction.payment_amount));
      $("#success-payment-method").html(
        dataTransaction.payment_method.toUpperCase(),
      );
      $("#success-change").html(formatRupiah(dataTransaction.change_amount));

      modalPayment.hide();
      modalTransactionSuccess.show();
    },
    error: function (error) {
      console.log(error);
    },
    complete: function () {
      $.LoadingOverlay("hide");
    },
  });
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

// Reset total & kembalikan state transaksi ke default mutlak saat modal ditutup
myModalPayment.addEventListener("hidden.bs.modal", function () {
  $(".payment-method").prop("checked", false);
  $("#payment-customer-name").html("");
  $("#container-saran-uang").html(""); // Bersihkan tombol saran uang

  // Reset State
  transactionPayment = {
    totalAmount: 0,
    paymentMethod: "",
    paymentAmount: 0,
    changeAmount: 0,
    isManualCash: false,
  };
  updatePaymentState({});
});

// Reset cart saat modal ditutup
myModalTransactionSuccess.addEventListener("hidden.bs.modal", function () {
  localStorage.removeItem("customer");
  localStorage.removeItem("cart");
  updatePaymentState({});
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
  debounce(() => {
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
      transactionTypeName: customerObj.transactionType.name,
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

// Event: Klik bayar (Toggle modal Payment)
$(document).on("click", "#btn-payment", function () {
  const rawCustomer = localStorage.getItem("customer");

  if (rawCustomer) {
    const savedCustomer = JSON.parse(rawCustomer);
    $("#payment-customer-name").html(
      `${savedCustomer.name} | <span class="text-muted">${savedCustomer.transactionTypeName}</span>`,
    );
  }

  showPaymentModal();
});

// Event: Klik/pilih metode pembayaran lain NON CASH
$(document).on("change", "#transfer, #qris, #edc", function () {
  const method = $(this).data("method");

  updatePaymentState({
    paymentMethod: method,
    paymentAmount: transactionPayment.totalAmount,
    isManualCash: false,
  });
});

// Event: Klik tombol SARAN CASH DINAMIS (cash suggestion)
$(document).on("change", ".cash-suggestion", function () {
  const amount = Number($(this).data("amount"));

  updatePaymentState({
    paymentMethod: "cash",
    paymentAmount: amount,
    isManualCash: false,
  });
});

// Event: Edit input manual
$(document).on("keyup", "#input-payment", function () {
  const inputVal = Number($(this).val());

  $('input[name="payment-method"]').prop("checked", false);

  updatePaymentState({
    paymentMethod: "cash",
    paymentAmount: inputVal,
    isManualCash: true,
  });
});

// Event: klik BAYAR (Submit Transaction)
$(document).on("click", "#btn-submit-transaction", function () {
  const dataCustomer = JSON.parse(localStorage.getItem("customer")) || {};
  const datacart = JSON.parse(localStorage.getItem("cart"));

  const dataTransaction = {
    total_amount: transactionPayment.totalAmount,
    payment_amount: transactionPayment.paymentAmount,
    change_amount: transactionPayment.changeAmount,
    payment_method: transactionPayment.paymentMethod,
    include_revenue: dataCustomer.include_revenue,
    customerId: dataCustomer.id,
    transactionTypeId: dataCustomer.transactionTypeId,
    transactionDetails: datacart,
  };

  createTransaction(dataTransaction);
});

// Event: Klik PRINT RECEIPT transaksi berhasil
$(document).on("click", "#btn-print-receipt", function () {
  const URL = `${config.ENV_URL}/transactions/${lastTransactionId}`;

  $.ajax({
    url: URL,
    method: "GET",
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (response) {
      const transaction = response.data;
      const struk = [];

      // 1. Header Toko (Di-center agar rapi)
      struk.push(formatCenter("// UD MURTI AJI ////"));
      struk.push(
        formatCenter(
          "Jl. Karang Kencana No.51, Panjunan, Kec. Lemahwungkuk, Kota Cirebon, Jawa Barat 45112",
        ),
      );
      struk.push(formatCenter("Telp/WA 0853 1457 9001"));
      struk.push(drawLine());

      // 2. Informasi Transaksi
      const formattedDate = moment(transaction.date)
        .tz("Asia/Jakarta")
        .format("DD/MM/YYYY HH:mm");
      struk.push(`Nama: ${transaction.customer?.name || "Umum"}`);
      struk.push(`Nota: ${transaction.receipt_no}`);
      struk.push(`Tanggal: ${formattedDate}`);
      struk.push(drawLine());

      // 3. Item Produk
      transaction.details.forEach((item) => {
        // Nama Produk
        struk.push(item.productName);

        // Varian (jika ada dan berbeda dengan nama produk)
        if (item.variantName && item.variantName !== item.productName) {
          struk.push(` # ${item.variantName}`);
        }

        // Hitung baris harga: "x1 @20.000" di kiri, "20.000" di kanan
        const qtyPriceLabel = ` x${item.qty} @${formatCurrency(item.price)}`;
        const subtotalValue = formatCurrency(item.subtotal);

        struk.push(formatLeftRight(qtyPriceLabel, subtotalValue));
      });

      struk.push(drawLine());

      // 4. Ringkasan Pembayaran (Rata Kiri Kanan)
      const paymentMethodStr = transaction.payment_method
        ? transaction.payment_method.charAt(0).toUpperCase() +
          transaction.payment_method.slice(1)
        : "Cash";

      struk.push(
        formatLeftRight("Total", formatCurrency(transaction.total_amount)),
      );
      struk.push(
        formatLeftRight(
          `Bayar (${paymentMethodStr})`,
          formatCurrency(transaction.payment_amount),
        ),
      );
      struk.push(
        formatLeftRight("Kembalian", formatCurrency(transaction.change_amount)),
      );

      struk.push(drawLine());

      // 5. Footer
      struk.push(formatCenter("Terima kasih"));
      struk.push("\n\n"); // Beri space kosong di akhir agar tidak terpotong saat disobek

      // 6. Kirim ke RawBT
      const escPosData = encodeURIComponent(struk.join("\n"));

      window.location.href = `rawbt://${escPosData}`;
    },
    error: function (xhr, status, error) {
      console.error("Gagal mengambil data transaksi:", error);
      alert("Gagal mencetak struk, silakan coba lagi.");
    },
  });
});

// $(document).on("click", "#btn-print-receipt", function () {
//   // reset
//   printTransaksi = {
//     ...printTransaksi,
//     date: "",
//     name: "",
//     no_nota: "",
//     items: [],
//     total: 0,
//     payment_method: "",
//     payment: "",
//     change: 0,
//   };

//   const URL = config.ENV_URL + "/transactions/" + lastTransactionId;
//   $.ajax({
//     url: URL,
//     method: "GET",
//     headers: {
//       Authorization: Cookies.get("user-token"),
//     },
//     success: function (data) {
//       const datas = data.data;

//       datas.details.forEach((item, index) => {
//         printTransaksi.items.push({
//           price: item.price,
//           productName: item.productName,
//           qty: item.qty,
//           subtotal: item.subtotal,
//           variantName: item.variantName,
//         });
//       });

//       printTransaksi.date = moment(datas.date)
//         .tz("Asia/Jakarta")
//         .format("DD/MM/YYYY HH:mm");
//       printTransaksi.name = datas.customer.name;
//       printTransaksi.no_nota = datas.receipt_no;
//       printTransaksi.total = datas.total_amount;
//       printTransaksi.payment_method =
//         datas.payment_method.toString().charAt(0).toUpperCase() +
//         datas.payment_method.slice(1);
//       printTransaksi.payment = datas.payment_amount;
//       printTransaksi.change = datas.change_amount;

//       let struk = [];

//       struk.push(printTransaksi.store);
//       struk.push(printTransaksi.address);
//       struk.push(printTransaksi.phone);
//       struk.push("--------------------------------");
//       struk.push("Nama: " + printTransaksi.name);
//       struk.push("Order ID: " + printTransaksi.no_nota);
//       struk.push("Tanggal: " + printTransaksi.date);
//       struk.push("--------------------------------");

//       printTransaksi.items.forEach((item) => {
//         struk.push(item.productName); // nama produk

//         // varian (jika berbeda)
//         if (item.variantName && item.variantName !== item.productName) {
//           struk.push(" # " + item.variantName);
//         }

//         // harga satuan dan subtotal
//         let line = ` x${item.qty} @${item.price}`;
//         struk.push(line + `${item.subtotal}`.padStart(18));
//       });

//       struk.push("--------------------------------");
//       struk.push("Total                  " + printTransaksi.total);
//       struk.push("Bayar                  " + printTransaksi.payment);
//       struk.push(printTransaksi.payment_method);
//       struk.push("Kembalian              " + printTransaksi.change);
//       struk.push("--------------------------------");
//       struk.push("Terima kasih");

//       let escPosData = encodeURIComponent(struk.join("\n"));
//       window.location.href = "rawbt://" + escPosData;
//     },
//   });
// });
