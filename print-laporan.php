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
$data = $_COOKIE['report-summary'];
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
    <div class="item-container">
      <table class="table">
        <tr>
          <td colspan="2">Tanggal</td>
          <td class="text-right" id="item-terjual">
            <?= date("d-m-Y") ?>
          </td>
        </tr>
        <tr>
          <td colspan="2">Total uang tunai</td>
          <td class="text-right" id="total-diharapkan" style="font-weight: bold;">
            <?= "Rp. " . number_format($data->totalCash, 0, ',', '.') ?>
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
            Tunai yg didapatkan
          </td style="font-size: 12px">
          <td class="text-right" id="total-didapatkan">
            <?= "Rp. " . number_format($data->totalEarned, 0, ',', '.') ?>
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px" colspan="2">Selisih</td>
          <td style="padding-top:10px" class="text-right" id="selisih">
            <?= "Rp. " . number_format($data->difference, 0, ',', '.') ?>
          </td>
        </tr>
      </table>
    </div>
    <?php foreach($data->transaction as $value){ ?>
    <h3 style="text-align: center; margin-bottom: 0"><?=$value->transactionTypeName?></h3>
    <div class="item-container">
      <table class="table">
        <tr>
          <td colspan="3">
            <hr class="dash" />
          </td>
        </tr>
        <?php foreach($value->payments as $val){ ?>
        <tr>
          <td style="text-transform:capitalize" colspan="2"><?=$val->payment_method?></td>
          <td class="text-right" id="total-magrup">
            <?=$val->total ?>
          </td>
        </tr>
        <?php } ?>
        <?php 
        $total = array_reduce($value->payments, function ($acc, $curr) {
            return $acc + $curr->total;
        }, 0);  
        ?>
        <tr>
          <td style="font-weight: bold;" colspan="2">Total</td>
          <td style="font-weight: bold;" class="text-right" id="total-magrup">
            <?=$total ?>
          </td>
        </tr>
      </table>
    </div>
    <hr class="dash" />
    <?php } ?>
    <div class="item-container">
      <table class="table">
        <tr>
          <td style="padding-bottom: 10px" colspan="2">Item Terjual</td>
          <td style="padding-bottom: 10px" class="text-right" id="total-magrup">
            <?php
            $totalQty = array_reduce($data->transactionDetails, function ($acc, $curr) {
                return $acc + $curr->totalQty;
            }, 0);  
            echo $totalQty ." item";
            ?>
          </td>
        </tr>
        
        <?php foreach($data->transactionDetails as $v){?>
        <tr>
          <td style="padding-bottom: 4px" colspan="2">
            <span><?=$v->productName?></span><br />
            <span class="text-secondary"><?=$v->variantName?></span>
          </td>
          <td style="padding-bottom: 4px" class="text-right"><?=$v->totalQty?></td>
        </tr>
        <?php } ?>
      </table>
    </div>

    <footer>Terima Kasih</footer>
  </div>
</body>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(function() {
      window.close();
    }, 15000);
  });
</script>

</html>