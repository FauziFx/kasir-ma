// ==========================================
// STATE & GLOBAL VARIABLES
// ==========================================
let modalSaveBill = new bootstrap.Modal($("#modal-save-bill"));
let modalListBill = new bootstrap.Modal($("#modal-list-bill"));
let myModalSaveBill = document.getElementById("modal-save-bill");

// ==========================================
// LOGIC (Manajemen Data & State)
// ==========================================
function checkInputBill() {
  const value = $("#input-bill-name").val().trim();
  // Gunakan properti .prop() daripada .attr() untuk handle disabled Bootstrap 5
  $("#btn-submit-bill").prop("disabled", value.length === 0);
}

// Simpan Bill BARU atau update Bill EDIT
function saveBill(billName) {
  const rawListBill = localStorage.getItem("listBill");
  const rawCustomer = localStorage.getItem("customer");
  const rawCart = localStorage.getItem("cart");
  const currentListBill = rawListBill ? JSON.parse(rawListBill) : [];

  const activeIndex = localStorage.getItem("activeBillIndex");

  let billData = {
    billName: billName,
    customer: JSON.parse(rawCustomer) || "",
    cart: JSON.parse(rawCart),
    date: new Date(),
  };

  if (activeIndex !== null) {
    // MODE UPDATE: Timpa data lama
    currentListBill[Number(activeIndex)] = billData;
    Swal.fire({
      icon: "success",
      text: `${billName} berhasil diperbarui!`,
    });
  } else {
    // MODE SIMPAN BARU: Push ke list
    currentListBill.push(billData);
    Swal.fire({
      icon: "success",
      text: `${billName} berhasil disimpan!`,
    });
  }

  localStorage.setItem("listBill", JSON.stringify(currentListBill));
  clearCurrentTransaction();
}

// Sterilkan data transaksi berjalan setelah simpan bill
function clearCurrentTransaction() {
  localStorage.removeItem("cart");
  localStorage.removeItem("customer");
  localStorage.removeItem("activeBillIndex");

  // Update tampilan
  $("#customer-name").html("+ Pelanggan");

  getCart();
}

function showListBill() {
  const rawListBill = localStorage.getItem("listBill");
  if (!rawListBill) {
    $("#list-bill").html(
      '<tr><td colspan="2" class="text-center text-muted small py-3">Tidak ada bill tersimpan</td></tr>',
    );
    return;
  }

  const items = JSON.parse(rawListBill);
  let html = "";
  const activeBill = localStorage.getItem("activeBillIndex");

  items.forEach((item, i) => {
    const totalBill = item.cart.reduce(
      (total, item) => total + Number(item.subtotal),
      0,
    );
    html += `
      <tr class="bill-items ${activeBill == i ? "bg-light text-muted pe-none opacity-75" : ""}" data-indexbill="${i}" style="cursor: pointer;">
        <td class="ps-4 py-3 align-middle">
          <div class="fw-semibold ${activeBill == i ? "text-secondary" : "text-dark"}">${item.billName}</div>
          <span class="text-muted small" style="font-size: 0.75rem;">
            ${moment(item.date).tz("Asia/Jakarta").format("lll")}
          </span>
        </td>
        
        <td class="align-middle fw-bold text-dark">
          ${formatRupiah(totalBill)}
        </td>
        
        <td class="text-end align-middle pe-4">
          <button 
            class="btn btn-sm btn-light border text-danger btn-delete-bill-item px-2" 
            data-indexbill="${i}" 
            data-name="${item.billName}"
            style="border-radius: 6px;"
          >
            <i class="bi-trash"></i>
          </button>
        </td>
      </tr>`;
  });

  $("#list-bill").html(html);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Autofokus input
myModalSaveBill.addEventListener("shown.bs.modal", function () {
  $("#input-bill-name").focus();
});

// Sterilkan isi teks input saat modal ditutup
myModalSaveBill.addEventListener("hidden.bs.modal", function () {
  $("#input-bill-name").val("");
});

// Event: Klik btn SIMPAN BILL
$(document).on("click", "#btn-save-bill", function () {
  const rawCart = localStorage.getItem("cart");

  if (!rawCart) {
    clearCurrentTransaction();
    return;
  }

  // Jika sedang dalam mode EDIT, ambil nama lamanya otomatis
  const activeIndex = localStorage.getItem("activeBillIndex");
  if (activeIndex !== null) {
    const listBill = JSON.parse(localStorage.getItem("listBill"));
    saveBill(listBill[activeIndex].billName);
  } else {
    let rawCustomer = localStorage.getItem("customer");
    if (rawCustomer) {
      const customer = JSON.parse(rawCustomer);
      $("#input-bill-name").val(customer.name);
    }
    checkInputBill();
    modalSaveBill.show();
  }
});

// Event: Validasi tombol submit
$(document).on("keyup", "#input-bill-name", function () {
  checkInputBill();
});

// Event: klik simpan / Submit bill name ke localstorage
$(document).on("click", "#btn-submit-bill", function () {
  const billName = $("#input-bill-name").val();
  saveBill(billName);
});

// Event: Membuka modal List Bill
$(document).on("click", "#btn-list-bill", function () {
  showListBill();
  modalListBill.show();
});

// Event: klik Bill
$(document).on("click", ".bill-items", function (e) {
  if ($(e.target).closest(".btn-delete-bill-item").length) return;

  const alreadyOpenBill = localStorage.getItem("activeBillIndex");
  const rawCart = localStorage.getItem("cart");

  if (alreadyOpenBill !== null || rawCart) {
    Swal.fire({
      icon: "warning",
      text: "Selesaikan atau simpan dulu transaksi saat ini!",
    });
    modalListBill.hide();
    return;
  }

  const listBill = JSON.parse(localStorage.getItem("listBill"));
  const indexBill = $(this).data("indexbill");
  const targetBill = listBill[indexBill];

  // Set Active Bill
  localStorage.setItem("activeBillIndex", indexBill);

  if (targetBill.customer) {
    $("#customer-name").html(targetBill.customer.name);
    localStorage.setItem("customer", JSON.stringify(targetBill.customer));
  }
  localStorage.setItem("cart", JSON.stringify(targetBill.cart));
  getCart();
  modalListBill.hide();
});

// Event: Menghapus bill permanen
$(document).on("click", ".btn-delete-bill-item", function () {
  const targetIndex = Number($(this).data("indexbill"));
  const targetName = $(this).data("name");
  const activeIndex = localStorage.getItem("activeBillIndex");

  // Jika target bill sedang active
  if (activeIndex !== null && Number(activeIndex) === targetIndex) {
    Swal.fire({
      icon: "error",
      text: "Tidak bisa menghapus bill yang sedang aktif",
    });
    return;
  }

  Swal.fire({
    text: `Hapus permanen bill ${targetName}?`,
    showDenyButton: true,
    showCancelButton: true,
    showConfirmButton: false,
    denyButtonText: "Hapus",
    reverseButtons: true,
  }).then((result) => {
    /* Read more about isConfirmed, isDenied below */
    if (result.isDenied) {
      let listBill = JSON.parse(localStorage.getItem("listBill")) || [];
      listBill.splice(targetIndex, 1);

      if (listBill.length > 0) {
        localStorage.setItem("listBill", JSON.stringify(listBill));

        if (activeIndex !== null && targetIndex < Number(activeIndex)) {
          localStorage.setItem("activeBillIndex", Number(activeIndex) - 1);
        }
      } else {
        localStorage.removeItem("listBill");
      }

      showListBill();
    }
  });
});

// Event: Print active bill
$(document).on("click", "#btn-print-bill", function () {
  const activeBill = localStorage.getItem("activeBillIndex");

  if (!activeBill) return;

  const rawCustomer = localStorage.getItem("customer");
  const rawCart = localStorage.getItem("cart");
  const rawListBill = localStorage.getItem("listBill");

  const dataCustomer = JSON.parse(rawCustomer);
  const dataCart = JSON.parse(rawCart);
  const dataBill = JSON.parse(rawListBill)[activeBill];

  const struk = [];

  // 1. Header Toko (Di-center agar rapi)
  struk.push(formatCenter("BUKAN BUKTI PEMBAYARAN"));
  struk.push("");
  struk.push(formatCenter("UD MURTI AJI"));
  struk.push(
    formatCenter(
      "Jl. Karang Kencana No.51, Panjunan, Kec. Lemahwungkuk, Kota Cirebon, Jawa Barat 45112",
    ),
  );
  struk.push(formatCenter("Telp/WA 0853 1457 9001"));
  struk.push(drawLine());

  // 2. Informasi Transaksi
  const formattedDate = moment(dataBill.date)
    .tz("Asia/Jakarta")
    .format("DD/MM/YYYY HH:mm");
  struk.push(`Nama: ${dataCustomer?.name || "Umum"}`);
  struk.push(`Bill: ${dataBill?.billName}`);
  struk.push(`Tanggal: ${formattedDate}`);
  struk.push(drawLine());

  const totalBill = dataCart.reduce(
    (total, item) => total + Number(item.subtotal),
    0,
  );

  // 3. Item Produk
  dataCart.forEach((item) => {
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

  struk.push(formatLeftRight("Total", formatCurrency(totalBill)));

  struk.push(drawLine());

  // 5. Footer
  struk.push(formatCenter("Terima kasih"));
  struk.push("\n\n"); // Beri space kosong di akhir agar tidak terpotong saat disobek

  // 6. Kirim ke RawBT
  const escPosData = encodeURIComponent(struk.join("\n"));

  window.location.href = `rawbt://${escPosData}`;
});
