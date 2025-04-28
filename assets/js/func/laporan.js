$(function () {
  let defaultDate = getCurrentDate("y");
  $("#datepicker").val(defaultDate);
  $("#datepicker").datepicker({
    dateFormat: "dd-mm-yy",
    defaultDate: defaultDate,
  });
});

const API = config.ENV_URL;
$("#btn-print-report").attr("disabled", true);

const modalTutup = document.getElementById("modal-tutup-laporan");
const inputTutup = document.getElementById("input-total-earned");

modalTutup.addEventListener("shown.bs.modal", () => {
  inputTutup.focus();
});

modalTutup.addEventListener("hidden.bs.modal", () => {
  $("#input-total-didapatkan").val("");
  $("#selisih").html("Rp. 0");
  $("#btn-cetak-laporan").attr("disabled", true);
});
$("#btn-cetak-laporan").attr("disabled", true);

let bsModalTutuplaporan = new bootstrap.Modal($("#modal-tutup-laporan"));
let bsModalItemSold = new bootstrap.Modal($("#modal-item-sold"));

$(document).ready(function () {
  $(document).on("click", "#btn-tutup-laporan", function () {
    bsModalTutuplaporan.show();
  });

  $(document).on("keyup", "#input-total-earned", function () {
    const reportSummary = JSON.parse(localStorage.getItem("report-summary"));
    let difference =
      parseInt($(this).val()) - parseInt(reportSummary.totalCash);
    $("#difference").html(formatRupiah(difference));
    const newData = {
      ...reportSummary,
      totalEarned: $(this).val(),
      difference: difference,
    };

    Cookies.set("report-summary", JSON.stringify(newData));

    if ($(this).val().length == 0) {
      $("#btn-print-report").attr("disabled", true);
    } else {
      $("#btn-print-report").attr("disabled", false);
    }
  });

  $(document).on("click", "#btn-print-report", function () {
    $("#input-total-earned").val("");
    $("#difference").html("");
    $("#btn-print-report").attr("disabled", true);
    bsModalTutuplaporan.hide();
    let is_mobile = /android|mobile/gi.test(navigator.userAgent);
    let url = "print-laporan.php";
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
        "Cetak laporan",
        "top=100,left=100,width=700,height=600,menubar=no,status=no,titlebar=no"
      );
    }
  });

  $(document).on("click", "#btn-hari-ini", function () {
    $(this).addClass("active");
    localStorage.setItem("date-report", getCurrentDate("y"));
    getReport(getCurrentDate());
  });

  $(document).on("click", "#btn-item-sold", function () {
    const itemSOld = JSON.parse(localStorage.getItem("item-sold"));
    let html = "";
    itemSOld.map((item) => {
      html += `<tr>
                <td>
                  <span>${item.productName}</span><br />
                  <span class="text-secondary">${item.variantName}</span>
                </td>
                <td class="text-center" id="Pembayaran_tunai">${item.totalQty}</td>
              </tr>`;
    });
    $("#list-item-sold").html(html);

    bsModalItemSold.show();
  });

  $(document).on("change", "#datepicker", function () {
    const tgl = $(this).val().split("-");
    const tanggal = tgl[2] + "-" + tgl[1] + "-" + tgl[0];
    $("#btn-hari-ini").removeClass("active");
    if (tanggal == getCurrentDate()) {
      $("#btn-hari-ini").addClass("active");
    }
    localStorage.setItem("date-report", $(this).val());
    getReport(tanggal);
  });

  const tgl = getCurrentDate();
  getReport(tgl);
  localStorage.setItem("date-report", getCurrentDate("y"));
});

function getReport(date) {
  const URL = API + "/reports/pos";
  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ date: date }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      localStorage.setItem(
        "item-sold",
        JSON.stringify(data.data.transactionDetails)
      );

      moment.locale("id");
      $("#tanggal").html(moment(date).tz("Asia/Jakarta").format("LL"));
      const datas = data.data;

      $("#total-expected").html(formatRupiah(datas.totalCash));

      localStorage.setItem("report-summary", JSON.stringify(datas));

      const itemSold = datas.transactionDetails.reduce(
        (acc, curr) => acc + parseInt(curr.totalQty),
        0
      );

      $("#item-sold").html(itemSold);

      let html = "";
      datas.transaction.map(({ transactionTypeName, payments }) => {
        html += `<div class="text-center fs-5">${transactionTypeName}</div>
              <hr style="margin: 0" />
              <table class="table table-sm mt-2 table-hover">
                <tbody>`;

        payments.map(({ payment_method, total }) => {
          html += `<tr>
                    <td class="text-capitalize">${payment_method}</td>
                    <td class="text-end" id="pembayaran-tunai">
                      ${formatRupiah(total)}
                    </td>
                  </tr>`;
        });

        const total = payments.reduce((acc, curr) => acc + curr.total, 0);

        html += `<tr class="fw-bold">
                    <td style="background:#d7d7d7" >Total</td>
                    <td style="background:#d7d7d7"  class="text-end" id="total-uang-diharapkan">
                      ${formatRupiah(total)}
                    </td>
                  </tr>
                </tbody>
              </table>`;
      });

      $("#list-report").html(html);
    },
  });
}

function getCurrentDate(reverse) {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  let tanggal;
  if (reverse == "y") {
    tanggal = sprintf(dd) + "-" + sprintf(mm) + "-" + yy;
  } else {
    tanggal = yy + "-" + sprintf(mm) + "-" + sprintf(dd);
  }
  return tanggal;
}

function sprintf(str) {
  let result = str;
  if (str.toString().length == 1) {
    result = "0" + str;
  }
  return result;
}
