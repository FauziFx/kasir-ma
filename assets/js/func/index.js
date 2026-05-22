// Global Variable
const API = config.ENV_URL;

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
