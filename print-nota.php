<?php
include("config.php");
function tgl_indo($tanggal)
{
    $bulan = array(
        1 =>   'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember'
    );
    $pecahkan = explode('-', $tanggal);

    // variabel pecahkan 0 = tanggal
    // variabel pecahkan 1 = bulan
    // variabel pecahkan 2 = tahun

    return $pecahkan[2] . ' ' . $bulan[(int)$pecahkan[1]] . ' ' . $pecahkan[0];
}
function http_request($url)
{
    // persiapkan curl
    $ch = curl_init();

    // set url
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array("Authorization:" . $_COOKIE['user-token']));

    // set user agent
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');

    // return the transfer as a string
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    // $output contains the output string
    $output = curl_exec($ch);

    // tutup curl
    curl_close($ch);

    // mengembalikan hasil curl
    return $output;
}

$id = $_GET['id'];
$url = $URL_API . "/transactions/" . $id;
$data = http_request($url);
// ubah string JSON menjadi array
$data = json_decode($data, TRUE)['data'];
// echo "<pre>";
// var_dump($data);
// echo "</pre>";
?>

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
            $date = new DateTime($data['date']);
            $date->setTimezone(new DateTimeZone('Asia/Jakarta')); // +04

            $tgl = $date->format('Y-m-d'); // 2012-07-15 05:00:00 
            $jam = $date->format('H:i'); // 2012-07-15 05:00:00 
            ?>
            <table>
                <tr>
                    <td id="tanggal"><?= tgl_indo($tgl) ?></td>
                    <td class="text-right" id="waktu"><?= $jam ?></td>
                </tr>
                <tr>
                    <td>Nama Pelanggan</td>
                    <td class="text-right" id="nama_pelanggan">
                        <?php
                        $namaPelanggan = $data['customer'] == "" ? "-" : $data['customer']['name'];
                        echo $namaPelanggan;
                        ?>
                    </td>
                </tr>
                <tr>
                    <td>No Nota</td>
                    <td class="text-right" id="no_nota">
                        #<?= $data['receipt_no'] ?>
                    </td>
                </tr>
            </table>
        </div>
        <hr class="dash" />
        <div class="item-container">
            <table class="table" id="list">
                <?php
                foreach ($data['details'] as $x) {
                ?>
                    <tr>
                        <td colspan="3">
                            <span class="nama-item"><?= $x['productName'] ?></span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3"></td>
                    </tr>
                    <tr class="text-left">
                    <td>@ <?= $x['price'] ?></td>
                        <td>x <?= $x['qty'] ?></td>
                        <td class="text-right"><?= $x['subtotal'] ?></td>
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
                        <?= "Rp. " . number_format($data['total_amount'], 0, ',', '.'); ?>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" id="metode_pembayaran"><?= strtoupper($data['payment_method']) ?></td>
                    <td class="text-right" id="bayar">
                        <?= "Rp. " . number_format($data['payment_amount'], 0, ',', '.'); ?>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">Kembalian</td>
                    <td class="text-right" id="kembalian">
                        <?= "Rp. " . number_format($data['change_amount'], 0, ',', '.'); ?>
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