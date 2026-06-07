/**
 * Global Constants & State Management
 */
const DATE_FORMAT_UI = "dd-mm-yy";
const DATE_FORMAT_API = "YYYY-MM-DD";

// Initialize Bootstrap Modals
const bsModalTutupLaporan = new bootstrap.Modal($("#modal-tutup-laporan")[0]);
const bsModalItemSold = new bootstrap.Modal($("#modal-item-sold")[0]);

// DOM Elements
const $btnPrintReport = $("#btn-print-report");
const $inputTotalEarned = $("#input-total-earned");
const $differenceDisplay = $("#difference");
const $datepicker = $("#datepicker");
const $btnHariIni = $("#btn-hari-ini");

/**
 * Initialization on Document Ready
 */
$(document).ready(() => {
  initDatePicker();
  initEventHandlers();

  // Load initial report data for today
  const todayApiFormat = moment().format(DATE_FORMAT_API);
  getReport(todayApiFormat);
  localStorage.setItem("date-report", moment().format("DD-MM-YYYY"));
});

/**
 * Initialize jQuery UI Datepicker
 */
function initDatePicker() {
  const defaultDateStr = moment().format("DD-MM-YYYY");
  $datepicker.val(defaultDateStr);

  $datepicker.datepicker({
    dateFormat: DATE_FORMAT_UI,
    defaultDate: defaultDateStr,
  });
}

/**
 * Event Handlers Configuration
 */
function initEventHandlers() {
  // Disable print button initially
  $btnPrintReport.prop("disabled", true);

  // Modal Focus Lifecycle
  const modalTutupEl = document.getElementById("modal-tutup-laporan");
  if (modalTutupEl) {
    modalTutupEl.addEventListener("shown.bs.modal", () =>
      $inputTotalEarned.focus(),
    );
    modalTutupEl.addEventListener("hidden.bs.modal", resetTutupLaporanModal);
  }

  // Event Delegations
  $(document).on("click", "#btn-tutup-laporan", () =>
    bsModalTutupLaporan.show(),
  );
  $(document).on("keyup", "#input-total-earned", handleTotalEarnedInput);
  $(document).on("click", "#btn-hari-ini", handleTodayButtonClick);
  $(document).on("click", "#btn-item-sold", handleItemSoldClick);
  $(document).on("change", "#datepicker", handleDatePickerChange);
}

/**
 * Event Handlers Logic
 */
function resetTutupLaporanModal() {
  $inputTotalEarned.val("");
  $differenceDisplay.html("Rp. 0");
  $btnPrintReport.prop("disabled", true);
}

function handleTotalEarnedInput() {
  const inputValue = $(this).val();
  const reportSummary = JSON.parse(localStorage.getItem("report-summary")) || {
    totalCash: 0,
  };

  const totalEarned = parseInt(inputValue) || 0;
  const totalCashExpected = parseInt(reportSummary.totalCash) || 0;
  const difference = totalEarned - totalCashExpected;

  $differenceDisplay.html(formatRupiah(difference));

  // Sync state to Cookies
  const newData = { ...reportSummary, totalEarned, difference };
  delete newData.transactionDetails;
  Cookies.set("report-summary", JSON.stringify(newData));

  // Toggle Print Button State
  $btnPrintReport.prop("disabled", inputValue.length === 0);
}

function handleTodayButtonClick() {
  $btnHariIni.addClass("active");

  const todayUi = moment().format("DD-MM-YYYY");
  const todayApi = moment().format(DATE_FORMAT_API);

  $datepicker.val(todayUi);
  localStorage.setItem("date-report", todayUi);
  getReport(todayApi);
}

function handleDatePickerChange() {
  const selectedDateStr = $(this).val(); // Format: dd-mm-yy
  const parsedDate = moment(selectedDateStr, "DD-MM-YYYY");
  const apiFormattedDate = parsedDate.format(DATE_FORMAT_API);

  // Toggle active class on "Laporan Hari Ini" button
  const isToday = parsedDate.isSame(moment(), "day");
  $btnHariIni.toggleClass("active", isToday);

  localStorage.setItem("date-report", selectedDateStr);
  getReport(apiFormattedDate);
}

function handleItemSoldClick() {
  const itemsSold = JSON.parse(localStorage.getItem("item-sold")) || [];

  const htmlRows = itemsSold
    .map(
      (item) => `
    <tr>
      <td>
        <span class="fw-medium text-dark">${item.productName}</span><br />
        <span class="text-muted small">${item.variantName || "-"}</span>
      </td>
      <td class="text-center fw-bold text-secondary" style="width: 80px;">
        ${item.totalQty}
      </td>
    </tr>
  `,
    )
    .join("");

  $("#list-item-sold").html(
    htmlRows ||
      '<tr><td colspan="2" class="text-center text-muted">Tidak ada item terjual</td></tr>',
  );
  bsModalItemSold.show();
}

/**
 * API Integration Services
 */
function getReport(dateString) {
  const URL = `${API}/reports/pos`;

  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ date: dateString }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (response) {
      const reportData = response.data;
      if (!reportData) return;

      // LocalStorage Backup Caching
      localStorage.setItem(
        "item-sold",
        JSON.stringify(reportData.transactionDetails || []),
      );
      localStorage.setItem("report-summary", JSON.stringify(reportData));

      // Render Layout Data
      moment.locale("id");
      $("#tanggal").html(
        moment(dateString, DATE_FORMAT_API).tz("Asia/Jakarta").format("LL"),
      );
      $("#total-expected").html(formatRupiah(reportData.totalCash || 0));

      // Calculate and display total items sold
      const totalItemCount = (reportData.transactionDetails || []).reduce(
        (acc, curr) => acc + (parseInt(curr.totalQty) || 0),
        0,
      );
      $("#item-sold").html(totalItemCount);

      // Render Transaction Types Table List
      renderReportList(reportData.transaction || []);
    },
    error: function (xhr, status, error) {
      console.error("Gagal memuat data laporan:", error);
    },
  });
}

/**
 * UI Renderer Helper Component
 */
function renderReportList(transactions) {
  let htmlContent = "";

  transactions.forEach(({ transactionTypeName, payments }) => {
    const totalPayment = payments.reduce(
      (acc, curr) => acc + (curr.total || 0),
      0,
    );

    // Rows mapping for payment methods
    const paymentRows = payments
      .map(
        ({ payment_method, total }) => `
      <tr>
        <td class="text-capitalize text-secondary">${payment_method}</td>
        <td class="text-end fw-medium text-dark">${formatRupiah(total)}</td>
      </tr>
    `,
      )
      .join("");

    // Modern styled card wrapper table
    htmlContent += `
      <div class="mb-4">
        <div class="mt-2">
          <span class="transaction-type-header">${transactionTypeName}</span>
        </div>
        <table class="table table-hover align-middle border border-light-subtle mt-1 shadow-sm small">
          <tbody>
            ${paymentRows}
            <tr class="total-row">
              <td class="fw-semibold">Total</td>
              <td class="text-end fw-bold text-dark">${formatRupiah(totalPayment)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  });

  $("#list-report").html(
    htmlContent ||
      '<div class="text-center text-muted my-4">Tidak ada data transaksi pada tanggal ini.</div>',
  );
}

/**
 * Handle Blueprint / RawBT Printing Action
 */
$(document).on("click", "#btn-print-report", function () {
  // 1. Ambil data rekap dari Cookie yang disimpan saat input total didapatkan
  const rawData = Cookies.get("report-summary");
  if (!rawData) {
    console.error("Data laporan tidak ditemukan di Cookies.");
    return;
  }

  const data = JSON.parse(rawData);

  // 2. Siapkan Objek Cetak dengan Data Terbaru
  const printReport = {
    store: "UD MURTI AJI",
    address: "Jl. Karang Kencana No.51, Panjunan, Cirebon",
    phone: "Telp/WA 0853 1457 9001",
    date: moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm"),
    totalCash: parseInt(data.totalCash) || 0,
    totalEarned: parseInt(data.totalEarned) || 0,
    difference: parseInt(data.difference) || 0,
    transactions: data.transaction || [],
  };

  // 3. Bangun Struktur Teks Cetak Menggunakan Helper Printer
  let struk = [];

  // Header Toko (Rata Tengah)
  struk.push(formatCenter(printReport.store));
  struk.push(formatCenter(printReport.address));
  struk.push(formatCenter(printReport.phone));
  struk.push("");
  struk.push(formatCenter("LAPORAN HARIAN"));
  struk.push(formatCenter(`Tanggal: ${printReport.date}`));
  struk.push(drawLine());

  // Data Keuangan Utama (Rata Kiri Kanan)
  struk.push(
    formatLeftRight(
      "Total Tunai (Sistem)",
      formatCurrency(printReport.totalCash),
    ),
  );
  struk.push(
    formatLeftRight(
      "Total Didapatkan",
      formatCurrency(printReport.totalEarned),
    ),
  );

  // Format khusus tanda minus jika selisih minus
  const diffSign = printReport.difference > 0 ? "+" : "";
  struk.push(
    formatLeftRight(
      "Selisih Fisik",
      diffSign + formatCurrency(printReport.difference),
    ),
  );
  struk.push(drawLine());

  // Rincian Metode Pembayaran per Tipe Transaksi
  printReport.transactions.forEach((type) => {
    // Nama Tipe Transaksi (Misal: // GROSIR)
    struk.push(`// ${type.transactionTypeName.toUpperCase()}`);

    type.payments.forEach((p) => {
      const methodName =
        p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1);
      struk.push(formatLeftRight(` - ${methodName}`, formatCurrency(p.total)));
    });

    // Hitung total per tipe transaksi jika diperlukan visualisasi tambahan di struk
    const subTotal = type.payments.reduce(
      (acc, curr) => acc + (curr.total || 0),
      0,
    );
    struk.push(formatLeftRight("   Total", formatCurrency(subTotal)));
    struk.push(""); // Spasi baris kosong antar jenis transaksi
  });

  struk.push(drawLine());
  struk.push("");
  struk.push(formatCenter("Terima kasih"));
  struk.push("");

  // 4. Proses Encoding dan Pengiriman Target ke Aplikasi RawBT
  let escPosData = encodeURIComponent(struk.join("\n"));
  window.location.href = "rawbt://" + escPosData;
});
