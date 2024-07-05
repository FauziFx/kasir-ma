<html>

<head>
    <title>Print Nota</title>
    <style>
        @media print {
            @page {
                margin: 0;
            }
        }

        body {
            font-size: 11px !important;
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
        }
    </style>
</head>
<?php
$data = $_COOKIE['transaksi-berhasil'];
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
        <div class="metadata">
            <?php
            date_default_timezone_set('Asia/Jakarta');
            $fm = array("Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des");
            $date = explode("-", date('Y-n-j'));
            $tgl = $date[2] . " " . $fm[$date[1] - 1] . " " . $date[0];
            $jam = date('H:i');
            ?>
            <table>
                <tr>
                    <td id="tanggal"><?= $tgl ?></td>
                    <td class="text-right" id="waktu"><?= $jam ?></td>
                </tr>
                <tr>
                    <td>No Nota</td>
                    <td class="text-right" id="nama_pelanggan">
                        #<?= $data->noNota ?>
                    </td>
                </tr>
            </table>
        </div>
        <hr class="dash" />
        <div class="item-container">
            <table class="table" id="list">
                <?php
                foreach ($data->transaksi_detail as $x) {
                ?>
                    <tr>
                        <td colspan="3">
                            <span class="nama-item"><?= $x->nama_produk ?></span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3"></td>
                    </tr>
                    <tr class="text-left">
                        <td>@ <?= $x->harga ?></td>
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
                <tr>
                    <td colspan="2" id="metode_pembayaran"><?= strtoupper($data->metode_pembayaran) ?></td>
                    <td class="text-right" id="bayar">
                        <?= "Rp. " . number_format($data->bayar, 0, ',', '.'); ?>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">Kembalian</td>
                    <td class="text-right" id="kembalian">
                        <?= "Rp. " . number_format($data->bayar - $data->total, 0, ',', '.'); ?>
                    </td>
                </tr>
            </table>
        </div>
        <hr class="dash" />
        <footer>Terima Kasih</footer><br>
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