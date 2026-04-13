-- ══════════════════════════════════════════════════════════════
-- DairyDirect — Seed Data
-- Run AFTER applying 001_schema.sql migration
-- ══════════════════════════════════════════════════════════════

-- NOTE: Images referenced here assume you've uploaded the /public/*.png files
--       to Supabase Storage bucket 'product-images' and obtained public URLs.
--       Replace the placeholder URLs below with real URLs after upload.
--       During development you can point to /milk.png etc. (Next.js public dir).

-- ─────────────────────────────────────────────────
-- PRODUCTS + VARIANTS
-- ─────────────────────────────────────────────────

DO $$
DECLARE
  p_milk1   uuid;
  p_milk2   uuid;
  p_paneer1 uuid;
  p_ghee1   uuid;
  p_butter1 uuid;
  p_curd1   uuid;
  p_lassi1  uuid;
BEGIN

-- Farm Fresh Cow Milk
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Farm Fresh Cow Milk', 'Milk',
  '100% pure, unadulterated cow milk delivered fresh from our farm within hours of milking.',
  '/milk.png', true, true
) RETURNING id INTO p_milk1;

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
VALUES
  (p_milk1, '500ml', 34,   NULL, 150),
  (p_milk1, '1L',    68,   NULL, 200),
  (p_milk1, '2L',    134,  136,  50);

-- A2 Gir Cow Milk
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'A2 Gir Cow Milk', 'Milk',
  'Premium A2 milk from traditional Gir cows. Naturally rich in proteins and easy to digest.',
  '/milk2.png', true, true
) RETURNING id INTO p_milk2;

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
VALUES
  (p_milk2, '500ml', 45, NULL, 50),
  (p_milk2, '1L',    90, NULL, 80);

-- Malai Paneer
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Malai Paneer', 'Paneer',
  'Soft, rich, and creamy paneer made daily from full-fat farm milk. Perfect texture.',
  '/paneer.png', true, true
) RETURNING id INTO p_paneer1;

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
VALUES
  (p_paneer1, '200g', 85,  NULL, 30),
  (p_paneer1, '500g', 200, 210,  20);

-- Pure Bilona Ghee
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Pure Bilona Ghee', 'Ghee',
  'Traditional hand-churned Bilona method ghee from curd. Rich aroma and authentic taste.',
  '/ghee.png', false, true
) RETURNING id INTO p_ghee1;

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
VALUES
  (p_ghee1, '500ml', 550,  NULL, 15),
  (p_ghee1, '1L',    1050, 1100, 10);

-- Masala Buttermilk
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Masala Buttermilk', 'Buttermilk',
  'Refreshing buttermilk spiced with cumin, mint, and black salt. Best served chilled.',
  '/buttermilk.png', true, true
) RETURNING id INTO p_butter1;

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
VALUES
  (p_butter1, '500ml', 25, NULL, 40),
  (p_butter1, '1L',    45, 50,   25);

-- Farm Fresh Curd
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Farm Fresh Curd', 'Curd',
  'Thick, creamy, and probiotic-rich curd made from pure cow milk. No thickeners added.',
  '/curd.png', true, true
) RETURNING id INTO p_curd1;

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
VALUES
  (p_curd1, '200g', 30, NULL, 60),
  (p_curd1, '500g', 65, NULL, 45);

-- Sweet Punjabi Lassi
INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
VALUES (
  'Sweet Punjabi Lassi', 'Lassi',
  'Traditional sweet lassi churned with cardamon and rose water. A perfect summer cooler.',
  '/lassi.png', true, true
) RETURNING id INTO p_lassi1;

INSERT INTO product_variants (product_id, weight, price, original_price, stock)
VALUES
  (p_lassi1, '300ml', 40, NULL, 50);

END $$;


-- ─────────────────────────────────────────────────
-- TRANSLATIONS — English
-- ─────────────────────────────────────────────────
INSERT INTO translations (language, key, value) VALUES
('en', 'tagline', 'Fresh from our farm to your door'),
('en', 'dailyFresh', 'Daily Fresh Milk at Your Door'),
('en', 'dailyFreshSub', 'Subscribe once. We deliver every morning.'),
('en', 'ourProducts', 'Our Products, Our Quality'),
('en', 'ourProductsSub', 'Every item made by us. No middlemen. Pure taste.'),
('en', 'skip', 'Skip'),
('en', 'getStarted', 'Get Started'),
('en', 'welcomeBack', 'Welcome back👋'),
('en', 'enterMobileOtp', 'Enter your mobile number to receive a one-time password.'),
('en', 'termsAndPrivacy', 'By continuing you agree to our Terms & Privacy Policy'),
('en', 'sendOtp', 'Send OTP'),
('en', 'enterOtp', 'Enter OTP'),
('en', 'sentCodeTo', 'Sent to'),
('en', 'didntReceive', 'Didn''t receive it? '),
('en', 'resend', 'Resend'),
('en', 'resendIn', 'Resend in'),
('en', 'verifyAndContinue', 'Verify & Continue'),
('en', 'incorrectOtp', 'Incorrect OTP. Please try again.'),
('en', 'adminAccess', 'Admin Access — Enter OTP to continue'),
('en', 'anyCodeHint', 'Use any 6-digit code (except 000000)'),
('en', 'loginHint', 'Login as Admin (9999999999) or User to proceed.'),
('en', 'goodMorning', 'Good morning'),
('en', 'goodAfternoon', 'Good afternoon'),
('en', 'goodEvening', 'Good evening'),
('en', 'greetingName', '{greeting}, {name}'),
('en', 'favoriteDairy', 'Your favorite dairy is waiting.'),
('en', 'freshHarvest', 'Fresh harvest waiting for you.'),
('en', 'deliveringTo', 'Delivering to'),
('en', 'nextDelivery', 'Next Delivery'),
('en', 'tomorrowMorning', 'Tomorrow Morning'),
('en', 'activePlan', 'Active Plan'),
('en', 'daily', 'Daily'),
('en', 'status', 'Status'),
('en', 'outForDelivery', 'Out for delivery'),
('en', 'subscribeSave', 'Subscribe & Save More On Daily Essentials'),
('en', 'subscribeSaveSub', 'Daily morning delivery of pure A2 milk & fresh farm products directly to your doorstep.'),
('en', 'staffPicks', 'Staff Picks'),
('en', 'viewAll', 'View All'),
('en', 'buyAgain', 'Buy it Again'),
('en', 'browseCategories', 'Browse Categories'),
('en', 'all', 'All'),
('en', 'milk', 'Milk'),
('en', 'paneer', 'Paneer'),
('en', 'ghee', 'Ghee'),
('en', 'buttermilk', 'Buttermilk'),
('en', 'curd', 'Curd'),
('en', 'lassi', 'Lassi'),
('en', 'addToCart', 'Add to Cart'),
('en', 'navHome', 'Home'),
('en', 'navProducts', 'Products'),
('en', 'navOrders', 'Orders'),
('en', 'navSubscribe', 'Subscribe'),
('en', 'navProfile', 'Profile'),
('en', 'account', 'Account'),
('en', 'languageSettings', 'Language Settings'),
('en', 'savedAddresses', 'Saved Addresses'),
('en', 'notificationPrefs', 'Notification Preferences'),
('en', 'ordersSubs', 'Orders & Subscriptions'),
('en', 'myOrders', 'My Orders'),
('en', 'mySubscriptions', 'My Subscriptions'),
('en', 'qualityReports', 'Quality Reports'),
('en', 'supportLegal', 'Support & Legal'),
('en', 'helpCentre', 'Help Centre'),
('en', 'termsPolicy', 'Terms & Privacy Policy'),
('en', 'logoutAccount', 'Logout Account'),
('en', 'logoutConfirm', 'Logout?'),
('en', 'logoutConfirmSub', 'Are you sure you want to logout? You will need to verify your phone number to login again.'),
('en', 'yesLogout', 'Yes, Logout'),
('en', 'cancel', 'Cancel'),
('en', 'editProfile', 'Edit Profile'),
('en', 'fullName', 'Full Name'),
('en', 'phoneNumber', 'Phone Number'),
('en', 'verified', 'Verified'),
('en', 'saveDetails', 'Save Profile Details'),
('en', 'soon', 'Soon'),
('en', 'pending', 'Pending'),
('en', 'confirmed', 'Confirmed'),
('en', 'preparing', 'Preparing'),
('en', 'delivered', 'Delivered'),
('en', 'cancelled', 'Cancelled'),
('en', 'currency', '₹'),
('en', 'items', 'Items'),
('en', 'search', 'Search'),
('en', 'searchPlaceholder', 'Search dairy products...'),
('en', 'nothingFound', 'Nothing found'),
('en', 'tryDifferent', 'Try a different search term or browse all categories.'),
('en', 'showAll', 'Show All Products'),
('en', 'viewCart', 'View Cart'),
('en', 'myAccount', 'My Account'),
('en', 'trackLive', 'Track Live Status'),
('en', 'activeDelivery', 'Active Delivery'),
('en', 'viewDetails', 'View Details'),
('en', 'noOrders', 'No orders yet'),
('en', 'noOrdersSub', 'Your farm-fresh orders will appear here.'),
('en', 'browseProducts', 'Browse Products'),
('en', 'myCart', 'My Cart'),
('en', 'clearAll', 'Clear All'),
('en', 'emptyCart', 'Your cart is empty'),
('en', 'emptyCartSub', 'Fresh farm products are just a tap away.'),
('en', 'reviewOrder', 'Review Order'),
('en', 'promoCode', 'Enter promo code...'),
('en', 'apply', 'Apply'),
('en', 'paymentSummary', 'Payment Summary'),
('en', 'subtotal', 'Subtotal'),
('en', 'deliveryFee', 'Delivery Fee'),
('en', 'total', 'Total'),
('en', 'estimatedDelivery', 'Estimated Delivery'),
('en', 'tomorrow', 'Tomorrow'),
('en', 'proceedToCheckout', 'Proceed to Checkout'),
('en', 'checkout', 'Checkout'),
('en', 'free', 'FREE'),
('en', 'addMoreForFree', 'Add {amount} more for free delivery'),
('en', 'tomorrowDelivery', 'Tomorrow, 7:00 – 9:00 AM'),
('en', 'deliveryAddressTitle', 'Delivery Address'),
('en', 'whereDeliver', 'Where should we deliver your farm-fresh milk? You can change this anytime.'),
('en', 'addressLabel', 'Address Label (e.g. My Home)'),
('en', 'addressNamePlaceholder', 'Name for this address'),
('en', 'searchAddressPlaceholder', 'Search area or house number...'),
('en', 'useLocation', 'Use current location'),
('en', 'locating', 'Locating...'),
('en', 'saveAs', 'Save As'),
('en', 'homeType', 'Home'),
('en', 'officeType', 'Office'),
('en', 'otherType', 'Other'),
('en', 'confirmSaveAddress', 'Confirm & Save Address'),
('en', 'savedSuccessfully', 'Saved Successfully'),
('en', 'fresh', 'Fresh'),
('en', 'more', 'more'),
('en', 'selectSizeToAddToCart', 'Select a size to add to cart'),
('en', 'addShortcut', 'Add'),
('en', 'done', 'Done'),
('en', 'freshPasture', 'From the Pasture'),
('en', 'notifications', 'Notifications'),
('en', 'noNotifications', 'No notifications yet'),
('en', 'markAllRead', 'Mark all read')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;


-- ─────────────────────────────────────────────────
-- TRANSLATIONS — Hindi
-- ─────────────────────────────────────────────────
INSERT INTO translations (language, key, value) VALUES
('hi', 'tagline', 'हमारे खेत से सीधे आपके घर तक'),
('hi', 'dailyFresh', 'रोज ताजा दूध आपके द्वार'),
('hi', 'dailyFreshSub', 'एक बार सब्सक्राइब करें। हम हर सुबह डिलीवरी करेंगे।'),
('hi', 'ourProducts', 'हमारे उत्पाद, हमारी गुणवत्ता'),
('hi', 'ourProductsSub', 'हर चीज हम बनाते हैं। कोई बिचौलिया नहीं। शुद्ध स्वाद।'),
('hi', 'skip', 'छोड़ें'),
('hi', 'getStarted', 'शुरू करें'),
('hi', 'welcomeBack', 'वापसी पर स्वागत है👋'),
('hi', 'enterMobileOtp', 'पासवर्ड प्राप्त करने के लिए अपना मोबाइल नंबर दर्ज करें।'),
('hi', 'termsAndPrivacy', 'जारी रखकर आप हमारे नियमों और गोपनीयता नीति से सहमत हैं'),
('hi', 'sendOtp', 'OTP भेजें'),
('hi', 'enterOtp', 'OTP दर्ज करें'),
('hi', 'sentCodeTo', 'भेजा गया'),
('hi', 'didntReceive', 'नहीं मिला? '),
('hi', 'resend', 'पुनः भेजें'),
('hi', 'resendIn', 'पुनः भेजें'),
('hi', 'verifyAndContinue', 'सत्यापित करें और आगे बढ़ें'),
('hi', 'incorrectOtp', 'गलत OTP. कृपया पुनः प्रयास करें।'),
('hi', 'adminAccess', 'एडमिन एक्सेस — OTP दर्ज करें'),
('hi', 'anyCodeHint', 'किसी भी 6-अंकों के कोड का उपयोग करें (000000 को छोड़कर)'),
('hi', 'loginHint', 'व्यवस्थापक (9999999999) या उपयोगकर्ता के रूप में लॉगिन करें।'),
('hi', 'goodMorning', 'सुप्रभात'),
('hi', 'goodAfternoon', 'शुभ दोपहर'),
('hi', 'goodEvening', 'शुभ संध्या'),
('hi', 'greetingName', '{greeting}, {name}'),
('hi', 'favoriteDairy', 'पसंदीदा डेयरी उत्पाद इंतजार कर रहा है।'),
('hi', 'freshHarvest', 'ताजी फसल आपका इंतजार कर रही है।'),
('hi', 'deliveringTo', 'डिलीवरी यहाँ'),
('hi', 'nextDelivery', 'अगली डिलीवरी'),
('hi', 'tomorrowMorning', 'कल सुबह'),
('hi', 'activePlan', 'सक्रिय योजना'),
('hi', 'daily', 'दैनिक'),
('hi', 'status', 'स्थिति'),
('hi', 'outForDelivery', 'डिलीवरी के लिए निकला है'),
('hi', 'subscribeSave', 'सब्सक्राइब करें और बचत करें'),
('hi', 'subscribeSaveSub', 'शुद्ध A2 दूध और ताजे कृषि उत्पादों की दैनिक सुबह की डिलीवरी सीधे आपके दरवाजे पर।'),
('hi', 'staffPicks', 'स्टाफ की पसंद'),
('hi', 'viewAll', 'सभी देखें'),
('hi', 'buyAgain', 'फिर से खरीदें'),
('hi', 'browseCategories', 'श्रेणियां देखें'),
('hi', 'all', 'सभी'),
('hi', 'milk', 'दूध'),
('hi', 'paneer', 'पनीर'),
('hi', 'ghee', 'घी'),
('hi', 'buttermilk', 'छाछ'),
('hi', 'curd', 'दही'),
('hi', 'lassi', 'लस्सी'),
('hi', 'addToCart', 'कार्ट में डालें'),
('hi', 'navHome', 'होम'),
('hi', 'navProducts', 'उत्पाद'),
('hi', 'navOrders', 'ऑर्डर'),
('hi', 'navSubscribe', 'सदस्यता'),
('hi', 'navProfile', 'प्रोफ़ाइल'),
('hi', 'account', 'खाता'),
('hi', 'languageSettings', 'भाषा सेटिंग्स'),
('hi', 'savedAddresses', 'सहेजे गए पते'),
('hi', 'notificationPrefs', 'अधिसूचना प्राथमिकताएं'),
('hi', 'ordersSubs', 'ऑर्डर और सदस्यता'),
('hi', 'myOrders', 'मेरे ऑर्डर'),
('hi', 'mySubscriptions', 'मेरी सदस्यता'),
('hi', 'qualityReports', 'गुणवत्ता रिपोर्ट'),
('hi', 'supportLegal', 'सहायता और कानूनी'),
('hi', 'helpCentre', 'सहायता केंद्र'),
('hi', 'termsPolicy', 'नियम और गोपनीयता नीति'),
('hi', 'logoutAccount', 'खाता लॉग आउट करें'),
('hi', 'logoutConfirm', 'लॉग आउट करें?'),
('hi', 'logoutConfirmSub', 'क्या आप वाकई लॉग आउट करना चाहते हैं?'),
('hi', 'yesLogout', 'हां, लॉग आउट करें'),
('hi', 'cancel', 'रद्द करें'),
('hi', 'editProfile', 'प्रोफ़ाइल संपादित करें'),
('hi', 'fullName', 'पूरा नाम'),
('hi', 'phoneNumber', 'फ़ोन नंबर'),
('hi', 'verified', 'सत्यापित'),
('hi', 'saveDetails', 'विवरण सहेजें'),
('hi', 'soon', 'जल्द ही'),
('hi', 'pending', 'बाकी'),
('hi', 'confirmed', 'पुष्टि'),
('hi', 'preparing', 'तैयार हो रहा है'),
('hi', 'delivered', 'पहुंचा दिया गया'),
('hi', 'cancelled', 'रद्द कर दिया गया'),
('hi', 'currency', '₹'),
('hi', 'items', 'आइटम'),
('hi', 'search', 'खोजें'),
('hi', 'searchPlaceholder', 'डेयरी उत्पाद खोजें...'),
('hi', 'nothingFound', 'कुछ नहीं मिला'),
('hi', 'tryDifferent', 'एक अलग खोज शब्द आज़माएं।'),
('hi', 'showAll', 'सभी उत्पाद दिखाएं'),
('hi', 'viewCart', 'कार्ट देखें'),
('hi', 'myAccount', 'मेरा खाता'),
('hi', 'trackLive', 'लाइव स्थिति ट्रैक करें'),
('hi', 'activeDelivery', 'सक्रिय डिलीवरी'),
('hi', 'viewDetails', 'विवरण देखें'),
('hi', 'noOrders', 'अभी तक कोई ऑर्डर नहीं'),
('hi', 'noOrdersSub', 'आपके ऑर्डर यहाँ दिखाई देंगे।'),
('hi', 'browseProducts', 'उत्पाद ब्राउज़ करें'),
('hi', 'myCart', 'मेरी टोकरी'),
('hi', 'clearAll', 'सभी साफ करें'),
('hi', 'emptyCart', 'टोकरी खाली है'),
('hi', 'emptyCartSub', 'ताज़ा उत्पाद बस एक टैप दूर हैं।'),
('hi', 'reviewOrder', 'समीक्षा करें'),
('hi', 'promoCode', 'प्रोमो कोड...'),
('hi', 'apply', 'लागू करें'),
('hi', 'paymentSummary', 'भुगतान सारांश'),
('hi', 'subtotal', 'उप-योग'),
('hi', 'deliveryFee', 'वितरण शुल्क'),
('hi', 'total', 'कुल'),
('hi', 'estimatedDelivery', 'अनुमानित डिलीवरी'),
('hi', 'tomorrow', 'कल'),
('hi', 'proceedToCheckout', 'चेकआउट करें'),
('hi', 'checkout', 'चेकआउट'),
('hi', 'free', 'मुफ्त'),
('hi', 'addMoreForFree', 'मुफ्त डिलीवरी के लिए {amount} और जोड़ें'),
('hi', 'tomorrowDelivery', 'कल, सुबह 7:00 – 9:00 बजे'),
('hi', 'fresh', 'ताजा'),
('hi', 'more', 'अधिक'),
('hi', 'selectSizeToAddToCart', 'कार्ट में जोड़ने के लिए आकार चुनें'),
('hi', 'addShortcut', 'जोड़ें'),
('hi', 'done', 'हो गया'),
('hi', 'freshPasture', 'खेत से ताजा'),
('hi', 'notifications', 'सूचनाएं'),
('hi', 'noNotifications', 'कोई सूचना नहीं'),
('hi', 'markAllRead', 'सभी पढ़े हुए चिह्नित करें')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;


-- ─────────────────────────────────────────────────
-- TRANSLATIONS — Gujarati
-- ─────────────────────────────────────────────────
INSERT INTO translations (language, key, value) VALUES
('gu', 'tagline', 'અમારા ખેતરથી સીધા તમારા ઘર સુધી'),
('gu', 'dailyFresh', 'રોજ તાજું દૂધ તમારા દ્વારે'),
('gu', 'dailyFreshSub', 'એકવાર સબસ્ક્રાઇબ કરો. અમે દરરોજ સવારે ડિલિવરી કરીશું.'),
('gu', 'ourProducts', 'અમારા ઉત્પાદનો, અમારી ગુણવત્તા'),
('gu', 'ourProductsSub', 'દરેક વસ્તુ અમે બનાવીએ છીએ. કોઈ વચેટિયા નથી. શુદ્ધ સ્વાદ.'),
('gu', 'skip', 'છોડો'),
('gu', 'getStarted', 'શરૂ કરો'),
('gu', 'welcomeBack', 'પાછા આવવા બદલ સ્વાગત છે👋'),
('gu', 'enterMobileOtp', 'પાસવર્ડ મેળવવા માટે તમારો મોબાઈલ નંબર દાખલ કરો.'),
('gu', 'termsAndPrivacy', 'ચાલુ રાખીને તમે અમારી શરતો અને ગોપનીયતા નીતિ સાથે સંમત થાઓ છો'),
('gu', 'sendOtp', 'OTP મોકલો'),
('gu', 'enterOtp', 'OTP દાખલ કરો'),
('gu', 'sentCodeTo', 'મોકલ્યો'),
('gu', 'didntReceive', 'મળ્યો નથી? '),
('gu', 'resend', 'ફરી મોકલો'),
('gu', 'resendIn', 'ફરી મોકલો'),
('gu', 'verifyAndContinue', 'ચકાસો અને આગળ વધો'),
('gu', 'incorrectOtp', 'ખોટો OTP. મહેરબાની કરીને ફરી પ્રયાસ કરો.'),
('gu', 'adminAccess', 'એડમિન એક્સેસ — OTP દાખલ કરો'),
('gu', 'anyCodeHint', 'કોઈપણ 6-અંકના કોડનો ઉપયોગ કરો (000000 સિવાય)'),
('gu', 'loginHint', 'એડમિન (9999999999) અથવા વપરાશકર્તા તરીકે લોગિન કરો.'),
('gu', 'goodMorning', 'શુભ સવાર'),
('gu', 'goodAfternoon', 'શુભ બપોર'),
('gu', 'goodEvening', 'શુભ સાંજ'),
('gu', 'greetingName', '{greeting}, {name}'),
('gu', 'favoriteDairy', 'તમારી પ્રિય ડેરી પ્રોડક્ટ રાહ જોઈ રહી છે.'),
('gu', 'freshHarvest', 'તાજો પાક તમારી રાહ જોઈ રહ્યો છે.'),
('gu', 'deliveringTo', 'અહીં ડિલિવરી'),
('gu', 'nextDelivery', 'આગલી ડિલિવરી'),
('gu', 'tomorrowMorning', 'કાલે સવારે'),
('gu', 'activePlan', 'સક્રિય પ્લાન'),
('gu', 'daily', 'દૈનિક'),
('gu', 'status', 'સ્થિતિ'),
('gu', 'outForDelivery', 'ડિલિવરી માટે નીકળેલ છે'),
('gu', 'subscribeSave', 'સબસ્ક્રાઇબ કરો અને બચત કરો'),
('gu', 'subscribeSaveSub', 'શુદ્ધ A2 દૂધ અને તાજા ફાર્મ ઉત્પાદનોની સવારે ડિલિવરી.'),
('gu', 'staffPicks', 'સ્ટાફની પસંદગી'),
('gu', 'viewAll', 'બધું જુઓ'),
('gu', 'buyAgain', 'ફરીથી ખરીદો'),
('gu', 'browseCategories', 'શ્રેણીઓ જુઓ'),
('gu', 'all', 'બધું'),
('gu', 'milk', 'દૂધ'),
('gu', 'paneer', 'પનીર'),
('gu', 'ghee', 'ઘી'),
('gu', 'buttermilk', 'છાશ'),
('gu', 'curd', 'દહીં'),
('gu', 'lassi', 'લસ્સી'),
('gu', 'addToCart', 'કાર્ટમાં ઉમેરો'),
('gu', 'navHome', 'હોમ'),
('gu', 'navProducts', 'ઉત્પાદનો'),
('gu', 'navOrders', 'ઓર્ડર'),
('gu', 'navSubscribe', 'સબસ્ક્રિપ્શન'),
('gu', 'navProfile', 'પ્રોફાઇલ'),
('gu', 'account', 'ખાતું'),
('gu', 'languageSettings', 'ભાષા સેટિંગ્સ'),
('gu', 'savedAddresses', 'સાચવેલા સરનામાં'),
('gu', 'notificationPrefs', 'પસંદગીઓ'),
('gu', 'ordersSubs', 'ઓર્ડર અને સબસ્ક્રિપ્શન'),
('gu', 'myOrders', 'મારા ઓર્ડર'),
('gu', 'mySubscriptions', 'મારા સબસ્ક્રિપ્શન'),
('gu', 'qualityReports', 'અહેવાલો'),
('gu', 'supportLegal', 'સપોર્ટ અને કાનૂની'),
('gu', 'helpCentre', 'સહાય કેન્દ્ર'),
('gu', 'termsPolicy', 'શરતો અને નીતિ'),
('gu', 'logoutAccount', 'લોગ આઉટ કરો'),
('gu', 'logoutConfirm', 'લોગ આઉટ કરો?'),
('gu', 'logoutConfirmSub', 'શું તમે ખરેખર લોગ આઉટ કરવા માંગો છો?'),
('gu', 'yesLogout', 'હા, લોગ આઉટ કરો'),
('gu', 'cancel', 'રદ કરો'),
('gu', 'editProfile', 'પ્રોફાઇલ સંપાદિત કરો'),
('gu', 'fullName', 'પૂરું નામ'),
('gu', 'phoneNumber', 'ફોન નંબર'),
('gu', 'verified', 'ચકાસાયેલ'),
('gu', 'saveDetails', 'વિગતો સાચવો'),
('gu', 'soon', 'ટૂંક સમયમાં'),
('gu', 'pending', 'બાકી'),
('gu', 'confirmed', 'પુષ્ટિ'),
('gu', 'preparing', 'તૈયાર થઈ રહ્યું છે'),
('gu', 'delivered', 'પહોંચાડી દીધું'),
('gu', 'cancelled', 'રદ કર્યું'),
('gu', 'currency', '₹'),
('gu', 'items', 'વસ્તુઓ'),
('gu', 'search', 'શોધો'),
('gu', 'searchPlaceholder', 'શોધો...'),
('gu', 'nothingFound', 'કાંઈ મળ્યું નથી'),
('gu', 'tryDifferent', 'અલગ શોધ શબ્દ અજમાવો.'),
('gu', 'showAll', 'બધું બતાવો'),
('gu', 'viewCart', 'કાર્ટ જુઓ'),
('gu', 'myAccount', 'મારું એકાઉન્ટ'),
('gu', 'trackLive', 'લાઇવ ટ્રેક કરો'),
('gu', 'activeDelivery', 'સક્રિય ડિલિવરી'),
('gu', 'viewDetails', 'વિગતો જુઓ'),
('gu', 'noOrders', 'ઓર્ડર નથી'),
('gu', 'noOrdersSub', 'તમારા ઓર્ડર અહીં દેખાશે.'),
('gu', 'browseProducts', 'ઉત્પાદનો જુઓ'),
('gu', 'myCart', 'મારી કાર્ટ'),
('gu', 'clearAll', 'બધું સાફ કરો'),
('gu', 'emptyCart', 'તમારી કાર્ટ ખાલી છે'),
('gu', 'emptyCartSub', 'તાજા ઉત્પાદનો એક ટેપ દૂર છે.'),
('gu', 'reviewOrder', 'ઓર્ડર જુઓ'),
('gu', 'promoCode', 'પ્રોમો કોડ...'),
('gu', 'apply', 'લાગુ કરો'),
('gu', 'paymentSummary', 'ચુકવણી સારાંશ'),
('gu', 'subtotal', 'પેટા સરવાળો'),
('gu', 'deliveryFee', 'ડિલિવરી ફી'),
('gu', 'total', 'કુલ'),
('gu', 'estimatedDelivery', 'અંદાજિત ડિલિવરી'),
('gu', 'tomorrow', 'આવતી કાલે'),
('gu', 'proceedToCheckout', 'ચેકઆઉટ કરો'),
('gu', 'checkout', 'ચેકઆઉટ'),
('gu', 'free', 'મફત'),
('gu', 'addMoreForFree', 'મફત ડિલિવરી માટે {amount} વધુ ઉમેરો'),
('gu', 'tomorrowDelivery', 'આવતીકાલે, સવારે 7:00 – 9:00 વાગ્યે'),
('gu', 'fresh', 'તાજું'),
('gu', 'more', 'વધુ'),
('gu', 'selectSizeToAddToCart', 'કાર્ટમાં ઉમેરવા માટે સાઈઝ પસંદ કરો'),
('gu', 'addShortcut', 'ઉમેરો'),
('gu', 'done', 'થઈ ગયું'),
('gu', 'freshPasture', 'ખેતરમાંથી તાજું'),
('gu', 'notifications', 'સૂચનાઓ'),
('gu', 'noNotifications', 'કોઈ સૂચના નથી'),
('gu', 'markAllRead', 'બધા વાંચ્યા ચિહ્નિત કરો')
ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;
