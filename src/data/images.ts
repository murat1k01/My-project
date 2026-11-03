/**
 * Фотографии хранятся в assets/images, поэтому приложение работает без интернета.
 * Источник: Unsplash (бесплатная лицензия Unsplash License); фото блюд — Wikimedia Commons, авторы в assets/images/CREDITS.md.
 */
export const images = {
  heroEarth: require('../../assets/images/hero_earth.jpg'),
  serviceLib: require('../../assets/images/service_lib.jpg'),
  serviceCal: require('../../assets/images/service_cal.jpg'),
  serviceLms: require('../../assets/images/service_lms.jpg'),
  serviceBus: require('../../assets/images/service_bus.jpg'),
  serviceFood: require('../../assets/images/service_food.jpg'),
  serviceInfo: require('../../assets/images/service_info.jpg'),
  serviceSport: require('../../assets/images/service_sport.jpg'),
  serviceDorm: require('../../assets/images/service_dorm.jpg'),
  news2: require('../../assets/images/news_2.jpg'),
  news3: require('../../assets/images/news_3.jpg'),
  foodSoup: require('../../assets/images/food_soup.jpg'),
  foodPlov: require('../../assets/images/food_plov.jpg'),
  foodManty: require('../../assets/images/food_manty.jpg'),
  foodSalad: require('../../assets/images/food_salad.jpg'),
  foodBurger: require('../../assets/images/food_burger.jpg'),
  foodPizza: require('../../assets/images/food_pizza.jpg'),
  foodLagman: require('../../assets/images/food_lagman.jpg'),
  foodShashlik: require('../../assets/images/food_shashlik.jpg'),
  foodCoffee: require('../../assets/images/food_coffee.jpg'),
  foodTea: require('../../assets/images/food_tea.jpg'),
  foodCroissant: require('../../assets/images/food_croissant.jpg'),
  foodPancakes: require('../../assets/images/food_pancakes.jpg'),
  foodOatmeal: require('../../assets/images/food_oatmeal.jpg'),
  foodOmelette: require('../../assets/images/food_omelette.jpg'),
  foodRice: require('../../assets/images/food_rice.jpg'),
  foodMash: require('../../assets/images/food_mash.jpg'),
  foodVegsalad: require('../../assets/images/food_vegsalad.jpg'),
  foodSamsa: require('../../assets/images/food_samsa.jpg'),
  foodCheesecake: require('../../assets/images/food_cheesecake.jpg'),
  foodCocoa: require('../../assets/images/food_cocoa.jpg'),
  foodAmericano: require('../../assets/images/food_americano.jpg'),
  foodOrangejuice: require('../../assets/images/food_orangejuice.jpg'),
  foodApplejuice: require('../../assets/images/food_applejuice.jpg'),
  foodWater: require('../../assets/images/food_water.jpg'),
  foodSparkling: require('../../assets/images/food_sparkling.jpg'),
  foodLemonade: require('../../assets/images/food_lemonade.jpg'),
  foodAyran: require('../../assets/images/food_ayran.jpg'),
  foodMilkshake: require('../../assets/images/food_milkshake.jpg'),
  foodIcedtea: require('../../assets/images/food_icedtea.jpg'),
};

/** Фото для страниц раздела «Информация». Это иллюстрации к теме, а не снимки конкретного университета. */
const INFO_IMAGES: Record<string, keyof typeof images> = {
  about: 'heroEarth',
  university: 'serviceInfo',
  faculties: 'serviceLms',
  programs: 'news3',
  groups: 'news2',
  study: 'serviceLms',
  schedule: 'serviceCal',
  library: 'serviceLib',
  food: 'serviceFood',
  dormitory: 'serviceDorm',
  transport: 'serviceBus',
  sport: 'serviceSport',
  events: 'news2',
  contacts: 'serviceInfo',
  faq: 'news3',
  terms: 'serviceCal',
  privacy: 'heroEarth',
  support: 'serviceBus',
};

export function infoImage(slug: string) {
  return images[INFO_IMAGES[slug] ?? 'serviceInfo'];
}
