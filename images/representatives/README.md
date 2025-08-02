# Temsilci Fotoğrafları

Bu klasöre temsilci fotoğraflarını yükleyin.

## Dosya Adlandırma Kuralları:

Fotoğraf dosyalarını temsilci adına göre adlandırın. Sistem otomatik olarak Türkçe karakterleri ve boşlukları temizleyecektir.

### Örnekler:

| Temsilci Adı | Dosya Adı |
|--------------|-----------|
| Selen Kılınç | selen_kilinc.png |
| Aleyna Özata | aleyna_ozata.png |
| Mehmet Onur Aykut | mehmet_onur_aykut.png |
| Aysel Şebnem Palta | aysel_sebnem_palta.png |

## Sistem Otomatik Dönüşümleri:

- **Türkçe karakterler:** ğ→g, ü→u, ş→s, ı→i, ö→o, ç→c
- **Boşluklar:** _ (alt çizgi) ile değiştirilir
- **Büyük harfler:** Küçük harfe çevrilir
- **Özel karakterler:** Kaldırılır

## Desteklenen Formatlar:

- PNG (önerilen)
- JPG/JPEG
- WebP

## Boyut Önerileri:

- **Minimum:** 100x100 piksel
- **Önerilen:** 200x200 piksel
- **Maksimum:** 500x500 piksel

## Varsayılan Avatar:

Eğer bir temsilcinin fotoğrafı yoksa, sistem otomatik olarak `default.jpg` dosyasını kullanacak veya temsilcinin baş harflerinden oluşan bir avatar gösterecektir.

## Örnek Dosya Yapısı:

```
representatives/
├── selen_kilinc.png
├── aleyna_ozata.png
├── mehmet_onur_aykut.png
├── aysel_sebnem_palta.png
├── default.png
└── README.md
``` 