# Готовит логотип ALTushki из присланного изображения: квадрат для интерфейса и иконки приложения.
# Запуск: powershell -File server/tools/make-logo-assets.ps1 <путь к логотипу>
# Логотип не перерисовывается: картинка ставится по центру квадрата, края заливаются цветом её фона.
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
$src = $args[0]
$root = Join-Path $PSScriptRoot '../..'

$stream = [System.IO.File]::OpenRead($src)
$frame = [System.Windows.Media.Imaging.BitmapDecoder]::Create($stream, 'None', 'OnLoad').Frames[0]
$stream.Close()
$conv = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($frame, [System.Windows.Media.PixelFormats]::Bgra32, $null, 0)

# Цвет фона берём из левого верхнего угла картинки
$px = New-Object byte[] 4
$conv.CopyPixels((New-Object System.Windows.Int32Rect(4, 4, 1, 1)), $px, 4, 0)
$bg = [System.Windows.Media.Color]::FromRgb($px[2], $px[1], $px[0])
"Фон логотипа: $bg, размер $($conv.PixelWidth)x$($conv.PixelHeight)"

function Save-Square($name, $size, $logoShare) {
  $visual = New-Object System.Windows.Media.DrawingVisual
  $ctx = $visual.RenderOpen()
  $ctx.DrawRectangle((New-Object System.Windows.Media.SolidColorBrush($bg)), $null, (New-Object System.Windows.Rect(0, 0, $size, $size)))
  $scale = ($size * $logoShare) / [Math]::Max($conv.PixelWidth, $conv.PixelHeight)
  $w = $conv.PixelWidth * $scale
  $h = $conv.PixelHeight * $scale
  $ctx.DrawImage($conv, (New-Object System.Windows.Rect((($size - $w) / 2), (($size - $h) / 2), $w, $h)))
  $ctx.Close()
  $bmp = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($size, $size, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
  $bmp.Render($visual)
  $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create([System.Windows.Media.Imaging.BitmapSource]$bmp))
  $fs = [System.IO.File]::Create((Join-Path $root $name))
  $enc.Save($fs)
  $fs.Close()
  "$name ${size}px"
}

Save-Square 'assets/images/logo.png' 512 1.0
Save-Square 'assets/icon.png' 1024 0.92
Save-Square 'assets/android-icon-foreground.png' 1024 0.62
Save-Square 'assets/splash-icon.png' 1024 0.92
Save-Square 'assets/favicon.png' 64 1.0
