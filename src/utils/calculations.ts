import { RepresentativeData, CalculatedRepresentative, KPIWeights } from '../types';

/**
 * Virgülle ayrılmış string sayıyı float'a çevirir
 */
const parseCommaNumber = (value: string): number => {
  const parsed = parseFloat(value.replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Min-max normalizasyon yapar
 */
const normalizeValue = (value: number, min: number, max: number): number => {
  if (isNaN(value) || isNaN(min) || isNaN(max)) return 0;
  if (max === min) return 0.5; // Eğer tüm değerler aynıysa orta puan ver
  return (value - min) / (max - min);
};

/**
 * Varsayılan KPI ağırlıkları
 */
export const defaultKPIWeights: KPIWeights = {
  callCount: 0.2,      // %20
  callDuration: 0.2,   // %20
  auditScore: 0.3,     // %30
  csatScore: 0.3       // %30
};

/**
 * Başarı endeksi hesaplar
 */
export const calculateSuccessIndex = (
  data: RepresentativeData[], 
  weights: KPIWeights = defaultKPIWeights
): CalculatedRepresentative[] => {
  if (data.length === 0) return [];

  // Verileri parse et - N/A değerlerini filtrele
  const parsedData = data
    .filter(item => 
      item["Audit Skoru"] !== "N/A" && 
      item["Çağrı Değerlendirme Ortalaması"] !== "N/A"
    )
    .map(item => ({
      name: item["MT Adı"],
      callCount: Number(item["Toplam Çağrı Adedi"]) || 0,
      callDuration: parseCommaNumber(item["Ortalama Konuşma Süresi"]),
      auditScore: Number(item["Audit Skoru"]) || 0,
      csatScore: parseCommaNumber(item["Çağrı Değerlendirme Ortalaması"])
    }));

  // Min-max değerleri bul
  const callCounts = parsedData.map(d => d.callCount);
  const callDurations = parsedData.map(d => d.callDuration);

  const maxCallCount = Math.max(...callCounts);
  const minCallDuration = Math.min(...callDurations);
  const maxCallDuration = Math.max(...callDurations);

  // Her temsilci için puanları hesapla
  const calculatedData: CalculatedRepresentative[] = parsedData.map(item => {
    // Çağrı adedi puanı - En yüksek çağrı adedine göre yüzde hesapla
    const callCountPercentage = maxCallCount > 0 ? item.callCount / maxCallCount : 0;
    const callCountScore = callCountPercentage * weights.callCount;

    // Konuşma süresi puanı - Daha kısa süre = Daha iyi puan
    const callDurationScore = (1 - normalizeValue(item.callDuration, minCallDuration, maxCallDuration)) * weights.callDuration;

    // Audit skoru puanı - 100 tam puan üzerinden hesapla
    const auditScorePercentage = item.auditScore / 100;
    const auditScoreNormalized = auditScorePercentage * weights.auditScore;

    // CSAT puanı - 5 tam puan üzerinden hesapla
    const csatScorePercentage = item.csatScore / 5;
    const csatScoreNormalized = csatScorePercentage * weights.csatScore;

    // Toplam başarı endeksi (0-1 arası)
    const successIndex = callCountScore + callDurationScore + auditScoreNormalized + csatScoreNormalized;

    return {
      name: item.name,
      rank: 0, // Sıralama daha sonra yapılacak
      successIndex,
      callCount: item.callCount,
      callDuration: item.callDuration,
      auditScore: item.auditScore,
      surveyResult: item.csatScore,
      qualityEvaluation: item.csatScore, // Aynı değeri kullanıyoruz
      callCountScore,
      callDurationScore,
      auditScoreNormalized,
      csatScoreNormalized
    };
  });

  // Başarı endeksine göre sırala (yüksekten düşüğe)
  calculatedData.sort((a, b) => b.successIndex - a.successIndex);

  // Kalite koşulları: Hem audit hem de çağrı değerlendirme ortalaması için minimum değerler
  const MIN_QUALITY_THRESHOLD = 4.85; // Çağrı değerlendirme ortalaması
  const MIN_AUDIT_THRESHOLD = 78;     // Audit puanı
  
  // İlk 3'te olup koşulları sağlamayanları bul
  const lowQualityInTop3 = calculatedData
    .slice(0, 3)
    .filter(item => 
      item.qualityEvaluation < MIN_QUALITY_THRESHOLD || 
      item.auditScore < MIN_AUDIT_THRESHOLD
    );
  
  if (lowQualityInTop3.length > 0) {
    // Her iki koşulu da sağlayan temsilcileri ilk 3'e yerleştir
    const qualifiedTop3 = calculatedData
      .filter(item => 
        item.qualityEvaluation >= MIN_QUALITY_THRESHOLD && 
        item.auditScore >= MIN_AUDIT_THRESHOLD
      )
      .slice(0, 3);
    
    const restOfData = calculatedData
      .filter(item => !qualifiedTop3.includes(item))
      .sort((a, b) => b.successIndex - a.successIndex);
    
    // Yeni sıralamayı oluştur
    const newOrder = [...qualifiedTop3, ...restOfData];
    
    // Sıralama numaralarını ata
    newOrder.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    return newOrder;
  } else {
    // Normal sıralama - Sıralama numaralarını ata
    calculatedData.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    return calculatedData;
  }
};

/**
 * Takım istatistiklerini hesaplar
 */
export const calculateTeamStats = (data: RepresentativeData[]) => {
  if (data.length === 0) return null;

  const parsedData = data
    .filter(item => 
      item["Audit Skoru"] !== "N/A" && 
      item["Çağrı Değerlendirme Ortalaması"] !== "N/A"
    )
    .map(item => ({
      name: item["MT Adı"],
      callCount: Number(item["Toplam Çağrı Adedi"]) || 0,
      callDuration: parseCommaNumber(item["Ortalama Konuşma Süresi"]),
      auditScore: Number(item["Audit Skoru"]) || 0,
      csatScore: parseCommaNumber(item["Çağrı Değerlendirme Ortalaması"])
    }));

  const callCounts = parsedData.map(d => d.callCount);
  const callDurations = parsedData.map(d => d.callDuration);
  const auditScores = parsedData.map(d => d.auditScore);
  const csatScores = parsedData.map(d => d.csatScore);

  // Sabit takım ortalamaları
  return {
    callCount: {
      min: Math.min(...callCounts),
      max: Math.max(...callCounts),
      avg: 415 // Sabit değer: Çağrı adet ort
    },
    callDuration: {
      min: Math.min(...callDurations),
      max: Math.max(...callDurations),
      avg: 459.24 // Sabit değer: Ortalama konuşma süresi
    },
    auditScore: {
      min: Math.min(...auditScores),
      max: Math.max(...auditScores),
      avg: 76.85 // Sabit değer: Audit
    },
    csatScore: {
      min: Math.min(...csatScores),
      max: Math.max(...csatScores),
      avg: 4.88 // Sabit değer: CSAT
    }
  };
};

/**
 * Debug için hesaplama detaylarını yazdırır
 */
export const debugCalculation = (data: RepresentativeData[]): void => {
  if (data.length === 0) return;

  const parsedData = data.map(item => ({
    name: item["MT Adı"],
    callCount: Number(item["Toplam Çağrı Adedi"]) || 0,
    callDuration: parseCommaNumber(item["Ortalama Konuşma Süresi"]),
    auditScore: Number(item["Audit Skoru"]) || 0,
    csatScore: parseCommaNumber(item["Çağrı Değerlendirme Ortalaması"])
  }));

  const callCounts = parsedData.map(d => d.callCount);
  const callDurations = parsedData.map(d => d.callDuration);
  const auditScores = parsedData.map(d => d.auditScore);
  const csatScores = parsedData.map(d => d.csatScore);

  const minCallCount = Math.min(...callCounts);
  const maxCallCount = Math.max(...callCounts);
  const minCallDuration = Math.min(...callDurations);
  const maxCallDuration = Math.max(...callDurations);
  const minAuditScore = Math.min(...auditScores);
  const maxAuditScore = Math.max(...auditScores);
  const minCsatScore = Math.min(...csatScores);
  const maxCsatScore = Math.max(...csatScores);

  console.log('=== DEBUG HESAPLAMA ===');
  console.log('Min-Max Değerler:');
  console.log(`Çağrı Adedi: ${minCallCount} - ${maxCallCount}`);
  console.log(`Konuşma Süresi: ${minCallDuration} - ${maxCallDuration}`);
  console.log(`Audit: ${minAuditScore} - ${maxAuditScore}`);
  console.log(`CSAT: ${minCsatScore} - ${maxCsatScore}`);

  parsedData.forEach(item => {
    const callCountScore = normalizeValue(item.callCount, minCallCount, maxCallCount) * 0.2;
    const callDurationScore = (1 - normalizeValue(item.callDuration, minCallDuration, maxCallDuration)) * 0.2;
    const auditScoreNormalized = normalizeValue(item.auditScore, minAuditScore, maxAuditScore) * 0.3;
    const csatScoreNormalized = normalizeValue(item.csatScore, minCsatScore, maxCsatScore) * 0.3;
    const successIndex = callCountScore + callDurationScore + auditScoreNormalized + csatScoreNormalized;

    console.log(`\n${item.name}:`);
    console.log(`  Çağrı Adedi: ${item.callCount} → ${callCountScore.toFixed(4)}`);
    console.log(`  Konuşma Süresi: ${item.callDuration} → ${callDurationScore.toFixed(4)}`);
    console.log(`  Audit: ${item.auditScore} → ${auditScoreNormalized.toFixed(4)}`);
    console.log(`  CSAT: ${item.csatScore} → ${csatScoreNormalized.toFixed(4)}`);
    console.log(`  Toplam: ${successIndex.toFixed(4)}`);
  });
}; 