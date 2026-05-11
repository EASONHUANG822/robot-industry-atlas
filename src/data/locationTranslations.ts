const provinceTranslations: Record<string, string> = {
  广东: "Guangdong",
  广东省: "Guangdong",
  北京: "Beijing",
  北京市: "Beijing",
  上海: "Shanghai",
  上海市: "Shanghai",
  重庆: "Chongqing",
  重庆市: "Chongqing",
  江苏: "Jiangsu",
  江苏省: "Jiangsu",
  浙江: "Zhejiang",
  浙江省: "Zhejiang",
  四川: "Sichuan",
  四川省: "Sichuan",
  湖北: "Hubei",
  湖北省: "Hubei",
  山东: "Shandong",
  山东省: "Shandong",
  河南: "Henan",
  河南省: "Henan",
  河北: "Hebei",
  河北省: "Hebei",
  安徽: "Anhui",
  安徽省: "Anhui",
  湖南: "Hunan",
  湖南省: "Hunan",
  福建: "Fujian",
  福建省: "Fujian",
  陕西: "Shaanxi",
  陕西省: "Shaanxi",
  辽宁: "Liaoning",
  辽宁省: "Liaoning",
  吉林: "Jilin",
  吉林省: "Jilin",
  黑龙江: "Heilongjiang",
  黑龙江省: "Heilongjiang",
  天津: "Tianjin",
  天津市: "Tianjin",
  香港: "Hong Kong",
  香港特别行政区: "Hong Kong",
  台湾: "Taiwan",
};

const cityTranslations: Record<string, string> = {
  深圳: "Shenzhen",
  深圳市: "Shenzhen",
  北京: "Beijing",
  北京市: "Beijing",
  上海: "Shanghai",
  上海市: "Shanghai",
  重庆: "Chongqing",
  重庆市: "Chongqing",
  杭州: "Hangzhou",
  杭州市: "Hangzhou",
  苏州: "Suzhou",
  苏州市: "Suzhou",
  广州: "Guangzhou",
  广州市: "Guangzhou",
  成都: "Chengdu",
  成都市: "Chengdu",
  武汉: "Wuhan",
  武汉市: "Wuhan",
  南京: "Nanjing",
  南京市: "Nanjing",
  宁波: "Ningbo",
  宁波市: "Ningbo",
  无锡: "Wuxi",
  无锡市: "Wuxi",
  合肥: "Hefei",
  合肥市: "Hefei",
  青岛: "Qingdao",
  青岛市: "Qingdao",
  珠海: "Zhuhai",
  珠海市: "Zhuhai",
  东莞: "Dongguan",
  东莞市: "Dongguan",
  佛山: "Foshan",
  佛山市: "Foshan",
  西安: "Xi'an",
  西安市: "Xi'an",
  长沙: "Changsha",
  长沙市: "Changsha",
  沈阳: "Shenyang",
  沈阳市: "Shenyang",
  长春: "Changchun",
  长春市: "Changchun",
  天津: "Tianjin",
  天津市: "Tianjin",
};

export function translateProvince(province: string | undefined, locale: "zh" | "en") {
  if (!province || locale === "zh") {
    return province ?? "";
  }

  return provinceTranslations[province] ?? provinceTranslations[stripLocationSuffix(province)] ?? stripLocationSuffix(province);
}

export function translateCity(city: string | undefined, locale: "zh" | "en") {
  if (!city || locale === "zh") {
    return city ?? "";
  }

  return cityTranslations[city] ?? cityTranslations[stripLocationSuffix(city)] ?? stripLocationSuffix(city);
}

export function stripLocationSuffix(value: string) {
  return value.replace(/(省|市|区|县|特别行政区)$/g, "");
}
