import { Product } from '@/types';

export const products: Product[] = [
  // Dogs
  {
    id: '1',
    name: 'คอร์กี้ผู้ชาย',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&h=300&fit=crop&crop=face',
    images: [
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop&crop=face'
    ],
    category: 'dogs',
    description: 'คอร์กี้ผู้ชายน่ารัก อายุ 3 เดือน มีใบรับรอง พร้อมวัคซีนครบ',
    stock: 2
  },
  {
    id: '2',
    name: 'โกลเด้น รีทรีฟเวอร์',
    price: 20000,
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop&crop=face',
    images: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=face'
    ],
    category: 'dogs',
    description: 'โกลเด้น รีทรีฟเวอร์ สุขภาพดี ฉีดวัคซีนครบ อายุ 2 เดือน',
    stock: 1
  },
  {
    id: '10',
    name: 'ชิบะ อินุ',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
    category: 'dogs',
    description: 'ชิบะ อินุ สายพันธุ์ญี่ปุ่น น่ารัก อายุ 4 เดือน',
    stock: 1
  },
  {
    id: '11',
    name: 'ปอมเมอเรเนียน',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=300&h=300&fit=crop&crop=face',
    category: 'dogs',
    description: 'ปอมเมอเรเนียน ขนฟู น่ารัก ขนาดเล็ก เหมาะกับคอนโด',
    stock: 3
  },

  // Cats
  {
    id: '3',
    name: 'แมวเปอร์เซีย',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1574231164645-d6f0e8553590?w=300&h=300&fit=crop&crop=face',
    category: 'cats',
    description: 'แมวเปอร์เซียขนยาว สีขาว น่ารักมาก อายุ 3 เดือน',
    stock: 3
  },
  {
    id: '4',
    name: 'แมวสก็อตติช โฟลด์',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=300&h=300&fit=crop&crop=face',
    category: 'cats',
    description: 'แมวสก็อตติช โฟลด์ หูพับ น่ารักเป็นพิเศษ อายุ 2 เดือน',
    stock: 2
  },
  {
    id: '12',
    name: 'แมวรัสเซียน บลู',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=300&h=300&fit=crop&crop=face',
    category: 'cats',
    description: 'แมวรัสเซียน บลู ขนสีเทาสวย นิสัยดี อายุ 3 เดือน',
    stock: 1
  },
  {
    id: '13',
    name: 'แมวเมนคูน',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=300&h=300&fit=crop&crop=face',
    category: 'cats',
    description: 'แมวเมนคูน ขนาดใหญ่ ขนยาวสวย นิสัยเป็นมิตร',
    stock: 1
  },

  // Birds
  {
    id: '5',
    name: 'นกแก้วโคคาเทล',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=300&h=300&fit=crop',
    category: 'birds',
    description: 'นกแก้วโคคาเทล เลี้ยงง่าย เสียงใส สีสวย',
    stock: 5
  },
  {
    id: '14',
    name: 'นกแก้วลอฟเบิร์ด',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=300&h=300&fit=crop',
    category: 'birds',
    description: 'นกแก้วลอฟเบิร์ด คู่รัก สีสวย เลี้ยงง่าย',
    stock: 8
  },
  {
    id: '15',
    name: 'นกคานารี',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop',
    category: 'birds',
    description: 'นกคานารี เสียงเพราะ สีเหลืองสวย เลี้ยงง่าย',
    stock: 10
  },

  // Food
  {
    id: '6',
    name: 'อาหารสุนัข Royal Canin',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&h=300&fit=crop',
    category: 'food',
    description: 'อาหารสุนัขคุณภาพสูง Royal Canin 3kg เหมาะสำหรับสุนัขโต',
    stock: 20
  },
  {
    id: '7',
    name: 'อาหารแมว Whiskas',
    price: 800,
    image: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=300&h=300&fit=crop',
    category: 'food',
    description: 'อาหารแมวเปียก Whiskas รสปลาทูน่า 12 ซอง',
    stock: 15
  },
  {
    id: '16',
    name: 'อาหารลูกสุนัข Pedigree',
    price: 950,
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&h=300&fit=crop',
    category: 'food',
    description: 'อาหารลูกสุนัข Pedigree 2.5kg สำหรับลูกสุนัข 2-12 เดือน',
    stock: 12
  },
  {
    id: '17',
    name: 'อาหารนก Versele-Laga',
    price: 450,
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=300&h=300&fit=crop',
    category: 'food',
    description: 'อาหารนกแก้ว Versele-Laga 1kg คุณภาพสูง',
    stock: 25
  },

  // Toys
  {
    id: '8',
    name: 'ลูกบอลยาง',
    price: 150,
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=300&fit=crop',
    category: 'toys',
    description: 'ลูกบอลยางสำหรับสุนัข ขนาดกลาง ทนทาน ปลอดภัย',
    stock: 30
  },
  {
    id: '9',
    name: 'ของเล่นแมว ปลาแคทนิป',
    price: 200,
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=300&fit=crop',
    category: 'toys',
    description: 'ของเล่นแมวรูปปลา มีแคทนิป กระตุ้นการเล่น',
    stock: 25
  },
  {
    id: '18',
    name: 'เชือกดึงสำหรับสุนัข',
    price: 180,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop',
    category: 'toys',
    description: 'เชือกดึงสำหรับสุนัข ทำจากผ้าฝ้าย ปลอดภัย',
    stock: 20
  },
  {
    id: '19',
    name: 'หนูของเล่นแมว',
    price: 120,
    image: 'https://images.unsplash.com/photo-1574231164645-d6f0e8553590?w=300&h=300&fit=crop',
    category: 'toys',
    description: 'หนูของเล่นแมว มีเสียง กระตุ้นสัญชาตญาณการล่า',
    stock: 35
  },
  {
    id: '20',
    name: 'ของเล่นนก กิ่งไม้',
    price: 250,
    image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=300&h=300&fit=crop',
    category: 'toys',
    description: 'ของเล่นนก กิ่งไม้ธรรมชาติ ปลอดภัย ช่วยลับเล็บ',
    stock: 15
  }
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function withSlugs(list: Product[]): Product[] {
  return list.map((p) => ({ ...p, slug: p.slug ?? `${slugify(p.name)}-${p.id}` }));
}

export function findProductBySlug(slug: string): Product | undefined {
  const list = withSlugs(products);
  return list.find((p) => p.slug === slug);
}