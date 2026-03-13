import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

// TODO: In production, never store API keys directly in code. Use a proxy server.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

import Constants from 'expo-constants';

export interface AnalysisResult {
    score: number;
    feedback: {
        compliment: string;
        style_tags: string[];
        critique: string[];
        conclusion: string;
    }
}

// Local Rembg Python Server URL resolution
const getLocalServerUrl = () => {
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
        const localIp = debuggerHost.split(':')[0];
        return `http://${localIp}:5000/removebg`;
    }
    return 'http://10.0.2.2:5000/removebg';
};

export const removeBackground = async (imageUri: string): Promise<string> => {
    try {
        const serverUrl = getLocalServerUrl();
        console.log("Removing background using local server at:", serverUrl);

        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

        const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ image_file_b64: base64 })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Local Rembg failed:", errorText);
            throw new Error(`Arka plan silinemedi (Local AI Hatası: ${response.status})`);
        }

        const data = await response.json();
        const resultBase64 = data.data.result_b64;

        const tempUri = FileSystem.cacheDirectory + 'nobg_' + Date.now() + '.jpg';
        await FileSystem.writeAsStringAsync(tempUri, resultBase64, { encoding: 'base64' });

        return tempUri;

    } catch (e: any) {
        console.error("Background removal error:", e);
        throw new Error(e.message || "Arka plan silme işlemi başarısız oldu.");
    }
};

// Helper: Make a Gemini API call
const callGemini = async (
    systemPrompt: string,
    parts: { text?: string; inlineData?: { mimeType: string; data: string } }[],
    jsonMode: boolean = false
): Promise<string> => {
    const body: any = {
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [{
            parts: parts
        }],
    };

    if (jsonMode) {
        body.generationConfig = {
            responseMimeType: 'application/json'
        };
    }

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
        console.error("Gemini Error:", data.error);
        throw new Error(data.error.message || 'Gemini API Hatası');
    }

    return data.candidates[0].content.parts[0].text;
};

export const analyzeOutfit = async (imageUri: string, language: string = 'tr'): Promise<AnalysisResult> => {
    try {
        console.log("Analyzing image URI:", imageUri);

        let finalUri = imageUri;
        if (imageUri.startsWith('content://')) {
            console.log("Content URI detected, copying to cache...");
            const cacheDir = FileSystem.cacheDirectory + 'ai_service_temp_' + Date.now() + '.jpg';
            try {
                await FileSystem.copyAsync({ from: imageUri, to: cacheDir });
                finalUri = cacheDir;
            } catch (e) {
                console.warn("Failed to copy content URI:", e);
                throw new Error("Görsel işlenemedi. Lütfen tekrar deneyin.");
            }
        }

        const manipResult = await ImageManipulator.manipulateAsync(
            finalUri,
            [{ resize: { width: 800 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const base64Image = await FileSystem.readAsStringAsync(manipResult.uri, { encoding: 'base64' });

        const systemPrompt = `Sen samimi, dürüst ve çok akıllı bir moda danışmanısın. İnsanların kıyafetlerini değerlendiren stil sahibi yakın bir arkadaş gibi konuş. Uzun ve derin moda teorilerinden ziyade, doğal, kısa ve net ol.
        
        KURALLAR:
        1. Görselde kıyafet yoksa veya fotoğraf çok kalitesizse: score=0 ver ve "Fotoğraf çok karanlık, hiçbir şey seçilmiyor" de.
        2. BAĞLAM (CONTEXT) FARINDALIĞI (ÇOK ÖNEMLİ):
           - Önce giyilen kıyafetin TARZINI ve AMACINI anla (Spor, Takım Elbise/Klasik, Gündelik, Pijama vb.).
           - Kombini KENDİ KATEGORİSİ İÇİNDE değerlendir. Takım elbise giymiş veya şık bir davete hazırlanan birine ASLA "altına kot pantolon giy" veya "spor ayakkabı yakışır" gibi saçma sapan casual öneriler/eleştiriler sunma.
           - Antrenman/Spor kıyafeti giymiş birini de rahatlığı ve amaca uygunluğu üzerinden öv.
        3. USLUP ve KİMLİK:
           - Önce iyi yönünü çok DOĞAL, samimi ve KISA bir dille söyle.
           - ELEŞTİRİ (critique) ZORUNLUDUR: Ne kadar güzel olursa olsun EN AZ 2 MANTIKLI ÖNERİ sun.
           - Cevabın KISA, öz, ve sadece işe yarar olsun.
           - CRITICAL: Your entire response MUST be in ${language === 'tr' ? 'Turkish' : 'English'}. Include no other languages.
        
        ÇIKTI FORMATI (JSON):
        {
            "score": 0-100 arası,
            "feedback": {
                "compliment": "Doğal, samimi ilk izlenim.",
                "style_tags": ["Klasik", "Spor", "Ofis" vb. 2-3 kısa etiket],
                "critique": ["Pratik öneri 1", "Pratik öneri 2"],
                "conclusion": "Güzel bir gün dileği veya tatlı bir kapanış."
            }
        }
        
        Cevaplarını her zaman doğal ${language === 'tr' ? 'Türkçe' : 'İngilizce'} ile yaz.`;

        const text = await callGemini(
            systemPrompt,
            [
                { text: "Bu halimi nasıl buldun? Günlük ve samimi yorumla lütfen, abartı istemiyorum." },
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
            ],
            true
        );

        const content = JSON.parse(text);

        return {
            score: (typeof content.score === 'number') ? content.score : 75,
            feedback: {
                compliment: content.feedback?.compliment || "Kombinin genel olarak hoş görünüyor.",
                style_tags: content.feedback?.style_tags || ["Günlük"],
                critique: content.feedback?.critique || ["Daha fazla aksesuar kullanabilirsin."],
                conclusion: content.feedback?.conclusion || "Gayet iyi bir başlangıç!"
            }
        };

    } catch (error: any) {
        console.error("Analysis failed:", error);
        return {
            score: 0,
            feedback: {
                compliment: "Üzgünüm, şu an bağlantı kuramıyorum.",
                style_tags: ["Hata"],
                critique: [
                    "Yapay zeka servisine bağlanılamadı.",
                    `Detay: ${error.message || 'Bilinmeyen hata'}`
                ],
                conclusion: "Lütfen internet bağlantını kontrol et veya daha sonra tekrar dene."
            }
        };
    }
};

// Keep the mock for fallback
const analyzeOutfitMock = async (imageUri: string): Promise<AnalysisResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
        score: 85,
        feedback: {
            compliment: "Mavinin bu tonu ten renginle harika bir uyum yakalamış! Oldukça enerjik ve taze bir görünüm.",
            style_tags: ["Smart Casual", "Şehirli"],
            critique: [
                "Pantolon paçası bir tık uzun kalmış, ayakkabının üzerine yığılma yapıyor.",
                "Kemer rengi ayakkabılarınla tam uyuşmuyor, kahve tonları daha iyi olabilir.",
            ],
            conclusion: "Genel hatlarıyla çok şık bir günlük kombin. Ufak dokunuşlarla harika olabilir!"
        }
    };
};

export const suggestOutfitCombination = async (items: { uri: string; category: string; label?: string }[], weatherContext?: string, language: string = 'tr'): Promise<string> => {
    try {
        const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
            { text: "Aşağıdaki parçaları kombin uyumu açısından değerlendir. Her görselin ne olduğunu etiketiyle belirttim:" }
        ];

        for (const item of items) {
            let base64: string;
            if (item.uri.startsWith('http')) {
                const response = await fetch(item.uri);
                const blob = await response.blob();
                base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            } else {
                base64 = await FileSystem.readAsStringAsync(item.uri, { encoding: 'base64' });
            }

            parts.push({ text: `PARÇA: ${item.category} (${item.label || 'Tanımsız'})` });
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
        }

        let finalInstruction = "Bu parçalar birbiriyle uyumlu mu? Eksik (listede olmayan) temel bir parça varsa belirt (Örn: Ayakkabı yoksa ayakkabı öner).";

        if (weatherContext) {
            finalInstruction += `\n\nEk Bilgi: Kullanıcının bulunduğu konumda şu anki hava durumu: ${weatherContext}. Lütfen değerlendirmende bu hava durumunu DİKKATE AL.`;
        }

        parts.push({ text: finalInstruction });

        const systemPrompt = `Sen uzman bir moda stilistisin.
        
        KURALLAR:
        1. Sana sunulan her görselin NE OLDUĞU yazılı olarak belirtildi (Örn: PARÇA: Shoes).
        2. Lütfen "Ayakkabı yok" DEME, eğer "PARÇA: Shoes" etiketiyle bir görsel sunulmuşsa.
        3. Sadece stil ve renk uyumuna odaklan.
        4. Eğer gerçekten temel bir parça LİSTEDE YOKSA, o zaman eksik olduğunu söyle.
        5. Kısa, samimi ve yapıcı ol. ${language === 'tr' ? 'Türkçe konuş.' : 'Speak in English.'}
        6. ASLA backend ID'lerini veya uzun anlamsız kodları yorumuna dahil etme.`;

        const result = await callGemini(systemPrompt, parts, false);
        return result;

    } catch (error: any) {
        console.error("Combination failed:", error);
        return "Kombin analizi yapılamadı. Ama birlikte güzel görünüyorlar!";
    }
};

export interface AutoOutfitResult {
    selectedIds: string[];
    reasoning: string;
}

export const autoCreateOutfit = async (items: { id: string; uri: string; category: string; label?: string }[], context: string, weatherContext?: string, language: string = 'tr'): Promise<AutoOutfitResult> => {
    try {
        let contextInstruction = `Kullanıcı Bağlamı(Context): "${context}"`;
        if (weatherContext) {
            contextInstruction += `\nMevcut Hava Durumu: ${weatherContext}`;
        }
        contextInstruction += `\n\nAşağıdaki gardırop parçalarından bu bağlama ve hava durumuna EN UYGUN kombini oluştur.`;

        const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
            { text: contextInstruction }
        ];

        for (const item of items) {
            let base64: string;
            if (item.uri.startsWith('http')) {
                const response = await fetch(item.uri);
                const blob = await response.blob();
                base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            } else {
                base64 = await FileSystem.readAsStringAsync(item.uri, { encoding: 'base64' });
            }

            parts.push({ text: `ID: ${item.id}(${item.category})` });
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
        }

        const systemPrompt = `Sen stil sahibi bir moda asistanısın.

        GÖREV:
        Verilen parçaların FOTOĞRAFLARINA bakarak, belirtilen duruma(context) en uygun kombini seç.

        KURALLAR:
        1. Sadece verilen ID'lerden seçim yap ve bu ID'leri sadece "selectedIds" dizisine koy.
        2. "Spor" denirse asla topuklu ayakkabı veya takım elbise seçme.
        3. "Düğün" denirse eşofman seçme.
        4. Renk uyumuna dikkat et.
        5. Mantıksız kombin yapma (Örn: İki tane pantolon seçme). Genelde 1 Üst + 1 Alt + (Opsiyonel) Ayakkabı / Dış Giyim / Aksesuar seç.
        6. ÖNEMLİ: "reasoning" metni DİREKT olarak kullanıcıya gösterilecektir. "reasoning" içinde ASLA eşyaların ID'lerini YAZMA! Eşyalardan bahsederken rengini veya türünü kullan.
        7. CRITICAL: "reasoning" MUST be in ${language === 'tr' ? 'Turkish' : 'English'}.
        
        JSON ÇIKTISI:
        {
            "selectedIds": ["id1", "id3", ...],
            "reasoning": "${language === 'tr' ? 'Kısa ve ikna edici bir açıklama.' : 'Short and persuasive explanation.'}"
        }`;

        const text = await callGemini(systemPrompt, parts, true);
        const content = JSON.parse(text);

        return {
            selectedIds: content.selectedIds || [],
            reasoning: content.reasoning || "Senin için en uygun parçaları seçtim."
        };

    } catch (error: any) {
        console.error("Auto creation failed:", error);
        return { selectedIds: [], reasoning: "Kombin oluşturulamadı. Lütfen tekrar dene." };
    }
};

export interface DetectedItem {
    category: string;
    label: string;
    bbox: [number, number, number, number]; // ymin, xmin, ymax, xmax
}

export const detectOutfitItems = async (imageUri: string): Promise<DetectedItem[]> => {
    try {
        console.log("Detecting items for URI:", imageUri);
        let processUri = imageUri;

        if (imageUri.startsWith('content://')) {
            console.log("Content URI detected, copying to cache...");
            const cacheDir = FileSystem.cacheDirectory + 'ai_detect_temp_' + Date.now() + '.jpg';
            try {
                await FileSystem.copyAsync({ from: imageUri, to: cacheDir });
                processUri = cacheDir;
            } catch (e) {
                console.warn("Failed to copy content URI:", e);
            }
        }

        const manipResult = await ImageManipulator.manipulateAsync(
            processUri,
            [{ resize: { width: 1080 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const base64 = await FileSystem.readAsStringAsync(manipResult.uri, { encoding: 'base64' });

        const systemPrompt = `Sen bir kıyafet tespiti ve nesne algılama uzmanısın.
        JSON formatında "items" listesi dön.
        
        Her öğe için:
        - "category": 'Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Accessories'.
        - "label": 2-3 kelimelik kısa Türkçe açıklama.
        - "bbox": [ymin, xmin, ymax, xmax] (0 ile 1000 arasında TAM SAYI).

        ÖNEMLİ (Bounding Box Kuralları):
        Görselin en üstü y=0, en altı y=1000'dir. (x=0 sol, x=1000 sağ).
        - Kafa/Yüz bölgesi: Genellikle Y ekseninde 0'dan 200'e kadardır.
        - ÜST GİYİM (Tops/Kazak/Gömlek vb): Boyundan başlar, bele kadar iner. (Örn: ymin=250, ymax=600). KAFAYI/YÜZÜ (0-200) KESİNLİKLE KUTUYA DAHİL ETME!
        - ALT GİYİM (Bottoms/Pantolon/Etek): Belden ayak bileğine kadar iner. (Örn: ymin=600, ymax=950).
        - AYAKKABI (Shoes): Y: 950 ile Y: 1000 arasındadır.
        
        DİKKAT (YANLARDAN KESİLME HATASI): 
        Kıyafetin 'xmin' ve 'xmax' değerlerini belirlerken çok cömert davran. Kıyafetin sağ ve sol uçlarını TAMAMEN içine al. Gerekirse xmin=0 ve xmax=1000 yaparak tüm genişliği al.
        
        Sadece kişinin üzerindeki asıl kıyafeti seç.`;

        const text = await callGemini(
            systemPrompt,
            [
                { text: "Görseldeki kıyafetleri ve aksesuarları tespit et. Üst giyimde yüzü ve teni dışarıda bırak." },
                { inlineData: { mimeType: 'image/jpeg', data: base64 } }
            ],
            true
        );

        const content = JSON.parse(text);
        const rawItems: DetectedItem[] = content.items || [];

        // Normalize bbox from 0-1000 to 0.0-1.0
        const normalizedItems = rawItems.map(item => {
            const [y1, x1, y2, x2] = item.bbox;
            return {
                ...item,
                bbox: [
                    y1 > 1 ? y1 / 1000 : y1,
                    x1 > 1 ? x1 / 1000 : x1,
                    y2 > 1 ? y2 / 1000 : y2,
                    x2 > 1 ? x2 / 1000 : x2
                ] as [number, number, number, number]
            };
        });

        return normalizedItems;

    } catch (error: any) {
        console.error("Detection failed:", error);
        return [
            { category: 'Tops', label: 'Tespit Edilen Üst', bbox: [0.1, 0.2, 0.5, 0.8] },
            { category: 'Bottoms', label: 'Tespit Edilen Alt', bbox: [0.5, 0.2, 0.9, 0.8] }
        ];
    }
};
