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

// Print transaction
function printTransaction(id) {
  const URL = `${config.ENV_URL}/transactions/${id}`;
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
      struk.push(formatCenter("UD MURTI AJI"));
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
}
