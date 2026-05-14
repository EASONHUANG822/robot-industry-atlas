export type LngLatTuple = [number, number];

export const robotValley = {
  id: "shenzhen-robot-valley",
  coordinates: [113.95, 22.54] as LngLatTuple,
  address: {
    en: "Nanshan Zhigu building, Nanshan District, Shenzhen",
    zh: "南山智谷大厦",
  },
  stats: {
    companies: {
      en: "200+",
      zh: "200+",
    },
    showroomArea: {
      en: "2,000 sqm",
      zh: "2,000 平方米",
    },
  },
  zonePath: [
    [113.9438, 22.535],
    [113.9564, 22.535],
    [113.9582, 22.545],
    [113.946, 22.547],
  ] as LngLatTuple[],
};
