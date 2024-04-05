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
  if (input.toString().length > 3) {
    var output = (input / 1000).toFixed(3);
  } else if (isNaN(input)) {
    output = 0;
  } else {
    output = input;
  }
  return "Rp. " + output;
}
