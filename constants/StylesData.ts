export interface StyleItem {
    name: string;
    imageUrl: string;
}

export interface FashionStyle {
    id: string;
    name: string;
    description: string;
    isTrending: boolean;
    coverImage: string;
    exampleItems: StyleItem[];
}

export const STYLES_DB: FashionStyle[] = [
    {
        id: "old-money",
        name: "Old Money",
        description: "Gösterişli logolardan uzak, kaliteli kumaşlara, zamansız kesimlere ve nötr renklere odaklanan 'Sessiz Lüks' akımı. Zenginliğin bağırmadığı, fısıldadığı bir stil.",
        isTrending: true,
        coverImage: "https://i.pinimg.com/736x/23/e5/04/23e504c0340715dedd9ee503a55246f7.jpg",
        exampleItems: [
            { name: "Yazlık Keten Kombin", imageUrl: "https://i.pinimg.com/736x/23/e5/04/23e504c0340715dedd9ee503a55246f7.jpg" },
            { name: "Günlük Klasik Görünüm", imageUrl: "https://i.pinimg.com/736x/2c/c6/7a/2cc67adc1b92ab476463dd0f299435d5.jpg" },
            { name: "Zarif Kışlık Kombin", imageUrl: "https://i.pinimg.com/736x/de/2a/01/de2a019832485e6e600c1c39902b82f2.jpg" },
            { name: "Katmanlı Şık Stil", imageUrl: "https://i.pinimg.com/736x/4c/81/6e/4c816ef6e720f295a29946862f1fadd2.jpg" },
            { name: "Sonbahar Triko Şıklığı", imageUrl: "https://i.pinimg.com/736x/b6/7d/75/b67d75b31d4c1591edb57eb6a6f31a03.jpg" },
            { name: "Zamansız İtalyan Stili", imageUrl: "https://i.pinimg.com/736x/1d/41/cb/1d41cbfc6156e317a753b629b8004c52.jpg" }
        ]
    },
    {
        id: "y2k",
        name: "Y2K (2000'ler)",
        description: "2000'li yılların başındaki popüler kültürün ve teknolojinin etkisiyle ortaya çıkan, cesur renklerin, düşük bel pantolonların ve fütüristik aksesuarların kullanıldığı nostaljik bir trend.",
        isTrending: true,
        coverImage: "https://i.pinimg.com/736x/69/f0/97/69f09729d8e75ca30ef5fe87dfc2909f.jpg",
        exampleItems: [
            { name: "Y2K Sokak/Kaykay Kombini", imageUrl: "https://i.pinimg.com/736x/69/f0/97/69f09729d8e75ca30ef5fe87dfc2909f.jpg" },
            { name: "Nostaljik Patenci Kombini", imageUrl: "https://i.pinimg.com/736x/f5/cf/f4/f5cff4a2475103f90d1e9dd7e82df324.jpg" },
            { name: "Soft Grunge Y2K Görünümü", imageUrl: "https://i.pinimg.com/736x/97/68/88/9768884a4388215e1d6f2aa47839e2c2.jpg" },
            { name: "Rahat Preppy Sokak Stili", imageUrl: "https://i.pinimg.com/736x/8c/cd/68/8ccd6868a66de9de060cdd5611a36ac2.jpg" },
            { name: "Günlük Bol Y2K Stili", imageUrl: "https://i.pinimg.com/736x/b7/6f/82/b76f82cf1f25d3bc922596d8c7cc4dac.jpg" }
        ]
    },
    {
        id: "streetwear",
        name: "Streetwear (Sokak Stili)",
        description: "Kaykay, sörf ve hip-hop kültüründen doğan; rahatlığın, grafik baskılı geniş (oversize) tişörtlerin, eşofman altlarının ve ikonik sneaker'ların ön planda olduğu özgür giyim tarzı.",
        isTrending: true,
        coverImage: "https://i.pinimg.com/originals/30/06/22/300622bf760fef38f634baa63608c411.jpg",
        exampleItems: [
            { name: "Vintage Sokak Kombini", imageUrl: "https://i.pinimg.com/originals/30/06/22/300622bf760fef38f634baa63608c411.jpg" },
            { name: "Japon Sokak Tarzı", imageUrl: "https://i.pinimg.com/originals/97/2f/da/972fda795fc759b71d67ab613bcb3535.jpg" },
            { name: "Günlük Rahat Görünüm", imageUrl: "https://i.pinimg.com/originals/c3/58/ea/c358ea5e52fd21c652408b8feb97b879.jpg" },
            { name: "Business Casual Sokak", imageUrl: "https://i.pinimg.com/originals/e4/90/4e/e4904ed0b889260f9f428fb7a4d48b07.jpg" }
        ]
    },
    {
        id: "grunge",
        name: "Grunge",
        description: "90'lar rock müzik sahnesinden ilham alan, bilerek salaş ve asi bırakılmış bir görünüm. Yırtık kotlar, flanel oduncu gömlekler ve deri ceketler vazgeçilmezidir.",
        isTrending: false,
        coverImage: "https://images.unsplash.com/photo-1485230895905-ef20ee038ae1?q=80&w=800&auto=format&fit=crop",
        exampleItems: [
            { name: "Oduncu (Flanel) Gömlek", imageUrl: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb1?q=80&w=500&auto=format&fit=crop" },
            { name: "Yırtık Kot Pantolon", imageUrl: "https://images.unsplash.com/photo-1542280756-74b2f55e73e1?q=80&w=500&auto=format&fit=crop" },
            { name: "Postal (Combat Boot)", imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=500&auto=format&fit=crop" }
        ]
    },
    {
        id: "minimalist",
        name: "Minimalist",
        description: "Az ama öz anlayışına dayanan, temel ve birbirleriyle kolayca kombinlenebilir, desensiz kapsül gardırop parçalarının kullanıldığı sade şıklık.",
        isTrending: false,
        coverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
        exampleItems: [
            { name: "Beyaz Basic Tişört", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500&auto=format&fit=crop" },
            { name: "Siyah Kumaş Etek/Pantolon", imageUrl: "https://images.unsplash.com/photo-1590409384784-069bc9f635f7?q=80&w=500&auto=format&fit=crop" },
            { name: "Temiz Beyaz Sneaker", imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614c3a?q=80&w=500&auto=format&fit=crop" }
        ]
    },
    {
        id: "bohemian",
        name: "Bohem (Boho)",
        description: "Özgür ruhlu hippi kültüründen esinlenen; toprak tonları, bol ve dökümlü elbiseler, püsküller, etnik desenler ve el yapımı takılarla karakterize edilen doğal bir stil.",
        isTrending: false,
        coverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
        exampleItems: [
            { name: "Etnik Desenli Elbise", imageUrl: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=500&auto=format&fit=crop" },
            { name: "Püsküllü Yelek/Çanta", imageUrl: "https://images.unsplash.com/photo-1490212727658-941168ba8a24?q=80&w=500&auto=format&fit=crop" },
            { name: "Geniş Kenarlı Şapka", imageUrl: "https://images.unsplash.com/photo-1522851886-22442d8d6411?q=80&w=500&auto=format&fit=crop" }
        ]
    },
    {
        id: "dark-academia",
        name: "Dark Academia",
        description: "Klasik edebiyat, tarih ve gotik mimariden ilham alan entelektüel bir stil. Tweed ceketler, yün kazaklar, ekose etekler ve kahverengi/siyah/bordo ağırlıklı renkler ön plandadır.",
        isTrending: true,
        coverImage: "https://images.unsplash.com/photo-1579847188734-718227addda2?q=80&w=800&auto=format&fit=crop",
        exampleItems: [
            { name: "Vintage Kütüphane Stili", imageUrl: "https://images.unsplash.com/photo-1579847188734-718227addda2?q=80&w=800&auto=format&fit=crop" },
            { name: "Balıkçı Yaka Kazak", imageUrl: "https://images.unsplash.com/photo-1620612450893-b0bf2d0d0eb3?q=80&w=500&auto=format&fit=crop" },
            { name: "Tweed Blazer ve Yün", imageUrl: "https://images.unsplash.com/photo-1596773531393-2dfbd76e62ff?q=80&w=500&auto=format&fit=crop" },
            { name: "Klasik Oxford Deri", imageUrl: "https://images.unsplash.com/photo-1616239103859-fb95ee48de33?q=80&w=500&auto=format&fit=crop" },
            { name: "Koyu Ton Kışlık Kaban", imageUrl: "https://images.unsplash.com/photo-1549419106-a51bbda3c3da?q=80&w=500&auto=format&fit=crop" }
        ]
    },
    {
        id: "techwear",
        name: "Techwear / Cyberpunk",
        description: "Fonksiyonelliğin (su geçirmezlik, bol cepler) fütüristik ve distopik bir tasarımla buluştuğu 'ninja'vari sokak stili. Ağırlıklı olarak siyah renkler ve kargo pantolonlar içerir.",
        isTrending: false,
        coverImage: "https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?q=80&w=800&auto=format&fit=crop",
        exampleItems: [
            { name: "Neon Sokak Distopyası", imageUrl: "https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?q=80&w=800&auto=format&fit=crop" },
            { name: "Taktik Çok Cepli Kargo", imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=500&auto=format&fit=crop" },
            { name: "Siyah Teknoloji Ceketi", imageUrl: "https://images.unsplash.com/photo-1608248593847-fdfac6e4f3a5?q=80&w=500&auto=format&fit=crop" },
            { name: "Cyberpunk Maske/Boru", imageUrl: "https://images.unsplash.com/photo-1651859659424-699a38ee1ac8?q=80&w=500&auto=format&fit=crop" }
        ]
    },
    {
        id: "coquette",
        name: "Coquette / Soft Girl",
        description: "Romantik, feminen ve nostaljik bir stil. Fırfırlar, danteller, inciler, kurdeleler ve pastel tonlar (özellikle uçuk pembe ve beyaz) vazgeçilmezidir.",
        isTrending: true,
        coverImage: "https://images.unsplash.com/photo-1516049755146-566b720445d4?q=80&w=800&auto=format&fit=crop",
        exampleItems: [
            { name: "Pastel Romantik Tonlar", imageUrl: "https://images.unsplash.com/photo-1516049755146-566b720445d4?q=80&w=800&auto=format&fit=crop" },
            { name: "Dantelli Feminen Bluz", imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=500&auto=format&fit=crop" },
            { name: "Pembe Vintage Elbise", imageUrl: "https://images.unsplash.com/photo-1544215886-3531f86cd369?q=80&w=500&auto=format&fit=crop" },
            { name: "Soft İncili Aksesuar", imageUrl: "https://images.unsplash.com/photo-1582200382348-e04130ed8df3?q=80&w=500&auto=format&fit=crop" }
        ]
    }
];
