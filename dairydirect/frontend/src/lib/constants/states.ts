/**
 * Comprehensive list of 28 Indian States and 8 Union Territories
 * for delivery address selection.
 */

export interface IndianState {
  name: string;
  code: string;
  type: 'state' | 'ut';
}

export const INDIAN_STATES_AND_UTS: IndianState[] = [
  // 28 States
  { name: 'Andhra Pradesh', code: 'AP', type: 'state' },
  { name: 'Arunachal Pradesh', code: 'AR', type: 'state' },
  { name: 'Assam', code: 'AS', type: 'state' },
  { name: 'Bihar', code: 'BR', type: 'state' },
  { name: 'Chhattisgarh', code: 'CG', type: 'state' },
  { name: 'Goa', code: 'GA', type: 'state' },
  { name: 'Gujarat', code: 'GJ', type: 'state' },
  { name: 'Haryana', code: 'HR', type: 'state' },
  { name: 'Himachal Pradesh', code: 'HP', type: 'state' },
  { name: 'Jharkhand', code: 'JH', type: 'state' },
  { name: 'Karnataka', code: 'KA', type: 'state' },
  { name: 'Kerala', code: 'KL', type: 'state' },
  { name: 'Madhya Pradesh', code: 'MP', type: 'state' },
  { name: 'Maharashtra', code: 'MH', type: 'state' },
  { name: 'Manipur', code: 'MN', type: 'state' },
  { name: 'Meghalaya', code: 'ML', type: 'state' },
  { name: 'Mizoram', code: 'MZ', type: 'state' },
  { name: 'Nagaland', code: 'NL', type: 'state' },
  { name: 'Odisha', code: 'OR', type: 'state' },
  { name: 'Punjab', code: 'PB', type: 'state' },
  { name: 'Rajasthan', code: 'RJ', type: 'state' },
  { name: 'Sikkim', code: 'SK', type: 'state' },
  { name: 'Tamil Nadu', code: 'TN', type: 'state' },
  { name: 'Telangana', code: 'TS', type: 'state' },
  { name: 'Tripura', code: 'TR', type: 'state' },
  { name: 'Uttar Pradesh', code: 'UP', type: 'state' },
  { name: 'Uttarakhand', code: 'UK', type: 'state' },
  { name: 'West Bengal', code: 'WB', type: 'state' },

  // 8 Union Territories
  { name: 'Andaman and Nicobar Islands', code: 'AN', type: 'ut' },
  { name: 'Chandigarh', code: 'CH', type: 'ut' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH', type: 'ut' },
  { name: 'Delhi', code: 'DL', type: 'ut' },
  { name: 'Jammu and Kashmir', code: 'JK', type: 'ut' },
  { name: 'Ladakh', code: 'LA', type: 'ut' },
  { name: 'Lakshadweep', code: 'LD', type: 'ut' },
  { name: 'Puducherry', code: 'PY', type: 'ut' },
];

export const INDIAN_STATE_NAMES = INDIAN_STATES_AND_UTS.map((s) => s.name);
