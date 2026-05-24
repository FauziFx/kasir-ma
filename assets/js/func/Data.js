let db;
const request = indexedDB.open("DBMA", 1);

request.onerror = function (event) {
  console.error("Gagal membuka IndexedDB:", event.target.error);
};

request.onsuccess = function (event) {
  db = event.target.result;
  console.log("Database siap.");
  initApp();
};

request.onupgradeneeded = function (e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains("products")) {
    const productStore = db.createObjectStore("products", { keyPath: "id" });
    productStore.createIndex("categoryId", "categoryId", { unique: false });
  }
  if (!db.objectStoreNames.contains("categories")) {
    db.createObjectStore("categories", { keyPath: "id" });
  }
};

// ==========================================
// CORE APP INITIALIZATION
// ==========================================

async function initApp() {
  const dbIsEmpty = await checkDatabase();

  // Jika DB sudah ada isinya, langsung render UI
  if (!dbIsEmpty) {
    showCategories();
    return;
  }

  // Jika kosong, ambil data dari API
  fetchAndRefreshData();
}

// Sinkronisasi: Ambil data terbaru darai API dan menimpa isi IndexDB
function fetchAndRefreshData(categoryId = "", name) {
  const URL_Prod = API + "/products?all=true";
  const URL_Cat = API + "/categories?type=main";
  const token = Cookies.get("user-token");

  // Show Loading
  $.LoadingOverlay("show");

  const options = {
    method: "GET",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  };

  Promise.all([fetch(URL_Cat, options), fetch(URL_Prod, options)])
    .then(async ([resCat, resProd]) => {
      if (!resCat.ok || !resProd.ok) {
        throw new Error("Gagal mengambil data dari server");
      }

      const jsonCat = await resCat.json();
      const jsonProd = await resProd.json();

      const dataCat = jsonCat.data || [];
      const dataProd = jsonProd.data || [];

      return Promise.all([
        saveDatabase(dataCat, "categories"),
        saveDatabase(dataProd, "products"),
      ]);
    })
    .then(() => {
      showCategories();

      console.log("Sinkronisasi data berhasil!");
    })
    .catch((error) => {
      console.error("Terjadi kesalahan:", error);
    })
    .finally(() => {
      if ($.LoadingOverlay) $.LoadingOverlay("hide");
    });
}

// ==========================================
// DATABASE UTILITIES (Refactored)
// ==========================================

function saveDatabase(data, storeName) {
  return new Promise((resolve, reject) => {
    // Mulai transaksi readwrite untuk object store
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    // Loop data dari API dan langsung simpan bulat-bulat
    data.forEach((item) => {
      // .put() akan menambah jika belum ada, atau mengupdate jika ID sudah ada
      const request = objectStore.put(item);

      request.onerror = function () {
        console.error(`Gagal menyimpan produk ID: ${item.id}`);
      };
    });

    transaction.oncomplete = function () {
      resolve();
    };

    transaction.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

function checkDatabase() {
  return new Promise((resolve) => {
    const transaction = db.transaction(["categories", "products"], "readonly");
    const storeCat = transaction.objectStore("categories");
    const storeProd = transaction.objectStore("products");

    const countProdReq = storeProd.count();
    const countCatReq = storeCat.count();

    let prodCount = 0;
    let catCount = 0;

    countProdReq.onsuccess = () => {
      prodCount = countProdReq.result;
    };

    countCatReq.onsuccess = () => {
      catCount = countProdReq.result;
    };

    transaction.oncomplete = function () {
      resolve(prodCount === 0 || catCount === 0);
    };

    transaction.onerror = function () {
      // Jika terjadi error transaksi, anggap saja kosong agar sistem mencoba fetch ulang
      resolve(true);
    };
  });
}
