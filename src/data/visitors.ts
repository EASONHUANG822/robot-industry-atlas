export interface VisitorSource {
  country: string;
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
  visitors: number;
  category: 'asia' | 'europe' | 'north-america' | 'south-america' | 'africa' | 'oceania';
}

export const SHENZHEN_COORDS = { lat: 22.54, lng: 114.05 };

export const CATEGORY_COLORS: Record<VisitorSource['category'], string> = {
  asia: '#4f8cff',
  europe: '#6f9cff',
  'north-america': '#3759bb',
  'south-america': '#7aa4ff',
  africa: '#8fb4ff',
  oceania: '#a3c4ff',
};

export const visitorSources: VisitorSource[] = [
  // 亚洲
  { country: '日本', city: '东京', countryCode: 'JP', lat: 35.68, lng: 139.69, visitors: 2800, category: 'asia' },
  { country: '韩国', city: '首尔', countryCode: 'KR', lat: 37.57, lng: 126.98, visitors: 2200, category: 'asia' },
  { country: '新加坡', city: '新加坡', countryCode: 'SG', lat: 1.35, lng: 103.82, visitors: 1800, category: 'asia' },
  { country: '印度', city: '孟买', countryCode: 'IN', lat: 19.08, lng: 72.88, visitors: 1500, category: 'asia' },
  { country: '阿联酋', city: '迪拜', countryCode: 'AE', lat: 25.20, lng: 55.27, visitors: 900, category: 'asia' },
  { country: '以色列', city: '特拉维夫', countryCode: 'IL', lat: 32.09, lng: 34.78, visitors: 800, category: 'asia' },
  { country: '中国台湾', city: '台北', countryCode: 'TW', lat: 25.03, lng: 121.57, visitors: 1600, category: 'asia' },
  { country: '泰国', city: '曼谷', countryCode: 'TH', lat: 13.76, lng: 100.50, visitors: 700, category: 'asia' },
  // 欧洲
  { country: '德国', city: '慕尼黑', countryCode: 'DE', lat: 48.14, lng: 11.58, visitors: 1800, category: 'europe' },
  { country: '英国', city: '伦敦', countryCode: 'GB', lat: 51.51, lng: -0.13, visitors: 1500, category: 'europe' },
  { country: '法国', city: '巴黎', countryCode: 'FR', lat: 48.86, lng: 2.35, visitors: 1200, category: 'europe' },
  { country: '瑞士', city: '苏黎世', countryCode: 'CH', lat: 47.38, lng: 8.54, visitors: 900, category: 'europe' },
  { country: '瑞典', city: '斯德哥尔摩', countryCode: 'SE', lat: 59.33, lng: 18.07, visitors: 700, category: 'europe' },
  { country: '荷兰', city: '阿姆斯特丹', countryCode: 'NL', lat: 52.37, lng: 4.90, visitors: 800, category: 'europe' },
  { country: '意大利', city: '米兰', countryCode: 'IT', lat: 45.46, lng: 9.19, visitors: 600, category: 'europe' },
  // 北美
  { country: '美国', city: '旧金山', countryCode: 'US', lat: 37.77, lng: -122.42, visitors: 2500, category: 'north-america' },
  { country: '美国', city: '波士顿', countryCode: 'US', lat: 42.36, lng: -71.06, visitors: 1800, category: 'north-america' },
  { country: '美国', city: '匹兹堡', countryCode: 'US', lat: 40.44, lng: -79.99, visitors: 1200, category: 'north-america' },
  { country: '加拿大', city: '多伦多', countryCode: 'CA', lat: 43.65, lng: -79.38, visitors: 1000, category: 'north-america' },
  { country: '美国', city: '纽约', countryCode: 'US', lat: 40.71, lng: -74.01, visitors: 1600, category: 'north-america' },
  // 南美
  { country: '巴西', city: '圣保罗', countryCode: 'BR', lat: -23.55, lng: -46.63, visitors: 600, category: 'south-america' },
  // 非洲
  { country: '肯尼亚', city: '内罗毕', countryCode: 'KE', lat: -1.29, lng: 36.82, visitors: 400, category: 'africa' },
  { country: '南非', city: '约翰内斯堡', countryCode: 'ZA', lat: -26.20, lng: 28.05, visitors: 350, category: 'africa' },
  // 大洋洲
  { country: '澳大利亚', city: '悉尼', countryCode: 'AU', lat: -33.87, lng: 151.21, visitors: 900, category: 'oceania' },
  { country: '澳大利亚', city: '墨尔本', countryCode: 'AU', lat: -37.81, lng: 144.96, visitors: 700, category: 'oceania' },
];

export const totalCountries = new Set(visitorSources.map(v => v.countryCode)).size;
export const totalVisitors = visitorSources.reduce((sum, v) => sum + v.visitors, 0);
