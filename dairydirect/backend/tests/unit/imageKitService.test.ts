import { imageKitService } from '../../src/services/imageKitService';

export async function runImageKitTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Upload Buffer image fallback / mock behavior
  try {
    const dummyBuffer = Buffer.from('fake-image-bytes-dairydirect');
    const uploadRes = await imageKitService.uploadFile({
      file: dummyBuffer,
      fileName: 'test_product.jpg',
      folder: '/products',
    });

    if (!uploadRes || !uploadRes.url) {
      throw new Error('Expected upload result with a valid URL');
    }
    if (!uploadRes.name.includes('test_product')) {
      throw new Error(`Expected filename in name, got ${uploadRes.name}`);
    }
    results.push({ name: 'ImageKit Service: Buffer file upload', passed: true });
  } catch (err: any) {
    results.push({ name: 'ImageKit Service: Buffer file upload', passed: false, error: err.message });
  }

  // Test 2: Upload Base64 Data URI
  try {
    const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await imageKitService.uploadFile({
      file: dummyBase64,
      fileName: 'avatar_test.png',
      folder: '/avatars',
    });

    if (!uploadRes || !uploadRes.url) {
      throw new Error('Expected upload result with a valid URL');
    }
    results.push({ name: 'ImageKit Service: Base64 data URI upload', passed: true });
  } catch (err: any) {
    results.push({ name: 'ImageKit Service: Base64 data URI upload', passed: false, error: err.message });
  }

  // Test 3: Auth parameters generation
  try {
    const authParams = imageKitService.getAuthenticationParameters();
    if (!authParams.token || !authParams.signature || !authParams.expire) {
      throw new Error('Expected complete authentication parameters (token, expire, signature)');
    }
    results.push({ name: 'ImageKit Service: Client auth params generation', passed: true });
  } catch (err: any) {
    results.push({ name: 'ImageKit Service: Client auth params generation', passed: false, error: err.message });
  }

  // Test 4: Category-wise uploads for Customer (avatars, returns)
  try {
    const res = await imageKitService.uploadFile({
      file: Buffer.from('test-customer-avatar'),
      fileName: 'cust_avatar.jpg',
      role: 'customer',
      entityType: 'avatar',
    });
    if (res.folder !== '/gjanandSarkar/customers/avatars') {
      throw new Error(`Expected /gjanandSarkar/customers/avatars, got ${res.folder}`);
    }
    results.push({ name: 'ImageKit Service: Customer avatar category folder (/gjanandSarkar/customers/avatars)', passed: true });
  } catch (err: any) {
    results.push({ name: 'ImageKit Service: Customer avatar category folder (/gjanandSarkar/customers/avatars)', passed: false, error: err.message });
  }

  // Test 5: Category-wise uploads for Seller (logos, banners, products)
  try {
    const res = await imageKitService.uploadFile({
      file: Buffer.from('test-seller-logo'),
      fileName: 'seller_logo.png',
      role: 'seller',
      entityType: 'seller_logo',
      entityId: 'seller-123',
    });
    if (res.folder !== '/gjanandSarkar/sellers/seller-123/logos') {
      throw new Error(`Expected /gjanandSarkar/sellers/seller-123/logos, got ${res.folder}`);
    }
    results.push({ name: 'ImageKit Service: Seller logo category folder (/gjanandSarkar/sellers/:id/logos)', passed: true });
  } catch (err: any) {
    results.push({ name: 'ImageKit Service: Seller logo category folder (/gjanandSarkar/sellers/:id/logos)', passed: false, error: err.message });
  }

  // Test 6: Category-wise uploads for Admin products (e.g. Milk, Ghee, Paneer)
  try {
    const resMilk = await imageKitService.uploadFile({
      file: Buffer.from('test-milk-photo'),
      fileName: 'gir_cow_milk.jpg',
      role: 'admin',
      category: 'Milk',
    });
    if (resMilk.folder !== '/gjanandSarkar/admin/products/milk') {
      throw new Error(`Expected /gjanandSarkar/admin/products/milk, got ${resMilk.folder}`);
    }

    const resGhee = await imageKitService.uploadFile({
      file: Buffer.from('test-ghee-photo'),
      fileName: 'a2_desi_ghee.jpg',
      category: 'Ghee',
      entityType: 'product',
    });
    if (resGhee.folder !== '/gjanandSarkar/products/ghee') {
      throw new Error(`Expected /gjanandSarkar/products/ghee, got ${resGhee.folder}`);
    }

    results.push({ name: 'ImageKit Service: Category-wise product organization (/gjanandSarkar/products/ghee, /gjanandSarkar/admin/products/milk)', passed: true });
  } catch (err: any) {
    results.push({ name: 'ImageKit Service: Category-wise product organization (/gjanandSarkar/products/ghee, /gjanandSarkar/admin/products/milk)', passed: false, error: err.message });
  }

  // Test 7: Category image upload to admin category folder (/gjanandSarkar/admin/categories)
  try {
    const resCat = await imageKitService.uploadFile({
      file: Buffer.from('test-category-image'),
      fileName: 'organic_milk_category.jpg',
      role: 'admin',
      entityType: 'category',
    });
    if (resCat.folder !== '/gjanandSarkar/admin/categories') {
      throw new Error(`Expected /gjanandSarkar/admin/categories, got ${resCat.folder}`);
    }

    const resFolderCat = await imageKitService.uploadFile({
      file: Buffer.from('test-category-image-2'),
      fileName: 'paneer_category.jpg',
      folder: '/admin/categories',
    });
    if (resFolderCat.folder !== '/gjanandSarkar/admin/categories') {
      throw new Error(`Expected /gjanandSarkar/admin/categories, got ${resFolderCat.folder}`);
    }

    results.push({ name: 'ImageKit Service: Admin category folder organization (/gjanandSarkar/admin/categories)', passed: true });
  } catch (err: any) {
    results.push({ name: 'ImageKit Service: Admin category folder organization (/gjanandSarkar/admin/categories)', passed: false, error: err.message });
  }

  return results;
}


