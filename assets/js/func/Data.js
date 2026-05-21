let db;
const request = indexedDB.open("DBMA", 1);

request.onerror = function (event) {
  console.error("Gagal membuka IndexedDB:", event.target.error);
};

request.onsuccess = function (event) {
  db = event.target.result; // Simpan koneksi ke variabel global db
  console.log("Database siap.");
  // 2. JALANKAN APP HANYA JIKA DB SUDAH SIAP
  initApp();
};

request.onupgradeneeded = function (e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains("products")) {
    // Menggunakan "id" dari API sebagai keyPath utama
    const productStore = db.createObjectStore("products", { keyPath: "id" });
    productStore.createIndex("categoryId", "categoryId", { unique: false });
  }
  if (!db.objectStoreNames.contains("categories")) {
    // Menggunakan "id" dari API sebagai keyPath utama
    db.createObjectStore("categories", { keyPath: "id" });
  }
};

async function initApp() {
  const dbIsEmpty = await checkDatabase();

  if (!dbIsEmpty) {
    // Show Categories
    showCategories();
    return;
  }

  getData();
}

// Get Produk dan Kategori from API
function getData(categoryId = "", name) {
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
      showProducts();
    })
    .catch((error) => {
      console.error("Terjadi kesalahan:", error);
    })
    .finally(() => {
      $.LoadingOverlay("hide");
    });
}

// Save data From API to IndexDB
function saveDatabase(data, store) {
  return new Promise((resolve, reject) => {
    // Mulai transaksi readwrite untuk object store
    const transaction = db.transaction(["categories", "products"], "readwrite");
    const objectStore = transaction.objectStore(store);

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

// Cek Ketersediaan Database
function checkDatabase() {
  return new Promise((resolve) => {
    const transaction = db.transaction(["categories", "products"], "readonly");
    const storeCat = transaction.objectStore("categories");
    const storeProd = transaction.objectStore("products");

    const countProd = storeProd.count();
    const countCat = storeCat.count();

    countProd.onsuccess = function () {
      countCat.onsuccess = function () {
        // Mengembalikan TRUE jika salah satu atau kedua store kosong (perlu isi data)
        // Mengembalikan FALSE jika kedua store sudah ada isinya
        if (countProd.result === 0 || countCat.result === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
    };

    transaction.onerror = function () {
      // Jika terjadi error transaksi, anggap saja kosong agar sistem mencoba fetch ulang
      resolve(true);
    };
  });
}
