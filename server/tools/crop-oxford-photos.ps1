# Готовит присланные фото Оксфорда для приложения: перекодирует в JPEG и вырезает кадры из коллажа.
# Запуск: powershell -File server/tools/crop-oxford-photos.ps1 <папка с фото>
Add-Type -AssemblyName PresentationCore
$src = $args[0]  # папка с присланными фото
$out = Join-Path $PSScriptRoot '../../assets/images'

function Save-Crop($file, $name, $x, $y, $w, $h) {
  $s = [System.IO.File]::OpenRead("$src\$file")
  $frame = [System.Windows.Media.Imaging.BitmapDecoder]::Create($s, 'None', 'OnLoad').Frames[0]
  $s.Close()
  if ($w -le 0) { $w = $frame.PixelWidth; $h = $frame.PixelHeight }
  $rect = New-Object System.Windows.Int32Rect($x, $y, $w, $h)
  $crop = New-Object System.Windows.Media.Imaging.CroppedBitmap($frame, $rect)
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 88
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create([System.Windows.Media.Imaging.BitmapSource]$crop))
  $fs = [System.IO.File]::Create("$out\$name")
  $enc.Save($fs)
  $fs.Close()
  "$name ${w}x${h}"
}

Save-Crop '4.jpg' 'oxford_sunset.jpg' 0 0 0 0
Save-Crop '5.webp' 'oxford_day.jpg' 0 0 0 0
Save-Crop '6.webp' 'oxford_evening.jpg' 90 92 420 380
