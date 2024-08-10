$(document).ready(function () {
  $("#btn-scan").on("click", function () {
    setInputScanFocus();
  });

  $(document).on("keyup", function (e) {
    if (e.key == "n") {
      setInputScanFocus();
    }
  });

  $("#input-scan").on("keyup", function () {
    if ($(this).val().includes("n")) {
      $(this).val("");
    } else {
      if ($(this).val().length == 7) {
        const kode = $(this).val();
        $(this).val("");
        addToCart(kode);
      }
    }
  });
});

function setInputScanFocus() {
  $("#input-scan").focus();
  $("#input-scan").val("");
}

function addToCart(idVarian) {
  const URL = API + "api/produk/varian/" + idVarian;

  $.ajax({
    url: URL,
    method: "GET",
    headers: {
      Authorization: Cookies.get("user-token"),
    },
    success: function (data) {
      let datas = data.data;
      let cartActive = JSON.parse(localStorage.getItem("cart-active")) || [];
      let cart = {
        harga: datas.harga,
        id_produk: datas.id_produk,
        id_varian: datas.id_varian,
        nama_produk: datas.nama_produk,
        nama_varian: datas.nama_varian,
        qty: 1,
        subtotal: datas.harga,
      };

      let filter = cartActive.filter(function (e) {
        return e.id_varian == cart.id_varian;
      });
      let oldCart = [];

      if (filter.length != 0) {
        oldCart = cartActive.filter(function (e) {
          return e.id_varian != cart.id_varian;
        });
        let qty = { qty: parseInt(filter[0].qty) + 1 };
        let subtotal = { subtotal: qty.qty * parseInt(cart.harga) };
        const result = update(cartActive, cart.id_varian, qty, subtotal);
        localStorage.setItem("cart-active", JSON.stringify(result));
      } else {
        cartActive.push(cart);
        localStorage.setItem("cart-active", JSON.stringify(cartActive));
      }
      getCart();
    },
    error: function (error) {
      console.log(error);
    },
  });
}

function update(arr, id, updateQty, updateSubtotal) {
  return arr.map((item) =>
    item.id_varian === id ? { ...item, ...updateQty, ...updateSubtotal } : item
  );
}
