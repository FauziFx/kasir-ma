$(document).ready(function () {
  moment.locale("id");
  $("#detail-transaction").hide();
});
let AUTH_HEADER = Cookies.get("user-token");
let dataCustomers = [];
let previousValues = { payment: "", customer: "" };

// Get data customer
function getCustomers() {
  const API = config.ENV_URL;
  const URL = API + "/customers";
  $.ajax({
    url: URL,
    method: "GET",
    headers: {
      Authorization: AUTH_HEADER,
    },
    success: function (data) {
      dataCustomers = data.data;
    },
  });
}

// Get Transaction
function getTransaction({ page = 1, id = null }) {
  let URL = API + "/transactions?page=" + page;

  if (id) {
    URL = API + "/transactions/" + id;
  }

  $.ajax({
    url: URL,
    method: "GET",
    headers: {
      Authorization: AUTH_HEADER,
    },
    success: function (data) {
      dataTransaction = data.data;
      if (id) {
        renderTransactionDetail(dataTransaction);
      } else {
        renderTransaction(dataTransaction, page);
      }
    },
  });
}

// Get payment icon
const getPaymentIcon = (method) => {
  const icons = {
    transfer: "bi-currency-exchange",
    qris: "bi-qr-code-scan",
    edc: "bi-credit-card-2-back",
  };
  return `<i class="${icons[method] || "bi-cash"} fs-4"></i>`;
};

// Render transaction list
function renderTransaction(transactions, currentPage) {
  let html = "";

  $("#btn-loadmore-row").remove();

  transactions.forEach((item) => {
    const icon = getPaymentIcon(item.payment_method);
    const date = moment(item.date).tz("Asia/Jakarta").format("ll LT");

    html += `
            <tr class="transaction" data-id="${item.id}" style="cursor:pointer">
              <td class="item item-${item.id} text-center align-middle">${icon}</td>
              <td class="item item-${item.id}">
                ${formatRupiah(item.total_amount)}<br/>
                <span class="text-secondary fw-normal">${item.receipt_no}</span><br/>
                <span class="text-secondary fw-normal">${date || ""}</span>
              </td>
              <td class="item item-${item.id} text-end align-middle">
                <span class="badge bg-secondary fw-normal">${item.transactionType.name}</span>
              </td>
            </tr>`;
  });

  html += `
          <tr id="btn-loadmore-row">
            <td colspan="3">
              <button class="btn btn-primary w-100" id="btn-loadmore" data-page="${parseInt(currentPage) + 1}">
                Load More
              </button>
            </td>
          </tr>`;

  $("#list-transaction").append(html);
}

// Rendder transaction detail
function renderTransactionDetail(data) {
  const paymentOptions = ["cash", "qris", "transfer", "edc"]
    .map(
      (opt) =>
        `<option value="${opt}" ${data.payment_method === opt ? "selected" : ""}>${opt.toUpperCase()}</option>`,
    )
    .join("");

  const paymentMethodSelect = `<select id="paymentSelect" data-id="${data.id}" class="form-select">${paymentOptions}</select>`;

  let customerOptions = dataCustomers
    .map(
      (item) =>
        `<option value="${item.id}-${item.include_revenue}-${item.transactionTypeId}" ${data.customer.name === item.name ? "selected" : ""}>${item.name}</option>`,
    )
    .join("");
  const customerNameSelect = `<select id="customerSelect" data-id="${data.id}" class="form-select">${customerOptions}</select>`;

  // Populate DOM
  $("#payment_method_icon").html(getPaymentIcon(data.payment_method));
  $("#payment_method").html(paymentMethodSelect);
  $("#receipt_no").html(data.receipt_no);
  $("#customer_name").html(customerNameSelect);
  $("#date").html(moment(data.date).tz("Asia/Jakarta").format("lll"));
  $("#total_amount").html(formatRupiah(data.total_amount));
  $("#payment_amount").html(formatRupiah(data.payment_amount));
  $("#change_amount").html(formatRupiah(data.change_amount));

  // Render Items Table
  let itemsHtml = data.details
    .map(
      (item) => `
              <tr>
                <td class="align-middle text-center"><i class="bi-box text-secondary fs-5"></i></td>
                <td>
                  <span>${item.productName}</span><br />
                  <span class="text-secondary">${item.variantName} <b> x${item.qty}</b></span>
                </td>
                <td class="text-end align-middle">${formatRupiah(item.subtotal)}</td>
              </tr>`,
    )
    .join("");

  $("#detail_item").html(itemsHtml);
}

// Update data transaction
function updateTransactionPatch(id, dataPayload, errorCallback) {
  $.ajax({
    url: `${API}/transactions/${id}`,
    method: "PATCH",
    headers: {
      Authorization: AUTH_HEADER,
    },
    data: dataPayload,
    success: () => {
      getTransaction({ id: id });
      refreshSingleRow(id);
    },
    error: () => {
      alert("Gagal memperbarui data!");
      errorCallback();
    },
  });
}

// Refreshing after update/ Render single Row
function refreshSingleRow(id) {
  $.ajax({
    url: `${API}/transactions/${id}`,
    method: "GET",
    headers: { Authorization: AUTH_HEADER },
    success: function (response) {
      const item = response.data;
      const icon = getPaymentIcon(item.payment_method);
      const date = moment(item.date).tz("Asia/Jakarta").format("ll LT");

      // Buat HTML baru khusus untuk baris yang di-update
      const newRowContent = `
              <td class="item item-${item.id} text-center align-middle">${icon}</td>
              <td class="item item-${item.id}">
                ${formatRupiah(item.total_amount)}<br/>
                <span class="text-secondary fw-normal">${item.receipt_no}</span><br/>
                <span class="text-secondary fw-normal">${date || ""}</span>
              </td>
              <td class="item item-${item.id} text-end align-middle"> 
                <span class="badge bg-secondary fw-normal">${item.transactionType.name}</span>
              </td>
            `;

      // Cari tr dengan data-id tersebut, lalu timpa isinya (.html()) tanpa merusak baris lain
      $(`tr.transaction[data-id="${id}"]`).html(newRowContent);

      // Kembalikan background abu-abu aktif karena barisnya baru di-replace
      $(".item-" + id).css("background", "#d7d7d7");
    },
  });
}

// Ready function
$(document).ready(function () {
  getTransaction({ page: 1 });
  getCustomers();
});

// Klik item transaction
$(document).on("click", ".transaction", function () {
  const transactionId = $(this).data("id");

  // Set id pada btn-print-receipt
  $("#btn-print-receipt").attr("data-id", transactionId);

  $("#detail-transaction").show();
  $(".item").css("background", "#ffffff");
  $(".item-" + transactionId).css("background", "#d7d7d7");

  getTransaction({ id: transactionId });
});

// Load More
$(document).on("click", "#btn-loadmore", function () {
  getTransaction({ page: $(this).data("page") });
});

// Handle Payment Change
$(document).on("focus", "#paymentSelect", function () {
  previousValues.payment = $(this).val();
});
$(document).on("change", "#paymentSelect", function () {
  const $el = $(this);
  const id = $el.data("id");
  const newValue = $el.val();

  if (confirm("Yakin ingin mengganti Metode Pembayaran?")) {
    updateTransactionPatch(id, { payment_method: newValue }, () => {
      $el.val(previousValues.payment);
    });
  } else {
    $el.val(previousValues.payment);
  }
});

// Handle Customer Change
$(document).on("focus", "#customerSelect", function () {
  previousValues.customer = $(this).val();
});
$(document).on("change", "#customerSelect", function () {
  const $el = $(this);
  const id = $el.data("id");
  const [customerId, include_revenue, transactionTypeId] = $el.val().split("-");

  if (confirm("Yakin ingin mengganti customer?")) {
    const payload = { customerId, include_revenue, transactionTypeId };
    updateTransactionPatch(id, payload, () => {
      $el.val(previousValues.customer); // Fix Bug: Sebelumnya salah panggil previousValuePayment
    });
  } else {
    $el.val(previousValues.customer);
  }
});

// Print Nota
$(document).on("click", "#btn-print-receipt", function () {
  printTransaction($(this).data("id"));
});
