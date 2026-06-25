/**
 * Gjanand Sarkar i18n — DB-backed with static fallback
 *
 * Translations are loaded from Supabase `translations` table on app init
 * and cached in Zustand. Falls back to the bundled static strings if
 * DB is unavailable (e.g. no env vars in development).
 */
import { useStore } from '@/store/useStore';

export type Language = 'en' | 'hi' | 'gu';

// ─── STATIC FALLBACKS ─────────────────────────────────────────────────────
const EN_STATIC: Record<string, string> = {
  tagline: 'Fresh from our farm to your door',
  dailyFresh: 'Daily Fresh Milk at Your Door',
  dailyFreshSub: 'Subscribe once. We deliver every morning.',
  ourProducts: 'Our Products, Our Quality',
  ourProductsSub: 'Every item made by us. No middlemen. Pure taste.',
  skip: 'Skip',
  getStarted: 'Get Started',
  welcomeBack: 'Welcome back👋',
  enterMobileOtp: 'Enter your mobile number to receive a one-time password.',
  termsAndPrivacy: 'By continuing you agree to our Terms & Privacy Policy',
  sendOtp: 'Send OTP',
  enterOtp: 'Enter OTP',
  sentCodeTo: 'Sent to',
  didntReceive: "Didn't receive it? ",
  resend: 'Resend',
  resendIn: 'Resend in',
  verifyAndContinue: 'Verify & Continue',
  incorrectOtp: 'Incorrect OTP. Please try again.',
  adminAccess: 'Admin Access — Enter OTP to continue',
  anyCodeHint: 'Use any 6-digit code (except 000000)',
  loginHint: 'Login as Admin (9999999999) or User to proceed.',
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  greetingName: '{greeting}, {name}',
  favoriteDairy: 'Your favorite dairy is waiting.',
  freshHarvest: 'Fresh harvest waiting for you.',
  deliveringTo: 'Delivering to',
  nextDelivery: 'Next Delivery',
  tomorrowMorning: 'Tomorrow Morning',
  activePlan: 'Active Plan',
  daily: 'Daily',
  status: 'Status',
  outForDelivery: 'Out for delivery',
  subscribeSave: 'Subscribe & Save More On Daily Essentials',
  subscribeSaveSub: 'Daily morning delivery of pure A2 milk & fresh farm products directly to your doorstep.',
  staffPicks: 'Staff Picks',
  viewAll: 'View All',
  buyAgain: 'Buy it Again',
  browseCategories: 'Browse Categories',
  all: 'All',
  milk: 'Milk',
  paneer: 'Paneer',
  ghee: 'Ghee',
  buttermilk: 'Buttermilk',
  curd: 'Curd',
  lassi: 'Lassi',
  addToCart: 'Add to Cart',
  navHome: 'Home',
  navProducts: 'Products',
  navOrders: 'Orders',
  navSubscribe: 'Subscribe',
  navProfile: 'Profile',
  account: 'Account',
  languageSettings: 'Language Settings',
  savedAddresses: 'Saved Addresses',
  notificationPrefs: 'Notification Preferences',
  ordersSubs: 'Orders & Subscriptions',
  myOrders: 'My Orders',
  mySubscriptions: 'My Subscriptions',
  qualityReports: 'Quality Reports',
  supportLegal: 'Support & Legal',
  helpCentre: 'Help Centre',
  termsPolicy: 'Terms & Privacy Policy',
  logoutAccount: 'Logout Account',
  logoutConfirm: 'Logout?',
  logoutConfirmSub: 'Are you sure you want to logout? You will need to verify your phone number to login again.',
  yesLogout: 'Yes, Logout',
  cancel: 'Cancel',
  editProfile: 'Edit Profile',
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  verified: 'Verified',
  saveDetails: 'Save Profile Details',
  soon: 'Soon',
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  currency: '₹',
  items: 'Items',
  search: 'Search',
  searchPlaceholder: 'Search dairy products...',
  nothingFound: 'Nothing found',
  tryDifferent: 'Try a different search term or browse all categories.',
  showAll: 'Show All Products',
  viewCart: 'View Cart',
  myAccount: 'My Account',
  trackLive: 'Track Live Status',
  activeDelivery: 'Active Delivery',
  viewDetails: 'View Details',
  noOrders: 'No orders yet',
  noOrdersSub: 'Your farm-fresh orders will appear here.',
  browseProducts: 'Browse Products',
  myCart: 'My Cart',
  clearAll: 'Clear All',
  emptyCart: 'Your cart is empty',
  emptyCartSub: 'Fresh farm products are just a tap away.',
  reviewOrder: 'Review Order',
  promoCode: 'Enter promo code...',
  apply: 'Apply',
  paymentSummary: 'Payment Summary',
  subtotal: 'Subtotal',
  deliveryFee: 'Delivery Fee',
  total: 'Total',
  estimatedDelivery: 'Estimated Delivery',
  tomorrow: 'Tomorrow',
  proceedToCheckout: 'Proceed to Checkout',
  checkout: 'Checkout',
  free: 'FREE',
  addMoreForFree: 'Add {amount} more for free delivery',
  tomorrowDelivery: 'Tomorrow, 7:00 – 9:00 AM',
  deliveryAddressTitle: 'Delivery Address',
  whereDeliver: 'Where should we deliver your farm-fresh milk? You can change this anytime.',
  addressLabel: 'Address Label (e.g. My Home)',
  addressNamePlaceholder: 'Name for this address',
  searchAddressPlaceholder: 'Search area or house number...',
  useLocation: 'Use current location',
  locating: 'Locating...',
  saveAs: 'Save As',
  homeType: 'Home',
  officeType: 'Office',
  otherType: 'Other',
  confirmSaveAddress: 'Confirm & Save Address',
  savedSuccessfully: 'Saved Successfully',
  fresh: 'Fresh',
  more: 'more',
  selectSizeToAddToCart: 'Select a size to add to cart',
  addShortcut: 'Add',
  done: 'Done',
  freshPasture: 'From the Pasture',
  notifications: 'Notifications',
  noNotifications: 'No notifications yet',
  markAllRead: 'Mark all read',
};

const HI_STATIC: Record<string, string> = {
  tagline: 'हमारे फार्म से आपके दरवाज़े तक ताज़ा',
  dailyFresh: 'दैनिक ताज़ा दूध आपके द्वार',
  dailyFreshSub: 'एक बार सब्सक्राइब करें। हम हर सुबह डिलीवर करते हैं।',
  ourProducts: 'हमारे उत्पाद, हमारी गुणवत्ता',
  ourProductsSub: 'हर वस्तु हमने ही बनाई है। बीच में दलाल नहीं। शुद्ध स्वाद।',
  skip: 'छोड़ें',
  getStarted: 'शुरू करें',
  welcomeBack: 'वापस स्वागत है👋',
  goodMorning: 'सुबह का नमस्ते',
  goodAfternoon: 'दोपहर का नमस्ते',
  goodEvening: 'शाम का नमस्ते',
  deliveringTo: 'डिलीवर कर रहे हैं',
};

const GU_STATIC: Record<string, string> = {
  tagline: 'અમારા ખેતૃક પાસેથી તમારા દરવાજા સુધી તાજા',
  dailyFresh: 'દૈનિક તાજા દૂધ તમારા દરવાજા પર',
  dailyFreshSub: 'એક વાર સબ્સક્રાઇબ કરો. અમે દરરોજ સવારે વહેંચવામાં આવે છે.',
  ourProducts: 'અમારા ઉત્પાદનો, અમારી ગુણવત્તા',
  ourProductsSub: 'દરેક વસ્તુ અમે જ બનાવ્યું છે। વચ્ચે કોઈ વચી નથી. શુદ્ધ સ્વાદ.',
  skip: 'દૂર કરો',
  getStarted: 'શરૂઆત કરો',
  welcomeBack: 'પાછા સ્વાગત છે👋',
  goodMorning: 'સુવર્ણ સુવર્ણ',
  goodAfternoon: 'બપોરનું નમસ્તે',
  goodEvening: 'સાંજનું નમસ્તે',
  deliveringTo: 'વિતરણ કરી રહ્યા છીએ',
};

// ─── Translation hook ─────────────────────────────────────────
export function useTranslation() {
  const language = useStore((state) => state.language);
  const translationsCache = useStore((state) => state.translationsCache);

  // Get cached translations for current language, fall back to English cache, then static
  const currentLangMap: Record<string, string> = translationsCache[language] ?? {};
  const englishMap: Record<string, string> = translationsCache['en'] ?? {};
  
  // Get static fallback based on language
  const staticFallback = language === 'hi' ? HI_STATIC : language === 'gu' ? GU_STATIC : EN_STATIC;

  const t = (key: string, params?: Record<string, string>): string => {
    let str =
      currentLangMap[key] ??
      englishMap[key] ??
      staticFallback[key] ??
      key; // worst case: return the key itself

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        str = str.replace(`{${paramKey}}`, value);
      });
    }

    return str;
  };

  return { t, language };
}
