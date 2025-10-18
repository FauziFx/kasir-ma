$(document).ready(function () {
  // Progress bar
  progressBar();
  function progressBar() {
    $(".progress").show();
    $(".progress-bar").animate(
      {
        width: "100%",
      },
      1000
    );
    setTimeout(function () {
      $(".progress").hide();
      $(".progress-bar").css("width", "0%");
    }, 1100);
  }

  // Btn Logout
  $("#btn-logout").on("click", function () {
    Cookies.remove("user-token");
    progressBar();
    setTimeout(function () {
      window.location.href = "login.html";
    }, 1500);
  });
});

// Format Rupiah
function formatRupiah(input) {
  let angka = input.toString();
  var number_string = angka.replace(/[^,\d]/g, "").toString(),
    split = number_string.split(","),
    sisa = split[0].length % 3,
    rupiah = split[0].substr(0, sisa),
    ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  // tambahkan titik jika yang di input sudah menjadi angka ribuan
  if (ribuan) {
    separator = sisa ? "." : "";
    rupiah += separator + ribuan.join(".");
  }

  rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;
  return rupiah ? "Rp" + rupiah : "";
}
