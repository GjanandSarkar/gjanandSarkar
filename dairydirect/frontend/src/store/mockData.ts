export type ProductVariant = {
  id: string;
  weight: string;
  price: number;
  originalPrice?: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  category: "Milk" | "Paneer" | "Ghee" | "Buttermilk" | "Curd" | "Lassi";
  image: string;
  description: string;
  isFreshnessGuarantee: boolean;
  variants: ProductVariant[];
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p_milk_1",
    name: "Farm Fresh Cow Milk",
    category: "Milk",
    image: "/milk.png",
    description: "100% pure, unadulterated cow milk delivered fresh from our farm within hours of milking.",
    isFreshnessGuarantee: true,
    variants: [
      { id: "v_m_500", weight: "500ml", price: 34, stock: 150 },
      { id: "v_m_1000", weight: "1L", price: 68, stock: 200 },
      { id: "v_m_2000", weight: "2L", price: 134, originalPrice: 136, stock: 50 },
    ],
  },
  {
    id: "p_milk_2",
    name: "A2 Gir Cow Milk",
    category: "Milk",
    image: "/milk2.png",
    description: "Premium A2 milk from traditional Gir cows. Naturally rich in proteins and easy to digest.",
    isFreshnessGuarantee: true,
    variants: [
      { id: "v_ma2_500", weight: "500ml", price: 45, stock: 50 },
      { id: "v_ma2_1000", weight: "1L", price: 90, stock: 80 },
    ],
  },
  {
    id: "p_paneer_1",
    name: "Malai Paneer",
    category: "Paneer",
    image: "/paneer.png",
    description: "Soft, rich, and creamy paneer made daily from full-fat farm milk. Perfect texture.",
    isFreshnessGuarantee: true,
    variants: [
      { id: "v_p_200", weight: "200g", price: 85, stock: 30 },
      { id: "v_p_500", weight: "500g", price: 200, originalPrice: 210, stock: 20 },
    ],
  },
  {
    id: "p_ghee_1",
    name: "Pure Bilona Ghee",
    category: "Ghee",
    image: "/ghee.png",
    description: "Traditional hand-churned Bilona method ghee from curd. Rich aroma and authentic taste.",
    isFreshnessGuarantee: false,
    variants: [
      { id: "v_g_500", weight: "500ml", price: 550, stock: 15 },
      { id: "v_g_1000", weight: "1L", price: 1050, originalPrice: 1100, stock: 10 },
    ],
  },
  {
    id: "p_butter_1",
    name: "Masala Buttermilk",
    category: "Buttermilk",
    image: "/buttermilk.png",
    description: "Refreshing buttermilk spiced with cumin, mint, and black salt. Best served chilled.",
    isFreshnessGuarantee: true,
    variants: [
      { id: "v_b_500", weight: "500ml", price: 25, stock: 40 },
      { id: "v_b_1000", weight: "1L", price: 45, originalPrice: 50, stock: 25 },
    ],
  },
  {
    id: "p_curd_1",
    name: "Farm Fresh Curd",
    category: "Curd",
    image: "/curd.png",
    description: "Thick, creamy, and probiotic-rich curd made from pure cow milk. No thickeners added.",
    isFreshnessGuarantee: true,
    variants: [
      { id: "v_c_200", weight: "200g", price: 30, stock: 60 },
      { id: "v_c_500", weight: "500g", price: 65, stock: 45 },
    ],
  },
  {
    id: "p_lassi_1",
    name: "Sweet Punjabi Lassi",
    category: "Lassi",
    image: "/lassi.png",
    description: "Traditional sweet lassi churned with cardamon and rose water. A perfect summer cooler.",
    isFreshnessGuarantee: true,
    variants: [
      { id: "v_l_300", weight: "300ml", price: 40, stock: 50 },
    ],
  },
];
