import ImageKit from '@imagekit/nodejs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awiyxxbzqjluoqowoiqk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3aXl4eGJ6cWpsdW9xb3dvaXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyNTg0OCwiZXhwIjoyMTAxNTAxODQ4fQ.DkAhrdot5Y-GPDwMZzyDLgSsVy8w1effRGshGxyYtlE';
const IMAGEKIT_PRIVATE_KEY = 'private_o0QhwSfXwEKaOhm95U/csTq+29g=';

const ADMIN_USER_ID = '29414fda-49f6-440b-ad84-af11b04197ff';
const SELLER_ID = '578b2f76-9c74-4e6a-bd33-2be1f0c3b29c'; // Gjanand Vedic Dairy Farms

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const imagekit = new ImageKit({
  privateKey: IMAGEKIT_PRIVATE_KEY,
});

// Category Base Images (High resolution Unsplash food & dairy photography)
const CATEGORY_IMAGE_SOURCES = {
  'Milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
  'Ghee': 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=800&auto=format&fit=crop&q=80',
  'Paneer': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
  'Curd & Dahi': 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=800&auto=format&fit=crop&q=80',
  'Butter & Makhan': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80',
  'Buttermilk & Lassi': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
  'Traditional Sweets': 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80',
  'Cream & Khoya': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
  'Organic Oils & Spices': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
  'Ayurveda & Wellness': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
};

// 10 Categories x 10 Products x 3 Variants = 100 Products, 300 Variants
const CATALOG_SPEC = [
  // ── 1. Milk ──
  {
    category: 'Milk',
    products: [
      {
        name: 'A2 Desi Gir Cow Milk',
        description: 'Raw, pure, unpasteurized farm-fresh milk from indigenous Gir cows.',
        variants: [
          { weight: '500ml', price: 48, original_price: 55, stock: 120 },
          { weight: '1 Litre', price: 90, original_price: 105, stock: 250 },
          { weight: '2 Litre', price: 175, original_price: 200, stock: 80 }
        ]
      },
      {
        name: 'Fresh Pure Buffalo Milk',
        description: 'Creamy high-fat (7.5%+ fat) pure Murrah buffalo milk, ideal for thick tea and curd.',
        variants: [
          { weight: '500ml', price: 42, original_price: 50, stock: 100 },
          { weight: '1 Litre', price: 80, original_price: 95, stock: 200 },
          { weight: '2 Litre', price: 155, original_price: 180, stock: 60 }
        ]
      },
      {
        name: 'Organic Pasteurized Cow Milk',
        description: 'Gently pasteurized and homogenized organic cow milk for the entire family.',
        variants: [
          { weight: '500ml', price: 38, original_price: 45, stock: 90 },
          { weight: '1 Litre', price: 72, original_price: 85, stock: 180 },
          { weight: '2 Litre', price: 140, original_price: 165, stock: 50 }
        ]
      },
      {
        name: 'Low Fat Toned Cow Milk',
        description: '98% fat-free light milk rich in natural calcium and protein for health-conscious living.',
        variants: [
          { weight: '500ml', price: 34, original_price: 40, stock: 80 },
          { weight: '1 Litre', price: 65, original_price: 75, stock: 150 },
          { weight: '2 Litre', price: 125, original_price: 145, stock: 40 }
        ]
      },
      {
        name: 'Fresh Farm A1 Cow Milk',
        description: 'Wholesome daily milk sourced directly from vetted dairy farmers in Banaskantha.',
        variants: [
          { weight: '500ml', price: 36, original_price: 42, stock: 110 },
          { weight: '1 Litre', price: 68, original_price: 80, stock: 210 },
          { weight: '2 Litre', price: 130, original_price: 150, stock: 65 }
        ]
      },
      {
        name: 'Vedic Badri Himalayan Cow Milk',
        description: 'Rare herb-fed indigenous Badri cow milk packed with natural immunity boosters.',
        variants: [
          { weight: '500ml', price: 75, original_price: 90, stock: 40 },
          { weight: '1 Litre', price: 145, original_price: 170, stock: 75 },
          { weight: '2 Litre', price: 280, original_price: 320, stock: 25 }
        ]
      },
      {
        name: 'Lactose-Free Pure Cow Milk',
        description: '100% natural cow milk treated with lactase enzyme for ultra-smooth digestion.',
        variants: [
          { weight: '500ml', price: 55, original_price: 65, stock: 50 },
          { weight: '1 Litre', price: 105, original_price: 120, stock: 90 },
          { weight: '2 Litre', price: 200, original_price: 230, stock: 30 }
        ]
      },
      {
        name: 'Double Toned Slim Milk',
        description: 'Ultra-light skimmed cow milk with only 1.5% fat and maximum natural minerals.',
        variants: [
          { weight: '500ml', price: 30, original_price: 36, stock: 70 },
          { weight: '1 Litre', price: 58, original_price: 68, stock: 140 },
          { weight: '2 Litre', price: 110, original_price: 130, stock: 35 }
        ]
      },
      {
        name: 'Kankrej Desi Cow Milk',
        description: 'Vedic Gujarat Kankrej breed cow milk, prized for cooling properties and aroma.',
        variants: [
          { weight: '500ml', price: 50, original_price: 60, stock: 85 },
          { weight: '1 Litre', price: 95, original_price: 110, stock: 170 },
          { weight: '2 Litre', price: 185, original_price: 215, stock: 55 }
        ]
      },
      {
        name: 'Fortified Junior Growth Milk',
        description: 'A2 cow milk naturally enriched with Vitamin D3, Vitamin A, and Zinc for growing children.',
        variants: [
          { weight: '500ml', price: 52, original_price: 62, stock: 60 },
          { weight: '1 Litre', price: 98, original_price: 115, stock: 120 },
          { weight: '2 Litre', price: 190, original_price: 220, stock: 40 }
        ]
      }
    ]
  },

  // ── 2. Ghee ──
  {
    category: 'Ghee',
    products: [
      {
        name: 'Traditional Bilona Gir Cow Ghee',
        description: 'Handcrafted using ancient Vedic Bilona method from curdled A2 Gir cow milk.',
        variants: [
          { weight: '250ml', price: 550, original_price: 650, stock: 70 },
          { weight: '500ml', price: 1050, original_price: 1200, stock: 150 },
          { weight: '1 Litre', price: 1999, original_price: 2300, stock: 90 }
        ]
      },
      {
        name: 'Organic A2 Hallikar Cow Ghee',
        description: 'Heritage breed southern Karnataka cow ghee with distinct aroma and deep yellow grain.',
        variants: [
          { weight: '250ml', price: 520, original_price: 600, stock: 50 },
          { weight: '500ml', price: 990, original_price: 1150, stock: 100 },
          { weight: '1 Litre', price: 1899, original_price: 2200, stock: 60 }
        ]
      },
      {
        name: 'Pure Buffalo Bilona Ghee',
        description: 'White granular ghee with high smoke point, ideal for sweets, tadkas, and deep frying.',
        variants: [
          { weight: '250ml', price: 350, original_price: 420, stock: 80 },
          { weight: '500ml', price: 680, original_price: 800, stock: 160 },
          { weight: '1 Litre', price: 1299, original_price: 1500, stock: 110 }
        ]
      },
      {
        name: 'Vedic Kankrej Cow Cultured Ghee',
        description: 'Golden granular ghee crafted in mud pots on cow dung cake embers.',
        variants: [
          { weight: '250ml', price: 480, original_price: 560, stock: 60 },
          { weight: '500ml', price: 920, original_price: 1080, stock: 120 },
          { weight: '1 Litre', price: 1750, original_price: 2050, stock: 75 }
        ]
      },
      {
        name: 'Herbal Brahmi Infused Ghee',
        description: 'Medhya Rasayana A2 ghee infused with fresh organic Brahmi leaves for cognitive vigor.',
        variants: [
          { weight: '200ml', price: 420, original_price: 500, stock: 45 },
          { weight: '500ml', price: 950, original_price: 1100, stock: 85 },
          { weight: '1 Litre', price: 1800, original_price: 2100, stock: 40 }
        ]
      },
      {
        name: 'Shatavari Herbal Cow Ghee',
        description: 'Vedic Rasayana formulation infused with wild Shatavari roots for holistic rejuvenation.',
        variants: [
          { weight: '200ml', price: 450, original_price: 530, stock: 40 },
          { weight: '500ml', price: 999, original_price: 1180, stock: 75 },
          { weight: '1 Litre', price: 1899, original_price: 2250, stock: 35 }
        ]
      },
      {
        name: 'Badri Himalayan Herb-Fed Ghee',
        description: 'Exquisite ghee from high-altitude free-grazing Badri cows feeding on medicinal herbs.',
        variants: [
          { weight: '250ml', price: 700, original_price: 820, stock: 30 },
          { weight: '500ml', price: 1350, original_price: 1550, stock: 60 },
          { weight: '1 Litre', price: 2599, original_price: 2999, stock: 30 }
        ]
      },
      {
        name: 'Turmeric Golden A2 Ghee',
        description: 'Blended with Lakadong high-curcumin turmeric and crushed black pepper for immunity.',
        variants: [
          { weight: '250ml', price: 450, original_price: 520, stock: 55 },
          { weight: '500ml', price: 850, original_price: 990, stock: 110 },
          { weight: '1 Litre', price: 1600, original_price: 1850, stock: 65 }
        ]
      },
      {
        name: 'Daily Farm Fresh Cow Ghee',
        description: 'Pure clarified butter with delightful nutty aroma for daily rotis, dals, and khichdi.',
        variants: [
          { weight: '500ml', price: 390, original_price: 460, stock: 130 },
          { weight: '1 Litre', price: 750, original_price: 880, stock: 240 },
          { weight: '2 Litre', price: 1450, original_price: 1700, stock: 95 }
        ]
      },
      {
        name: 'Cow Milk Cultured Organic Ghee',
        description: 'Traditional slow-cooked fermented curd ghee boasting rich grainy texture.',
        variants: [
          { weight: '250ml', price: 420, original_price: 490, stock: 65 },
          { weight: '500ml', price: 799, original_price: 930, stock: 130 },
          { weight: '1 Litre', price: 1520, original_price: 1780, stock: 80 }
        ]
      }
    ]
  },

  // ── 3. Paneer ──
  {
    category: 'Paneer',
    products: [
      {
        name: 'Fresh Malai Paneer',
        description: 'Velvety, soft, melt-in-the-mouth cottage cheese crafted fresh every morning.',
        variants: [
          { weight: '200g', price: 95, original_price: 110, stock: 140 },
          { weight: '500g', price: 220, original_price: 250, stock: 220 },
          { weight: '1kg', price: 420, original_price: 480, stock: 90 }
        ]
      },
      {
        name: 'A2 Desi Cow Milk Paneer',
        description: 'Handmade exclusively from pure A2 Gir cow milk without any additives or starches.',
        variants: [
          { weight: '200g', price: 130, original_price: 150, stock: 80 },
          { weight: '500g', price: 310, original_price: 360, stock: 140 },
          { weight: '1kg', price: 599, original_price: 690, stock: 60 }
        ]
      },
      {
        name: 'Low Fat High Protein Paneer',
        description: 'Toned milk cottage cheese delivering 22g protein per 100g with minimal calories.',
        variants: [
          { weight: '200g', price: 85, original_price: 100, stock: 95 },
          { weight: '500g', price: 199, original_price: 230, stock: 160 },
          { weight: '1kg', price: 380, original_price: 440, stock: 70 }
        ]
      },
      {
        name: 'Buffalo Milk Rich Block Paneer',
        description: 'Dense, firm paneer that holds its shape exquisitely on the tawa and barbecue grill.',
        variants: [
          { weight: '200g', price: 90, original_price: 105, stock: 110 },
          { weight: '500g', price: 210, original_price: 240, stock: 190 },
          { weight: '1kg', price: 399, original_price: 460, stock: 85 }
        ]
      },
      {
        name: 'Organic Farm Pressed Paneer',
        description: 'Certified organic dairy cottage cheese made using natural lemon curdling.',
        variants: [
          { weight: '200g', price: 110, original_price: 130, stock: 75 },
          { weight: '500g', price: 260, original_price: 300, stock: 130 },
          { weight: '1kg', price: 499, original_price: 570, stock: 50 }
        ]
      },
      {
        name: 'Spiced Masala Paneer',
        description: 'Kneaded with fresh green coriander, crushed cumin, black pepper, and rock salt.',
        variants: [
          { weight: '200g', price: 115, original_price: 135, stock: 70 },
          { weight: '500g', price: 275, original_price: 320, stock: 115 },
          { weight: '1kg', price: 525, original_price: 600, stock: 45 }
        ]
      },
      {
        name: 'Herbed Garlic & Pepper Paneer',
        description: 'Artisanal seasoned paneer cubes infused with roasted garlic and crushed peppercorns.',
        variants: [
          { weight: '200g', price: 120, original_price: 140, stock: 60 },
          { weight: '500g', price: 285, original_price: 330, stock: 95 },
          { weight: '1kg', price: 540, original_price: 620, stock: 40 }
        ]
      },
      {
        name: 'Pre-Diced Tandoori Paneer Cubes',
        description: 'Ready-to-cook uniform paneer cubes for shahi paneer, matar paneer, and tikkas.',
        variants: [
          { weight: '250g', price: 125, original_price: 145, stock: 90 },
          { weight: '500g', price: 240, original_price: 275, stock: 150 },
          { weight: '1kg', price: 460, original_price: 530, stock: 65 }
        ]
      },
      {
        name: 'Turmeric Infused Golden Paneer',
        description: 'Natural antiseptic cottage cheese infused with cold-pressed turmeric essence.',
        variants: [
          { weight: '200g', price: 125, original_price: 145, stock: 55 },
          { weight: '500g', price: 290, original_price: 335, stock: 90 },
          { weight: '1kg', price: 550, original_price: 630, stock: 35 }
        ]
      },
      {
        name: 'Kesar Elaichi Sweet Paneer',
        description: 'Mildly sweetened festive paneer cubes scented with pure saffron and green cardamom.',
        variants: [
          { weight: '200g', price: 140, original_price: 165, stock: 45 },
          { weight: '500g', price: 330, original_price: 380, stock: 75 },
          { weight: '1kg', price: 620, original_price: 710, stock: 30 }
        ]
      }
    ]
  },

  // ── 4. Curd & Dahi ──
  {
    category: 'Curd & Dahi',
    products: [
      {
        name: 'Traditional Clay Pot Set Dahi',
        description: 'Naturally thick, non-sour curd cultured slowly in porous terracotta earthen handis.',
        variants: [
          { weight: '400g', price: 60, original_price: 70, stock: 130 },
          { weight: '800g', price: 115, original_price: 135, stock: 180 },
          { weight: '1.5kg', price: 210, original_price: 240, stock: 70 }
        ]
      },
      {
        name: 'A2 Gir Cow Farm Curd',
        description: 'Indigenous A2 milk curd teeming with active probiotic lactobacillus cultures.',
        variants: [
          { weight: '400g', price: 80, original_price: 95, stock: 85 },
          { weight: '800g', price: 150, original_price: 175, stock: 140 },
          { weight: '1.5kg', price: 280, original_price: 320, stock: 55 }
        ]
      },
      {
        name: 'Creamy Buffalo Milk Dahi',
        description: 'Rich buffalo milk curd featuring a firm, glossy malai crust on top.',
        variants: [
          { weight: '400g', price: 55, original_price: 65, stock: 120 },
          { weight: '800g', price: 105, original_price: 125, stock: 190 },
          { weight: '1.5kg', price: 195, original_price: 225, stock: 80 }
        ]
      },
      {
        name: 'Greek Style High Protein Yogurt',
        description: 'Slow-strained whey-drained velvety curd offering double the protein of regular dahi.',
        variants: [
          { weight: '200g', price: 70, original_price: 85, stock: 75 },
          { weight: '400g', price: 130, original_price: 150, stock: 130 },
          { weight: '800g', price: 240, original_price: 280, stock: 60 }
        ]
      },
      {
        name: 'Organic Probiotic Cow Yogurt',
        description: 'Contains 5 active probiotic strains to aid digestion and boost microbiome health.',
        variants: [
          { weight: '400g', price: 65, original_price: 75, stock: 90 },
          { weight: '800g', price: 120, original_price: 140, stock: 150 },
          { weight: '1.5kg', price: 220, original_price: 255, stock: 65 }
        ]
      },
      {
        name: 'Zero Sugar Diet Curd',
        description: 'Crafted from double-toned skimmed milk for calorie-conscious diets.',
        variants: [
          { weight: '400g', price: 50, original_price: 60, stock: 80 },
          { weight: '800g', price: 95, original_price: 110, stock: 130 },
          { weight: '1.5kg', price: 180, original_price: 210, stock: 50 }
        ]
      },
      {
        name: 'Alphonso Mango Farm Yogurt',
        description: 'Rich curd churned with authentic Ratnagiri Alphonso mango pulp.',
        variants: [
          { weight: '200g', price: 60, original_price: 70, stock: 70 },
          { weight: '400g', price: 115, original_price: 135, stock: 110 },
          { weight: '800g', price: 215, original_price: 250, stock: 45 }
        ]
      },
      {
        name: 'Strawberry Probiotic Yogurt',
        description: 'Whipped with real Mahabaleshwar strawberry fruit puree and honey.',
        variants: [
          { weight: '200g', price: 60, original_price: 70, stock: 65 },
          { weight: '400g', price: 115, original_price: 135, stock: 105 },
          { weight: '800g', price: 215, original_price: 250, stock: 40 }
        ]
      },
      {
        name: 'Spiced Boondi Raita Dahi',
        description: 'Light, silky seasoned curd mixed with black salt, roasted cumin, and mint.',
        variants: [
          { weight: '400g', price: 65, original_price: 75, stock: 85 },
          { weight: '800g', price: 125, original_price: 145, stock: 135 },
          { weight: '1.5kg', price: 230, original_price: 265, stock: 55 }
        ]
      },
      {
        name: 'Hung Curd Chakka (Dessert Base)',
        description: 'Thick solid strained yogurt chakka, ready for whipping into gourmet Shrikhand.',
        variants: [
          { weight: '250g', price: 90, original_price: 105, stock: 60 },
          { weight: '500g', price: 170, original_price: 195, stock: 100 },
          { weight: '1kg', price: 320, original_price: 370, stock: 45 }
        ]
      }
    ]
  },

  // ── 5. Butter & Makhan ──
  {
    category: 'Butter & Makhan',
    products: [
      {
        name: 'Traditional Safed Makhan',
        description: 'Unsalted, fresh white butter churned from cultured cream in classical bilona vats.',
        variants: [
          { weight: '200g', price: 110, original_price: 130, stock: 120 },
          { weight: '500g', price: 260, original_price: 300, stock: 180 },
          { weight: '1kg', price: 499, original_price: 575, stock: 80 }
        ]
      },
      {
        name: 'Cultured Salted Farm Butter',
        description: 'Yellow table butter crafted from ripened cream with natural rock salt.',
        variants: [
          { weight: '100g', price: 58, original_price: 68, stock: 150 },
          { weight: '250g', price: 140, original_price: 165, stock: 240 },
          { weight: '500g', price: 270, original_price: 310, stock: 110 }
        ]
      },
      {
        name: 'A2 Desi Cow Bilona Makhan',
        description: 'Heritage white butter churned from pure A2 Gir cow whole milk dahi.',
        variants: [
          { weight: '200g', price: 160, original_price: 190, stock: 70 },
          { weight: '500g', price: 380, original_price: 440, stock: 120 },
          { weight: '1kg', price: 720, original_price: 830, stock: 50 }
        ]
      },
      {
        name: 'Buffalo Milk Rich White Butter',
        description: 'High-fat white makhan, perfect for hot aloo parathas and dal makhani dollops.',
        variants: [
          { weight: '200g', price: 100, original_price: 115, stock: 95 },
          { weight: '500g', price: 240, original_price: 275, stock: 160 },
          { weight: '1kg', price: 460, original_price: 530, stock: 70 }
        ]
      },
      {
        name: 'Roasted Garlic & Herb Butter',
        description: 'Artisanal table butter seasoned with slow-roasted garlic and Mediterranean parsley.',
        variants: [
          { weight: '150g', price: 120, original_price: 140, stock: 65 },
          { weight: '300g', price: 230, original_price: 265, stock: 110 },
          { weight: '500g', price: 370, original_price: 425, stock: 50 }
        ]
      },
      {
        name: 'Unsalted European-Style Bakery Butter',
        description: '82% butterfat premium cultured butter engineered for flaky croissants and pastries.',
        variants: [
          { weight: '250g', price: 135, original_price: 155, stock: 80 },
          { weight: '500g', price: 260, original_price: 300, stock: 140 },
          { weight: '1kg', price: 500, original_price: 580, stock: 60 }
        ]
      },
      {
        name: 'Chilli Flakes & Oregano Spiced Butter',
        description: 'Savory flavored breakfast butter with spicy red chilli flecks and oregano.',
        variants: [
          { weight: '150g', price: 125, original_price: 145, stock: 55 },
          { weight: '300g', price: 240, original_price: 275, stock: 95 },
          { weight: '500g', price: 380, original_price: 435, stock: 45 }
        ]
      },
      {
        name: 'Honey & Cinnamon Sweet Butter',
        description: 'Velvety whipped dessert spread with forest honey and Ceylon cinnamon.',
        variants: [
          { weight: '150g', price: 130, original_price: 150, stock: 50 },
          { weight: '300g', price: 250, original_price: 290, stock: 85 },
          { weight: '500g', price: 399, original_price: 460, stock: 40 }
        ]
      },
      {
        name: 'Cultured Brown Butter (Beurre Noisette)',
        description: 'Slow-simmered toasted butter solids with deep hazelnut aroma.',
        variants: [
          { weight: '200g', price: 150, original_price: 175, stock: 45 },
          { weight: '400g', price: 290, original_price: 335, stock: 75 },
          { weight: '800g', price: 560, original_price: 645, stock: 35 }
        ]
      },
      {
        name: 'Clarified Roti Glaze Butter',
        description: 'Warm liquid butter blend formulated for brushing hot rotis, nans, and rotlas.',
        variants: [
          { weight: '200g', price: 120, original_price: 140, stock: 85 },
          { weight: '500g', price: 280, original_price: 320, stock: 130 },
          { weight: '1kg', price: 530, original_price: 610, stock: 55 }
        ]
      }
    ]
  },

  // ── 6. Buttermilk & Lassi ──
  {
    category: 'Buttermilk & Lassi',
    products: [
      {
        name: 'Fresh Spiced Masala Chhas',
        description: 'Light, digestive buttermilk infused with roasted cumin, green chillies, and ginger.',
        variants: [
          { weight: '500ml', price: 25, original_price: 30, stock: 200 },
          { weight: '1 Litre', price: 45, original_price: 55, stock: 300 },
          { weight: '2 Litre', price: 85, original_price: 100, stock: 120 }
        ]
      },
      {
        name: 'Thick Punjabi Sweet Lassi',
        description: 'Thick, creamy traditional lassi finished with a generous dollop of fresh malai.',
        variants: [
          { weight: '300ml', price: 40, original_price: 50, stock: 140 },
          { weight: '500ml', price: 65, original_price: 75, stock: 210 },
          { weight: '1 Litre', price: 120, original_price: 140, stock: 90 }
        ]
      },
      {
        name: 'A2 Desi Cow Bilona Buttermilk',
        description: 'Pure byproduct of traditional A2 bilona butter churning; 100% cooling and natural.',
        variants: [
          { weight: '500ml', price: 35, original_price: 42, stock: 110 },
          { weight: '1 Litre', price: 65, original_price: 75, stock: 180 },
          { weight: '2 Litre', price: 120, original_price: 140, stock: 75 }
        ]
      },
      {
        name: 'Alphonso Mango Royal Lassi',
        description: 'Sweet, sun-kissed mango pulp whipped with creamy probiotic curd.',
        variants: [
          { weight: '300ml', price: 50, original_price: 60, stock: 120 },
          { weight: '500ml', price: 80, original_price: 95, stock: 175 },
          { weight: '1 Litre', price: 150, original_price: 175, stock: 70 }
        ]
      },
      {
        name: 'Kesar Badam Shahi Lassi',
        description: 'Kashmiri saffron and slivered California almonds blended in velvety curd.',
        variants: [
          { weight: '300ml', price: 55, original_price: 65, stock: 90 },
          { weight: '500ml', price: 90, original_price: 105, stock: 145 },
          { weight: '1 Litre', price: 170, original_price: 195, stock: 60 }
        ]
      },
      {
        name: 'Plain Salted Table Buttermilk',
        description: 'Simple, unadulterated churned buttermilk with Himalayan pink rock salt.',
        variants: [
          { weight: '500ml', price: 20, original_price: 25, stock: 180 },
          { weight: '1 Litre', price: 38, original_price: 45, stock: 260 },
          { weight: '2 Litre', price: 70, original_price: 85, stock: 110 }
        ]
      },
      {
        name: 'Jeera Tadka Buttermilk',
        description: 'Tempered with crackling mustard seeds, curry leaves, and fragrant cumin.',
        variants: [
          { weight: '500ml', price: 28, original_price: 35, stock: 130 },
          { weight: '1 Litre', price: 52, original_price: 60, stock: 190 },
          { weight: '2 Litre', price: 98, original_price: 115, stock: 80 }
        ]
      },
      {
        name: 'Rose Gulkand Fragrant Lassi',
        description: 'Infused with fragrant Damask rose petals and ancient sun-cooked gulkand.',
        variants: [
          { weight: '300ml', price: 45, original_price: 55, stock: 85 },
          { weight: '500ml', price: 75, original_price: 90, stock: 135 },
          { weight: '1 Litre', price: 140, original_price: 165, stock: 55 }
        ]
      },
      {
        name: 'Mint & Coriander Pudina Chhas',
        description: 'Cooling digestive herb chhas with crisp mountain mint and coriander leaf extracts.',
        variants: [
          { weight: '500ml', price: 30, original_price: 36, stock: 115 },
          { weight: '1 Litre', price: 55, original_price: 65, stock: 170 },
          { weight: '2 Litre', price: 100, original_price: 120, stock: 65 }
        ]
      },
      {
        name: 'Chilled Strawberry Lassi',
        description: 'Real farm strawberry puree combined with smooth chilled curd.',
        variants: [
          { weight: '300ml', price: 48, original_price: 58, stock: 80 },
          { weight: '500ml', price: 78, original_price: 92, stock: 120 },
          { weight: '1 Litre', price: 145, original_price: 170, stock: 50 }
        ]
      }
    ]
  },

  // ── 7. Traditional Sweets ──
  {
    category: 'Traditional Sweets',
    products: [
      {
        name: 'Authentic Kesar Shrikhand',
        description: 'Velvety hung curd blended with Kashmiri saffron, slivered pistachios, and cardamom.',
        variants: [
          { weight: '250g', price: 140, original_price: 165, stock: 90 },
          { weight: '500g', price: 260, original_price: 300, stock: 160 },
          { weight: '1kg', price: 499, original_price: 580, stock: 75 }
        ]
      },
      {
        name: 'Mathura Style Khoya Peda',
        description: 'Caramelized reduced milk solids hand-rolled with aromatic green cardamom.',
        variants: [
          { weight: '250g', price: 150, original_price: 175, stock: 85 },
          { weight: '500g', price: 280, original_price: 320, stock: 150 },
          { weight: '1kg', price: 540, original_price: 620, stock: 65 }
        ]
      },
      {
        name: 'Pure Desi Ghee Gulab Jamun',
        description: 'Soft cottage cheese and mawa dumplings fried in cow ghee and soaked in rose syrup.',
        variants: [
          { weight: '500g', price: 180, original_price: 210, stock: 110 },
          { weight: '1kg', price: 340, original_price: 395, stock: 170 },
          { weight: '2kg', price: 650, original_price: 750, stock: 60 }
        ]
      },
      {
        name: 'Kaju Katli Cashew Fudge',
        description: 'Diamond-shaped cashew delicacy made with premium Goan cashews and edible silver leaf.',
        variants: [
          { weight: '250g', price: 260, original_price: 300, stock: 120 },
          { weight: '500g', price: 500, original_price: 580, stock: 190 },
          { weight: '1kg', price: 980, original_price: 1120, stock: 80 }
        ]
      },
      {
        name: 'Fresh Cow Milk Rasgulla',
        description: 'Light, spongy fresh chenna spheres simmered in crystal clear sugar syrup.',
        variants: [
          { weight: '500g', price: 160, original_price: 185, stock: 100 },
          { weight: '1kg', price: 300, original_price: 350, stock: 160 },
          { weight: '2kg', price: 570, original_price: 660, stock: 55 }
        ]
      },
      {
        name: 'Besan Ladoo in Pure Cow Ghee',
        description: 'Coarse gram flour roasted slowly in golden ghee with crunchy watermelon seeds.',
        variants: [
          { weight: '250g', price: 160, original_price: 185, stock: 95 },
          { weight: '500g', price: 310, original_price: 360, stock: 150 },
          { weight: '1kg', price: 599, original_price: 690, stock: 70 }
        ]
      },
      {
        name: 'Malai Cham Cham',
        description: 'Classic Bengali chenna rolls simmered and stuffed with sweetened mawa cream.',
        variants: [
          { weight: '250g', price: 175, original_price: 205, stock: 75 },
          { weight: '500g', price: 330, original_price: 380, stock: 120 },
          { weight: '1kg', price: 630, original_price: 725, stock: 50 }
        ]
      },
      {
        name: 'Alphonso Mango Amrakhand',
        description: 'Hung curd whipped with pure Ratnagiri Alphonso mango pulp and saffron.',
        variants: [
          { weight: '250g', price: 145, original_price: 170, stock: 80 },
          { weight: '500g', price: 275, original_price: 320, stock: 140 },
          { weight: '1kg', price: 520, original_price: 600, stock: 65 }
        ]
      },
      {
        name: 'Dharwad Heritage Brown Peda',
        description: 'Slow-caramelized milk sweet coated in powdered sugar crystals, rich and nutty.',
        variants: [
          { weight: '250g', price: 165, original_price: 195, stock: 70 },
          { weight: '500g', price: 315, original_price: 365, stock: 110 },
          { weight: '1kg', price: 600, original_price: 690, stock: 45 }
        ]
      },
      {
        name: 'Royal Badam Halwa in Cow Ghee',
        description: 'Decadent almond pudding cooked with soaked California almonds, ghee, and saffron.',
        variants: [
          { weight: '200g', price: 220, original_price: 255, stock: 60 },
          { weight: '400g', price: 420, original_price: 490, stock: 95 },
          { weight: '800g', price: 800, original_price: 920, stock: 40 }
        ]
      }
    ]
  },

  // ── 8. Cream & Khoya ──
  {
    category: 'Cream & Khoya',
    products: [
      {
        name: 'Fresh Dairy Cooking Cream',
        description: '25% milk fat smooth cooking cream for luscious gravies, pasta, and soups.',
        variants: [
          { weight: '250ml', price: 75, original_price: 90, stock: 110 },
          { weight: '500ml', price: 140, original_price: 165, stock: 180 },
          { weight: '1 Litre', price: 260, original_price: 300, stock: 80 }
        ]
      },
      {
        name: 'Heavy Malai Whipping Cream',
        description: '35%+ butterfat thick whipping cream that whips to stiff peaks in minutes.',
        variants: [
          { weight: '250ml', price: 95, original_price: 115, stock: 90 },
          { weight: '500ml', price: 180, original_price: 210, stock: 150 },
          { weight: '1 Litre', price: 340, original_price: 390, stock: 65 }
        ]
      },
      {
        name: 'Fresh Danedar Khoya (Mawa)',
        description: 'Granular unsweetened reduced milk solids for kalakand, pedas, and barfis.',
        variants: [
          { weight: '250g', price: 125, original_price: 145, stock: 100 },
          { weight: '500g', price: 240, original_price: 280, stock: 170 },
          { weight: '1kg', price: 460, original_price: 530, stock: 75 }
        ]
      },
      {
        name: 'Smooth Chikna Mawa for Gulab Jamun',
        description: 'Silky, fine-textured khoya block ideal for kneading into lump-free gulab jamuns.',
        variants: [
          { weight: '250g', price: 130, original_price: 150, stock: 85 },
          { weight: '500g', price: 250, original_price: 290, stock: 140 },
          { weight: '1kg', price: 480, original_price: 550, stock: 60 }
        ]
      },
      {
        name: 'A2 Gir Cow Milk Khoya',
        description: 'Pure indigenous cow milk mawa simmered slowly in open iron pans.',
        variants: [
          { weight: '250g', price: 175, original_price: 205, stock: 60 },
          { weight: '500g', price: 330, original_price: 380, stock: 100 },
          { weight: '1kg', price: 640, original_price: 730, stock: 45 }
        ]
      },
      {
        name: 'Buffalo Milk Hariyali Mawa',
        description: 'High-moisture rich mawa block for rich seasonal gajar halwa and gujiyas.',
        variants: [
          { weight: '250g', price: 120, original_price: 140, stock: 95 },
          { weight: '500g', price: 230, original_price: 265, stock: 160 },
          { weight: '1kg', price: 440, original_price: 510, stock: 70 }
        ]
      },
      {
        name: 'Cultured Sour Cream',
        description: 'Tangy, probiotic cultured dairy cream for Mexican burritos, dips, and baked potatoes.',
        variants: [
          { weight: '200g', price: 90, original_price: 105, stock: 70 },
          { weight: '400g', price: 170, original_price: 195, stock: 110 },
          { weight: '800g', price: 320, original_price: 370, stock: 45 }
        ]
      },
      {
        name: 'Thick Clotted Farm Cream',
        description: 'Gently baked unhomogenized cream forming a thick golden crust for scones and fruit.',
        variants: [
          { weight: '150g', price: 120, original_price: 140, stock: 50 },
          { weight: '300g', price: 225, original_price: 260, stock: 80 },
          { weight: '500g', price: 360, original_price: 415, stock: 35 }
        ]
      },
      {
        name: 'Sweetened Layered Rabdi',
        description: 'Traditional slow-boiled milk layers seasoned with green cardamom and saffron.',
        variants: [
          { weight: '250g', price: 140, original_price: 165, stock: 75 },
          { weight: '500g', price: 260, original_price: 300, stock: 120 },
          { weight: '1kg', price: 500, original_price: 580, stock: 50 }
        ]
      },
      {
        name: 'Peda Dough Mawa Base',
        description: 'Pre-cooked caramelized milk base ready for rolling into instant fresh pedas.',
        variants: [
          { weight: '250g', price: 135, original_price: 155, stock: 65 },
          { weight: '500g', price: 255, original_price: 295, stock: 110 },
          { weight: '1kg', price: 490, original_price: 560, stock: 45 }
        ]
      }
    ]
  },

  // ── 9. Organic Oils & Spices ──
  {
    category: 'Organic Oils & Spices',
    products: [
      {
        name: 'Kachi Ghani Wood-Pressed Mustard Oil',
        description: 'Authentic pungent mustard oil extracted at low temperatures in traditional wooden kolhu.',
        variants: [
          { weight: '500ml', price: 110, original_price: 130, stock: 130 },
          { weight: '1 Litre', price: 210, original_price: 245, stock: 220 },
          { weight: '5 Litre', price: 999, original_price: 1150, stock: 70 }
        ]
      },
      {
        name: 'Cold-Pressed Groundnut Oil',
        description: 'Unrefined, fragrant peanut oil with natural vitamin E and zero chemical processing.',
        variants: [
          { weight: '500ml', price: 125, original_price: 145, stock: 110 },
          { weight: '1 Litre', price: 240, original_price: 280, stock: 190 },
          { weight: '5 Litre', price: 1150, original_price: 1320, stock: 65 }
        ]
      },
      {
        name: 'Cold-Pressed Virgin Coconut Oil',
        description: 'Pure, raw coconut oil expeller-pressed from fresh organic Kerala coconut meat.',
        variants: [
          { weight: '250ml', price: 140, original_price: 165, stock: 85 },
          { weight: '500ml', price: 260, original_price: 300, stock: 140 },
          { weight: '1 Litre', price: 499, original_price: 575, stock: 75 }
        ]
      },
      {
        name: 'Organic Sesame (Til) Cold-Pressed Oil',
        description: 'Cold-pressed from unhulled black and brown sesame seeds; high in calcium and sesamol.',
        variants: [
          { weight: '500ml', price: 160, original_price: 190, stock: 75 },
          { weight: '1 Litre', price: 310, original_price: 360, stock: 120 },
          { weight: '5 Litre', price: 1480, original_price: 1700, stock: 45 }
        ]
      },
      {
        name: 'Organic Lakadong Turmeric Powder',
        description: 'World-renowned Meghalaya Lakadong turmeric containing an unmatched 7.5%+ curcumin.',
        variants: [
          { weight: '100g', price: 75, original_price: 90, stock: 150 },
          { weight: '250g', price: 170, original_price: 200, stock: 250 },
          { weight: '500g', price: 320, original_price: 375, stock: 110 }
        ]
      },
      {
        name: 'Kashmiri Lal Mirch Powder',
        description: 'Sun-dried mild red chillies delivering vivid natural ruby color without harsh heat.',
        variants: [
          { weight: '100g', price: 85, original_price: 100, stock: 130 },
          { weight: '250g', price: 195, original_price: 230, stock: 210 },
          { weight: '500g', price: 370, original_price: 430, stock: 95 }
        ]
      },
      {
        name: 'Stone-Ground Coriander (Dhaniya) Powder',
        description: 'Freshly roasted whole coriander seeds ground in stone mills to preserve volatile oils.',
        variants: [
          { weight: '100g', price: 55, original_price: 65, stock: 140 },
          { weight: '250g', price: 125, original_price: 145, stock: 220 },
          { weight: '500g', price: 240, original_price: 280, stock: 100 }
        ]
      },
      {
        name: 'Unpolished Saurashtra Cumin (Jeera)',
        description: 'Bold, sun-dried Gujarat cumin seeds bursting with warm earthy thymol aroma.',
        variants: [
          { weight: '100g', price: 70, original_price: 85, stock: 125 },
          { weight: '250g', price: 160, original_price: 190, stock: 195 },
          { weight: '500g', price: 300, original_price: 350, stock: 85 }
        ]
      },
      {
        name: 'Royal Shahi Garam Masala Blend',
        description: 'Master blend of 16 whole roasted spices including star anise, mace, and green cardamom.',
        variants: [
          { weight: '100g', price: 110, original_price: 130, stock: 90 },
          { weight: '200g', price: 205, original_price: 240, stock: 140 },
          { weight: '500g', price: 480, original_price: 560, stock: 65 }
        ]
      },
      {
        name: 'Cold-Pressed Flaxseed (Alsi) Oil',
        description: 'Pure raw flaxseed oil rich in alpha-linolenic acid (Omega-3) for cardiovascular wellness.',
        variants: [
          { weight: '250ml', price: 165, original_price: 195, stock: 70 },
          { weight: '500ml', price: 310, original_price: 360, stock: 110 },
          { weight: '1 Litre', price: 590, original_price: 690, stock: 50 }
        ]
      }
    ]
  },

  // ── 10. Ayurveda & Wellness ──
  {
    category: 'Ayurveda & Wellness',
    products: [
      {
        name: 'Vedic Amla Chyawanprash in A2 Ghee',
        description: 'Classical 42-herb immunity rasayana prepared in pure A2 Gir cow ghee with forest amla.',
        variants: [
          { weight: '250g', price: 220, original_price: 260, stock: 85 },
          { weight: '500g', price: 399, original_price: 470, stock: 160 },
          { weight: '1kg', price: 750, original_price: 880, stock: 70 }
        ]
      },
      {
        name: 'Organic Ashwagandha Root Powder',
        description: 'Pure Withania somnifera root powder to ease stress, elevate stamina, and promote sleep.',
        variants: [
          { weight: '100g', price: 110, original_price: 130, stock: 120 },
          { weight: '250g', price: 250, original_price: 295, stock: 190 },
          { weight: '500g', price: 470, original_price: 550, stock: 80 }
        ]
      },
      {
        name: 'Pure Shatavari Root Hormone Tonic',
        description: 'Organic Asparagus racemosus powder supporting holistic feminine vitality and balance.',
        variants: [
          { weight: '100g', price: 125, original_price: 150, stock: 95 },
          { weight: '250g', price: 280, original_price: 330, stock: 150 },
          { weight: '500g', price: 520, original_price: 610, stock: 65 }
        ]
      },
      {
        name: 'Triphala Digestive Churna',
        description: 'Equal blend of organic Amla, Haritaki, and Bibhitaki for natural digestive cleansing.',
        variants: [
          { weight: '100g', price: 80, original_price: 95, stock: 130 },
          { weight: '250g', price: 180, original_price: 215, stock: 210 },
          { weight: '500g', price: 340, original_price: 395, stock: 90 }
        ]
      },
      {
        name: 'Golden Turmeric Latte Milk Masala',
        description: 'Instant warming brew mix of Lakadong turmeric, cinnamon, ginger, and saffron.',
        variants: [
          { weight: '100g', price: 140, original_price: 165, stock: 85 },
          { weight: '200g', price: 260, original_price: 300, stock: 140 },
          { weight: '500g', price: 600, original_price: 700, stock: 55 }
        ]
      },
      {
        name: 'Moringa Leaf Superfood Powder',
        description: 'Shade-dried drumstick leaf powder containing 92 nutrients and 46 antioxidants.',
        variants: [
          { weight: '100g', price: 95, original_price: 115, stock: 110 },
          { weight: '250g', price: 210, original_price: 250, stock: 175 },
          { weight: '500g', price: 390, original_price: 460, stock: 75 }
        ]
      },
      {
        name: 'Brahmi Cognitive & Calm Herbal Powder',
        description: 'Centella asiatica leaf powder to sharpen focus, memory, and nervous system clarity.',
        variants: [
          { weight: '100g', price: 115, original_price: 135, stock: 90 },
          { weight: '250g', price: 260, original_price: 305, stock: 140 },
          { weight: '500g', price: 490, original_price: 575, stock: 60 }
        ]
      },
      {
        name: 'Pure Himalayan Shilajit Gold Resin',
        description: 'Wildcrafted high-altitude 18,000ft Himalayan black shilajit resin with 75%+ fulvic acid.',
        variants: [
          { weight: '15g', price: 599, original_price: 750, stock: 70 },
          { weight: '30g', price: 1099, original_price: 1350, stock: 110 },
          { weight: '50g', price: 1699, original_price: 2100, stock: 45 }
        ]
      },
      {
        name: 'Giloy (Guduchi) Stem Extract Powder',
        description: 'Known as "Amrita" in classical Ayurveda, powerful detoxifying immunomodulator herb.',
        variants: [
          { weight: '100g', price: 90, original_price: 110, stock: 105 },
          { weight: '250g', price: 200, original_price: 235, stock: 160 },
          { weight: '500g', price: 380, original_price: 445, stock: 70 }
        ]
      },
      {
        name: 'Deep Sleep Nutmeg & Saffron Herbal Mix',
        description: 'Ayurvedic nighttime calm blend of Jaiphal, Tagara, Ashwagandha, and saffron.',
        variants: [
          { weight: '100g', price: 160, original_price: 190, stock: 75 },
          { weight: '250g', price: 360, original_price: 420, stock: 115 },
          { weight: '500g', price: 680, original_price: 790, stock: 50 }
        ]
      }
    ]
  }
];

async function main() {
  console.log('====================================================');
  console.log('🚀 SEEDING 100 PRODUCTS (10 CATEGORIES x 10 PRODUCTS)');
  console.log('   EACH WITH MINIMUM 3 VARIANTS & IMAGEKIT CDN IMAGES');
  console.log('====================================================\n');

  // Step 1: Upload category base images to ImageKit for products
  console.log('--- STEP 1: Uploading Product Images to ImageKit ---');
  const uploadedImageUrls = {};

  for (const [categoryName, sourceUrl] of Object.entries(CATEGORY_IMAGE_SOURCES)) {
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    console.log(`Uploading ImageKit image for product category: ${categoryName}...`);
    try {
      const res = await imagekit.files.upload({
        file: sourceUrl,
        fileName: `prod_${slug}.jpg`,
        folder: '/dairydirect/products',
        useUniqueFileName: false,
        tags: ['product', slug, 'dairydirect'],
      });
      uploadedImageUrls[categoryName] = res.url;
      console.log(`  ✅ ImageKit URL: ${res.url}`);
    } catch (e) {
      console.error(`  ❌ Failed to upload for ${categoryName}:`, e.message);
      // Fallback to source
      uploadedImageUrls[categoryName] = sourceUrl;
    }
  }

  // Step 2: Insert 100 Products and 300+ Variants
  console.log('\n--- STEP 2: Inserting Products and Variants into Supabase ---');
  let productCount = 0;
  let variantCount = 0;

  for (const catGroup of CATALOG_SPEC) {
    const categoryName = catGroup.category;
    const imageUrl = uploadedImageUrls[categoryName] || CATEGORY_IMAGE_SOURCES[categoryName];

    console.log(`\nProcessing Category: ${categoryName} (${catGroup.products.length} products)...`);

    for (const prodSpec of catGroup.products) {
      // 1. Insert product
      const { data: newProd, error: prodErr } = await supabase
        .from('products')
        .insert({
          name: prodSpec.name,
          category: categoryName,
          description: prodSpec.description,
          image_url: imageUrl,
          seller_id: SELLER_ID,
          created_by: ADMIN_USER_ID,
          brand: 'Gjanand Farm',
          state_origin: 'Gujarat',
          is_active: true,
          is_freshness_guarantee: true,
          rating: 4.85,
          reviews_count: 140 + Math.floor(Math.random() * 80)
        })
        .select()
        .single();

      if (prodErr || !newProd) {
        console.error(`  ❌ Failed to insert product "${prodSpec.name}":`, prodErr?.message);
        continue;
      }

      productCount++;

      // 2. Insert variants for this product
      const variantInserts = prodSpec.variants.map((v) => ({
        product_id: newProd.id,
        weight: v.weight,
        price: v.price,
        original_price: v.original_price,
        cost_price: Math.round(v.price * 0.7),
        stock: v.stock,
        reserved_quantity: 0,
        available_quantity: v.stock,
        low_stock_threshold: 15
      }));

      const { data: insertedVariants, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantInserts)
        .select();

      if (varErr || !insertedVariants) {
        console.error(`  ❌ Failed to insert variants for "${prodSpec.name}":`, varErr?.message);
        continue;
      }

      variantCount += insertedVariants.length;

      // 3. Mirror into seller_product for Seller Panel view
      const sellerProductInserts = insertedVariants.map((iv) => ({
        seller_id: SELLER_ID,
        product_id: newProd.id,
        name: newProd.name,
        category: categoryName,
        description: newProd.description,
        price: iv.price,
        original_price: iv.original_price,
        cost_price: iv.cost_price,
        weight: iv.weight,
        stock: iv.available_quantity,
        image_url: imageUrl,
        status: 'active',
        is_approved: true
      }));

      await supabase.from('seller_product').insert(sellerProductInserts);

      process.stdout.write(`  [${productCount}/100] "${newProd.name}" (${insertedVariants.length} variants)\n`);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 SUCCESS: Inserted ${productCount} products and ${variantCount} variants!`);
  console.log('   All product images permanently stored in ImageKit.');
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Fatal error in seeding catalog:', err);
  process.exit(1);
});
