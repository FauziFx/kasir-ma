// Global Variable
const API = config.ENV_URL;

// Konfigurasi konstan untuk Printer Thermal (Kertas 58mm biasanya 32 karakter)
const PRINTER_WIDTH = 32;

// Helper: Membuat garis pembatas
const drawLine = () => "-".repeat(PRINTER_WIDTH);

// Helper: Format angka ke ribuan (contoh: 50000 -> 50.000)
const formatCurrency = (amount) => {
  return Number(amount).toLocaleString("id-ID");
};

// Helper: Mengatur teks kiri dan kanan agar rata (Justify)
const formatLeftRight = (leftStr, rightStr) => {
  const spaceCount = PRINTER_WIDTH - (leftStr.length + rightStr.length);
  return spaceCount > 0
    ? leftStr + " ".repeat(spaceCount) + rightStr
    : leftStr + " " + rightStr;
};

// Helper: Mengetengahkan teks (Center)
const formatCenter = (text) => {
  const spaceCount = Math.floor((PRINTER_WIDTH - text.length) / 2);
  return spaceCount > 0 ? " ".repeat(spaceCount) + text : text;
};

$(document).ready(function () {
  // Progress bar
  progressBar();

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
function formatRupiah(nominal) {
  return "Rp" + Number(nominal).toLocaleString("id-ID");
}

// Progress Bar Animation
function progressBar(url) {
  $(".progress").show();
  $(".progress-bar").animate(
    {
      width: "100%",
    },
    1000,
  );
  setTimeout(function () {
    $(".progress").hide();
    $(".progress-bar").css("width", "0%");
    if (url != undefined) {
      window.location.href = url;
    }
  }, 1100);
}
