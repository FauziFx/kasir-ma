<html>

<head>
  <title>Print Bill</title>
  <style>
    @media print {
      @page {
        margin: 0;
      }
    }

    body {
      font-size: 11px;
      filter: grayscale(100%);
      font-family: monospace;
    }

    table {
      font-size: 11px;
      width: 100%;
    }

    .container {
      max-width: 228px;
    }

    header {
      text-align: center;
      margin: auto;
      margin-bottom: 10px;
    }

    footer {
      width: 100%;
      text-align: center;
      margin-bottom: 10px;
    }

    hr {
      margin: 10px 0;
      padding: 0;
      height: 1px;
      border: 0;
      border-bottom: 1px solid rgb(49, 49, 49);
      width: 100%;
    }

    .nama-item {
      font-weight: bold;
    }

    table {
      border-collapse: collapse;
    }

    table td {
      border: 0;
    }

    .text-right {
      text-align: right;
    }

    .text-left {
      text-align: left;
    }

    .nama-perusahaan {
      font-weight: bold;
      font-size: 120%;
      margin-bottom: 3px;
    }

    .text-bold {
      font-weight: bold;
    }

    .table {
      width: 100%;
    }

    .dash {
      border-style: dashed;
      margin-top: 0;
    }
  </style>
</head>

<?php
$data = $_COOKIE['print-bill'];
$data = json_decode($data);
// echo "<pre>";
// var_dump($data);
// echo "</pre>";
?>

<!-- <body onload="window.print()"> -->
<body>
  <div class="container">
    <header>
      <div class="nama-perusahaan" style="margin: 15px 0 15px 0">
        Bukan bukti pembayaran
      </div>
      <div class="nama-perusahaan">UD Murti Aji</div>
      <div>
        Jl. Karang Kencana No.51, Panjunan, Kec. Lemahwungkuk, Kota Cirebon,
        Jawa Barat 45112
      </div>
      <div>Telp/WA 0853 1457 9001</div>
    </header>
    <div class="metadata">
      <?php
      $date = explode("pukul", $data->date);

      $tgl = $date[0];
      $jam = $date[1];
      ?>
      <table>
        <tr>
          <td id="tanggal"><?= $tgl ?></td>
          <td class="text-right" id="waktu"><?= $jam ?></td>
        </tr>
        <tr>
          <td>Nama Pelanggan</td>
          <td class="text-right" id="nama_pelanggan">
            <?php
            $namaPelanggan = $data->customer == "" ? "-" : $data->customer->nameCustomer;
            echo $namaPelanggan;
            ?>
          </td>
        </tr>
        <tr>
          <td>Nama Bill</td>
          <td class="text-right" id="nama_pelanggan">
            <?= $data->name ?>
          </td>
        </tr>
      </table>
    </div>
    <hr class="dash" />
    <div class="item-container">
      <table class="table" id="list">
        <?php
        foreach ($data->cart as $x) {
        ?>
          <tr>
            <td colspan="3">
              <span class="nama-item"><?= $x->productName ?></span>
            </td>
          </tr>
          <tr class="text-left">
            <td>@ <?= $x->price ?></td>
            <td>x <?= $x->qty ?></td>
            <td class="text-right"><?= $x->subtotal ?></td>
          </tr>
        <?php
        }
        ?>
      </table>

      <table class="table">
        <tr>
          <td colspan="3">
            <hr class="dash" />
          </td>
        </tr>
        <tr class="text-bold">
          <td colspan="2">Total</td>
          <td class="text-right" id="total">
            <?= "Rp. " . number_format($data->total, 0, ',', '.'); ?>
          </td>
        </tr>
      </table><br><br>
    </div>
    <hr class="dash" />
    <footer>Terima Kasih</footer>
  </div>
</body>
<script type="text/javascript">
  // document.addEventListener("DOMContentLoaded", () => {
  //   setTimeout(function() {
  //     window.close();
  //   }, 7000);
  // });
</script>

</html>