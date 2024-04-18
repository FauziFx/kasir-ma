$(function () {
  let defaultDate = getCurrentDate("y");
  $("#datepicker").val(defaultDate);
  $("#datepicker").datepicker({
    dateFormat: "dd-mm-yy",
    defaultDate: defaultDate,
  });
});

const API = "http://localhost:5000/";

const modalMasuk = document.getElementById("modal-masuk");
const inputMasuk = document.getElementById("input-total-masuk");

modalMasuk.addEventListener("shown.bs.modal", () => {
  inputMasuk.focus();
});

const modalKeluar = document.getElementById("modal-keluar");
const inputKeluar = document.getElementById("input-total-keluar");

modalKeluar.addEventListener("shown.bs.modal", () => {
  inputKeluar.focus();
});

const modalTutup = document.getElementById("modal-tutup-laporan");
const inputTutup = document.getElementById("input-total-didapatkan");

modalTutup.addEventListener("shown.bs.modal", () => {
  inputTutup.focus();
});

modalTutup.addEventListener("hidden.bs.modal", () => {
  $("#input-total-didapatkan").val("");
  $("#selisih").html("Rp. 0");
  $("#btn-cetak-laporan").attr("disabled", true);
});
$("#btn-cetak-laporan").attr("disabled", true);

let bsModalPemasukan = new bootstrap.Modal($("#modal-masuk"));
let bsModalPengeluaran = new bootstrap.Modal($("#modal-keluar"));
let bsModalTutuplaporan = new bootstrap.Modal($("#modal-tutup-laporan"));
let bsModalItemTerjual = new bootstrap.Modal($("#modal-item-terjual"));
$(document).ready(function () {
  $(document).on("click", "#pemasukan", function () {
    const dataMasuk = JSON.parse(localStorage.getItem("pemasukan")).data;
    const tglLaporan = localStorage.getItem("tanggal-laporan");
    if (getCurrentDate("y") == tglLaporan) {
      $(".form-input-kas").show();
      $(".btn-simpan-kas").show();
    } else {
      $(".form-input-kas").hide();
      $(".btn-simpan-kas").hide();
    }
    let html = "";
    dataMasuk.map((item) => {
      html +=
        `<tr>
                <td>
                  <span class="fw-semibold">` +
        formatRupiah(item.total) +
        `</span>
                  <br />
                  <span>
                    ` +
        item.keterangan +
        `
                  </span>
                </td>
              </tr>`;
    });

    $("#list-data-masuk").html(html);

    bsModalPemasukan.show();
  });

  $(document).on("click", "#pengeluaran", function () {
    const dataKeluar = JSON.parse(localStorage.getItem("pengeluaran")).data;
    const tglLaporan = localStorage.getItem("tanggal-laporan");
    if (getCurrentDate("y") == tglLaporan) {
      $(".form-input-kas").show();
      $(".btn-simpan-kas").show();
    } else {
      $(".form-input-kas").hide();
      $(".btn-simpan-kas").hide();
    }
    let html = "";
    dataKeluar.map((item) => {
      html +=
        `<tr>
                <td>
                  <span class="fw-semibold">` +
        formatRupiah(item.total) +
        `</span>
                  <br />
                  <span>
                    ` +
        item.keterangan +
        `
                  </span>
                </td>
              </tr>`;
    });

    $("#list-data-keluar").html(html);

    bsModalPengeluaran.show();
  });

  $(document).on("click", "#btn-tutup-laporan", function () {
    const dataLaporan = JSON.parse(localStorage.getItem("laporan-ringkas"));
    const pemasukan = JSON.parse(localStorage.getItem("pemasukan")).total;
    const pengeluaran = JSON.parse(localStorage.getItem("pengeluaran")).total;
    $("#ringkas-pembayaran-tunai").html(formatRupiah(dataLaporan.total_tunai));
    $("#ringkas-pemasukan").html(formatRupiah(pemasukan));
    $("#ringkas-pengeluaran").html(formatRupiah(pengeluaran));
    $("#ringkas-total-diharapkan").html(
      formatRupiah(dataLaporan.total_diharapkan)
    );
    bsModalTutuplaporan.show();
  });

  $(document).on("keyup", "#input-total-didapatkan", function () {
    const laporanRingkas = JSON.parse(localStorage.getItem("laporan-ringkas"));
    let selisih =
      parseInt($(this).val()) - parseInt(laporanRingkas.total_diharapkan);
    $("#selisih").html(formatRupiah(selisih));
    const newData = {
      ...laporanRingkas,
      total_didapatkan: $(this).val(),
      selisih: selisih,
    };

    Cookies.set("laporan-ringkas", JSON.stringify(newData));
    localStorage.setItem("laporan-ringkas", JSON.stringify(newData));

    if ($(this).val().length == 0) {
      $("#btn-cetak-laporan").attr("disabled", true);
    } else {
      $("#btn-cetak-laporan").attr("disabled", false);
    }
  });

  $(document).on("click", "#btn-cetak-laporan", function () {
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

  $(document).on("click", ".btn-simpan-kas", function () {
    const jenis = $(this).data("jenis");
    const totalMasuk = $("#input-total-masuk");
    const keteranganMasuk = $("#input-keterangan-masuk");
    const totalKeluar = $("#input-total-keluar");
    const keteranganKeluar = $("#input-keterangan-keluar");
    let dataKas = {};
    if (jenis == "masuk") {
      dataKas = {
        jenis: "masuk",
        total: totalMasuk.val(),
        keterangan: keteranganMasuk.val(),
      };
    } else {
      dataKas = {
        jenis: "keluar",
        total: totalKeluar.val(),
        keterangan: keteranganKeluar.val(),
      };
    }

    const URL = API + "api/kas";
    $.ajax({
      url: URL,
      method: "POST",
      data: dataKas,
      headers: {
        Authorization: Cookies.get("user-token"),
      },
      success: function (data) {
        getLaporan(getCurrentDate());
        getKas(getCurrentDate());
        bsModalPemasukan.hide();
        bsModalPengeluaran.hide();
        totalMasuk.val("");
        totalKeluar.val("");
        keteranganMasuk.val("");
        keteranganKeluar.val("");
      },
    });
  });

  $(document).on("click", "#btn-hari-ini", function () {
    $(this).addClass("active");
    localStorage.setItem("tanggal-laporan", getCurrentDate("y"));
    getLaporan(getCurrentDate());
    getKas(getCurrentDate());
  });

  $(document).on("click", "#btn-item-terjual", function () {
    const itemTerjual = JSON.parse(localStorage.getItem("item-terjual"));
    let html = "";
    itemTerjual.map((item) => {
      html +=
        `<tr>
              <td>
                <span>` +
        item.nama_produk +
        `</span><br />
                <span class="text-secondary">` +
        item.nama_varian +
        `</span>
              </td>
              <td class="text-center" id="Pembayaran_tunai">` +
        item.qty +
        `</td>
            </tr>`;
    });
    $("#list-item-terjual").html(html);

    bsModalItemTerjual.show();
  });

  $(document).on("change", "#datepicker", function () {
    const tgl = $(this).val().split("-");
    const tanggal = tgl[2] + "-" + tgl[1] + "-" + tgl[0];
    $("#btn-hari-ini").removeClass("active");
    if (tanggal == getCurrentDate()) {
      $("#btn-hari-ini").addClass("active");
    }
    localStorage.setItem("tanggal-laporan", $(this).val());
    getKas(tanggal);
    getLaporan(tanggal);
  });

  const tgl = getCurrentDate();
  getKas(tgl);
  getLaporan(tgl);
  localStorage.setItem("tanggal-laporan", getCurrentDate("y"));
});

function getLaporan(tanggal) {
  const URL = API + "api/laporan/pos";
  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ tanggal: tanggal }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      moment.locale("id");
      $("#tanggal").html(moment(tanggal).tz("Asia/Jakarta").format("LL"));
      const datas = data.data;
      console.log(datas);

      let total_tunai = datas.total_tunai;
      let transfer = datas.total_transfer;
      let qris = datas.total_qris;
      let edc = datas.total_edc;
      let total_lainnya = parseInt(transfer) + parseInt(qris) + parseInt(edc);
      localStorage.setItem("item-terjual", JSON.stringify(datas.item_terjual));
      $("#item-terjual").html(datas.total_item_terjual);
      $("#pembayaran-tunai").html(formatRupiah(total_tunai));
      $("#transfer").html(formatRupiah(transfer));
      $("#qris").html(formatRupiah(qris));
      $("#edc").html(formatRupiah(edc));
      $("#total-lainnya").html(formatRupiah(total_lainnya));
      $("#total-magrup").html(formatRupiah(datas.total_magrup));
      const pemasukan = JSON.parse(localStorage.getItem("pemasukan")).total;
      const pengeluaran = JSON.parse(localStorage.getItem("pengeluaran")).total;
      const totalUangDiharapkan =
        parseInt(total_tunai) + parseInt(pemasukan) - parseInt(pengeluaran);
      $("#total-uang-diharapkan").html(formatRupiah(totalUangDiharapkan));
      const dataRingkas = {
        total_item_terjual: datas.total_item_terjual,
        total_tunai: total_tunai,
        pemasukan: pemasukan,
        pengeluaran: pengeluaran,
        total_diharapkan: totalUangDiharapkan,
        total_transfer: transfer,
        total_qris: qris,
        total_edc: edc,
        total_lainnya: total_lainnya,
        total_magrup: datas.total_magrup,
      };
      localStorage.setItem("laporan-ringkas", JSON.stringify(dataRingkas));
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

function getKas(tanggal) {
  const URL = API + "api/kas";
  $.ajax({
    url: URL,
    method: "GET",
    data: jQuery.param({ tanggal: tanggal }),
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      const datas = data.data;
      const masuk = datas.filter(function (item) {
        return item.jenis == "masuk";
      });
      const keluar = datas.filter(function (item) {
        return item.jenis == "keluar";
      });
      const totalMasuk = masuk.reduce((accum, item) => accum + item.total, 0);
      const totalKeluar = keluar.reduce((accum, item) => accum + item.total, 0);

      const dataMasuk = {
        total: totalMasuk,
        data: masuk,
      };

      const dataKeluar = {
        total: totalKeluar,
        data: keluar,
      };

      localStorage.setItem("pemasukan", JSON.stringify(dataMasuk));
      localStorage.setItem("pengeluaran", JSON.stringify(dataKeluar));

      $("#pemasukan").html(
        formatRupiah(totalMasuk) + `<i class="bi-chevron-right"></i>`
      );
      $("#pengeluaran").html(
        "-" + formatRupiah(totalKeluar) + `<i class="bi-chevron-right"></i>`
      );
    },
  });
}
