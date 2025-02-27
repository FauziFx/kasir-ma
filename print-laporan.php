<html>

<head>
  <title>Print Laporan</title>
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
$data = $_COOKIE['laporan-ringkas'];
$data = json_decode($data);
// echo "<pre>";
// var_dump($data);
// echo "</pre>";
?>

<body onload="window.print()">
  <div class="container">
    <header>
      <div class="nama-perusahaan">UD Murti Aji</div>
      <div>
        Jl. Karang Kencana No.51, Panjunan, Kec. Lemahwungkuk, Kota Cirebon,
        Jawa Barat 45112
      </div>
      <div>Telp/WA 0853 1457 9001</div>
    </header>
    <h3 style="text-align: center; margin: 0">Laporan</h3>
    <hr class="dash" />
    <table class="table">
      <tr>
        <td colspan="2">Tanggal</td>
        <td class="text-right" id="item-terjual">
          <?= date("d-m-Y") ?>
        </td>
      </tr>
    </table>
    <h3 style="text-align: center; margin: 0">Tunai</h3>
    <div class="item-container">
      <table class="table">
        <tr>
          <td colspan="3">
            <hr class="dash" />
          </td>
        </tr>
        <tr>
          <td colspan="2">Item Terjual</td>
          <td class="text-right" id="item-terjual">
            <?= $data->total_item_terjual ?> Item
          </td>
        </tr>
        <tr>
          <td colspan="2">Pembayaran Tunai</td>
          <td class="text-right" id="pembayaran-tunai" style="font-weight: bold;">
            <?= "Rp. " . number_format($data->total_tunai, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td colspan="2">Pemasukan</td>
          <td class="text-right" id="pemasukan">
            <?= "Rp. " . number_format($data->pemasukan, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td colspan="2">Pengeluaran</td>
          <td class="text-right" id="pengeluaran">
            <?= "- Rp. " . number_format($data->pengeluaran, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td colspan="2">Total uang tunai</td>
          <td class="text-right" id="total-diharapkan" style="font-weight: bold;">
            <?= "Rp. " . number_format($data->total_diharapkan, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <hr class="dash" />
          </td>
        </tr>
        <tr class="text-bold">
          <td colspan="2" style="font-size: 12px">
            Total uang<br />
            tunai yg didapatkan
          </td style="font-size: 12px">
          <td class="text-right" id="total-didapatkan">
            <?= "Rp. " . number_format($data->total_didapatkan, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px" colspan="2">Selisih</td>
          <td style="padding-top:10px" class="text-right" id="selisih">
            <?= "Rp. " . number_format($data->selisih, 0, ',', '.') ?>
          </td>
        </tr>
      </table>
    </div>
    <h3 style="text-align: center; margin-bottom: 0">MA Grup</h3>
    <div class="item-container">
      <table class="table">
        <tr>
          <td colspan="3">
            <hr class="dash" />
          </td>
        </tr>
        <tr>
          <td colspan="2">Total</td>
          <td class="text-right" id="total-magrup">
            <?= "Rp. " . number_format($data->total_magrup, 0, ',', '.') ?>
          </td>
        </tr>
      </table>
    </div>

    <h3 style="text-align: center; margin-bottom: 0">Lainnya</h3>
    <div class="item-container">
      <table class="table">
        <tr>
          <td colspan="3">
            <hr class="dash" />
          </td>
        </tr>
        <tr>
          <td colspan="2">TRANSFER</td>
          <td class="text-right" id="transfer">
            <?= "Rp. " . number_format($data->total_transfer, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td colspan="2">QRIS</td>
          <td class="text-right" id="qris">
            <?= "Rp. " . number_format($data->total_qris, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td colspan="2">EDC</td>
          <td class="text-right" id="edc">
            <?= "Rp. " . number_format($data->total_edc, 0, ',', '.') ?>
          </td>
        </tr>
        <tr class="text-bold">
          <td colspan="2">Total Lainnya</td>
          <td class="text-right" id="total-lainnya">
            <?= "Rp. " . number_format($data->total_lainnya, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td colspan="3">
            <hr class="dash" />
          </td>
        </tr>
        <tr class="text-bold">
        <td colspan="2">Total</td>
          <td class="text-right" id="total-lainnya">
            <?php 
            $total_semua = $data->total_diharapkan + $data->total_lainnya;
            echo "Rp. " . number_format($total_semua, 0, ',', '.');
            ?>
          </td>
        </tr>
      </table>
    </div>
    <hr class="dash" />
    <footer>Terima Kasih</footer>
  </div>
</body>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(function() {
      window.close();
    }, 7000);
  });
</script>

</html>