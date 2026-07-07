/**
 * 反向地理编码 · 离线数据表
 *
 * 用于在苏图罗盘等场景把浏览器返回的经纬度换成一个"人类可读"的地名。
 *
 * ═══════════════════════════════════════════════════════════════
 *  数据结构
 * ═══════════════════════════════════════════════════════════════
 *
 *   { name: 城市中文名, country: 所属国家/地区中文名, lat, lon }
 *
 * 中国内地城市:country 均记 "中国",港澳台按国际惯例单列。
 * lat/lon 精度 0.1° 足够(距离对比时 <11km 误差)。
 *
 * 数据来源:人工整理主要人口密集区,覆盖:
 *   · 中国大陆:所有省级行政单位首府 + 主要经济地级市 (~50 条)
 *   · 世界:各洲主要首都 + 千万级人口城市 (~100 条)
 * 总规模约 150 条,数据体积 ~10KB。
 *
 * ⚠️ 五层架构:静态数据,无副作用。反向查找算法在 utils/reverseGeocode.ts。
 */

export interface CityRecord {
  /** 城市中文名 */
  name: string
  /** 所属国家/地区中文名(用于远距离 fallback 显示) */
  country: string
  /** 纬度(度,北正南负) */
  lat: number
  /** 经度(度,东正西负) */
  lon: number
}

/**
 * 城市表。查表算法在最坏情况下遍历全表 (O(n)),n=150 时约 0.02ms 完成,
 * 无需空间索引。
 */
export const CITIES: readonly CityRecord[] = [
  // ═══════════ 中国大陆 ═══════════
  { name: '北京', country: '中国', lat: 39.9, lon: 116.4 },
  { name: '上海', country: '中国', lat: 31.2, lon: 121.5 },
  { name: '天津', country: '中国', lat: 39.1, lon: 117.2 },
  { name: '重庆', country: '中国', lat: 29.6, lon: 106.5 },
  { name: '广州', country: '中国', lat: 23.1, lon: 113.3 },
  { name: '深圳', country: '中国', lat: 22.5, lon: 114.1 },
  { name: '成都', country: '中国', lat: 30.7, lon: 104.1 },
  { name: '武汉', country: '中国', lat: 30.6, lon: 114.3 },
  { name: '西安', country: '中国', lat: 34.3, lon: 108.9 },
  { name: '南京', country: '中国', lat: 32.1, lon: 118.8 },
  { name: '杭州', country: '中国', lat: 30.3, lon: 120.2 },
  { name: '苏州', country: '中国', lat: 31.3, lon: 120.6 },
  { name: '郑州', country: '中国', lat: 34.8, lon: 113.6 },
  { name: '洛阳', country: '中国', lat: 34.6, lon: 112.5 },
  { name: '开封', country: '中国', lat: 34.8, lon: 114.3 },
  { name: '长沙', country: '中国', lat: 28.2, lon: 112.9 },
  { name: '沈阳', country: '中国', lat: 41.8, lon: 123.4 },
  { name: '大连', country: '中国', lat: 38.9, lon: 121.6 },
  { name: '哈尔滨', country: '中国', lat: 45.8, lon: 126.5 },
  { name: '长春', country: '中国', lat: 43.9, lon: 125.3 },
  { name: '济南', country: '中国', lat: 36.7, lon: 117.0 },
  { name: '青岛', country: '中国', lat: 36.1, lon: 120.4 },
  { name: '南昌', country: '中国', lat: 28.7, lon: 115.9 },
  { name: '福州', country: '中国', lat: 26.1, lon: 119.3 },
  { name: '厦门', country: '中国', lat: 24.5, lon: 118.1 },
  { name: '昆明', country: '中国', lat: 25.0, lon: 102.7 },
  { name: '贵阳', country: '中国', lat: 26.6, lon: 106.7 },
  { name: '兰州', country: '中国', lat: 36.1, lon: 103.8 },
  { name: '太原', country: '中国', lat: 37.9, lon: 112.6 },
  { name: '石家庄', country: '中国', lat: 38.0, lon: 114.5 },
  { name: '呼和浩特', country: '中国', lat: 40.8, lon: 111.7 },
  { name: '银川', country: '中国', lat: 38.5, lon: 106.2 },
  { name: '西宁', country: '中国', lat: 36.6, lon: 101.8 },
  { name: '乌鲁木齐', country: '中国', lat: 43.8, lon: 87.6 },
  { name: '拉萨', country: '中国', lat: 29.7, lon: 91.1 },
  { name: '海口', country: '中国', lat: 20.0, lon: 110.3 },
  { name: '三亚', country: '中国', lat: 18.3, lon: 109.5 },
  { name: '合肥', country: '中国', lat: 31.9, lon: 117.3 },
  { name: '南宁', country: '中国', lat: 22.8, lon: 108.4 },
  { name: '宁波', country: '中国', lat: 29.9, lon: 121.6 },
  { name: '温州', country: '中国', lat: 28.0, lon: 120.7 },
  { name: '无锡', country: '中国', lat: 31.6, lon: 120.3 },
  { name: '常州', country: '中国', lat: 31.8, lon: 119.9 },
  { name: '徐州', country: '中国', lat: 34.3, lon: 117.2 },
  { name: '佛山', country: '中国', lat: 23.0, lon: 113.1 },
  { name: '东莞', country: '中国', lat: 23.0, lon: 113.7 },
  { name: '珠海', country: '中国', lat: 22.3, lon: 113.5 },
  { name: '烟台', country: '中国', lat: 37.5, lon: 121.4 },
  { name: '泉州', country: '中国', lat: 24.9, lon: 118.6 },
  { name: '扬州', country: '中国', lat: 32.4, lon: 119.4 },
  { name: '大同', country: '中国', lat: 40.1, lon: 113.3 },
  { name: '桂林', country: '中国', lat: 25.3, lon: 110.3 },

  // ═══════════ 中国港澳台 ═══════════
  { name: '香港', country: '中国香港', lat: 22.3, lon: 114.2 },
  { name: '澳门', country: '中国澳门', lat: 22.2, lon: 113.5 },
  { name: '台北', country: '中国台湾', lat: 25.0, lon: 121.5 },
  { name: '高雄', country: '中国台湾', lat: 22.6, lon: 120.3 },

  // ═══════════ 东亚 ═══════════
  { name: '东京', country: '日本', lat: 35.7, lon: 139.7 },
  { name: '大阪', country: '日本', lat: 34.7, lon: 135.5 },
  { name: '京都', country: '日本', lat: 35.0, lon: 135.8 },
  { name: '名古屋', country: '日本', lat: 35.2, lon: 137.0 },
  { name: '福冈', country: '日本', lat: 33.6, lon: 130.4 },
  { name: '札幌', country: '日本', lat: 43.1, lon: 141.4 },
  { name: '首尔', country: '韩国', lat: 37.6, lon: 127.0 },
  { name: '釜山', country: '韩国', lat: 35.1, lon: 129.0 },
  { name: '平壤', country: '朝鲜', lat: 39.0, lon: 125.8 },
  { name: '乌兰巴托', country: '蒙古', lat: 47.9, lon: 106.9 },

  // ═══════════ 东南亚 ═══════════
  { name: '曼谷', country: '泰国', lat: 13.7, lon: 100.5 },
  { name: '河内', country: '越南', lat: 21.0, lon: 105.9 },
  { name: '胡志明市', country: '越南', lat: 10.8, lon: 106.7 },
  { name: '新加坡', country: '新加坡', lat: 1.4, lon: 103.8 },
  { name: '吉隆坡', country: '马来西亚', lat: 3.1, lon: 101.7 },
  { name: '雅加达', country: '印度尼西亚', lat: -6.2, lon: 106.8 },
  { name: '马尼拉', country: '菲律宾', lat: 14.6, lon: 121.0 },
  { name: '仰光', country: '缅甸', lat: 16.8, lon: 96.2 },
  { name: '金边', country: '柬埔寨', lat: 11.6, lon: 104.9 },
  { name: '万象', country: '老挝', lat: 17.9, lon: 102.6 },

  // ═══════════ 南亚 ═══════════
  { name: '新德里', country: '印度', lat: 28.6, lon: 77.2 },
  { name: '孟买', country: '印度', lat: 19.1, lon: 72.9 },
  { name: '加尔各答', country: '印度', lat: 22.6, lon: 88.4 },
  { name: '班加罗尔', country: '印度', lat: 12.9, lon: 77.6 },
  { name: '钦奈', country: '印度', lat: 13.1, lon: 80.3 },
  { name: '卡拉奇', country: '巴基斯坦', lat: 24.9, lon: 67.0 },
  { name: '伊斯兰堡', country: '巴基斯坦', lat: 33.7, lon: 73.1 },
  { name: '达卡', country: '孟加拉国', lat: 23.7, lon: 90.4 },
  { name: '科伦坡', country: '斯里兰卡', lat: 6.9, lon: 79.9 },
  { name: '加德满都', country: '尼泊尔', lat: 27.7, lon: 85.3 },

  // ═══════════ 中亚 / 中东 ═══════════
  { name: '喀布尔', country: '阿富汗', lat: 34.5, lon: 69.2 },
  { name: '德黑兰', country: '伊朗', lat: 35.7, lon: 51.4 },
  { name: '巴格达', country: '伊拉克', lat: 33.3, lon: 44.4 },
  { name: '大马士革', country: '叙利亚', lat: 33.5, lon: 36.3 },
  { name: '安曼', country: '约旦', lat: 32.0, lon: 35.9 },
  { name: '耶路撒冷', country: '以色列', lat: 31.8, lon: 35.2 },
  { name: '贝鲁特', country: '黎巴嫩', lat: 33.9, lon: 35.5 },
  { name: '利雅得', country: '沙特阿拉伯', lat: 24.7, lon: 46.7 },
  { name: '麦加', country: '沙特阿拉伯', lat: 21.4, lon: 39.8 },
  { name: '迪拜', country: '阿联酋', lat: 25.3, lon: 55.3 },
  { name: '多哈', country: '卡塔尔', lat: 25.3, lon: 51.5 },
  { name: '科威特城', country: '科威特', lat: 29.4, lon: 47.9 },
  { name: '伊斯坦布尔', country: '土耳其', lat: 41.0, lon: 28.9 },
  { name: '安卡拉', country: '土耳其', lat: 39.9, lon: 32.9 },
  { name: '阿斯塔纳', country: '哈萨克斯坦', lat: 51.2, lon: 71.4 },
  { name: '塔什干', country: '乌兹别克斯坦', lat: 41.3, lon: 69.2 },

  // ═══════════ 欧洲 ═══════════
  { name: '伦敦', country: '英国', lat: 51.5, lon: -0.1 },
  { name: '巴黎', country: '法国', lat: 48.9, lon: 2.4 },
  { name: '柏林', country: '德国', lat: 52.5, lon: 13.4 },
  { name: '慕尼黑', country: '德国', lat: 48.1, lon: 11.6 },
  { name: '罗马', country: '意大利', lat: 41.9, lon: 12.5 },
  { name: '米兰', country: '意大利', lat: 45.5, lon: 9.2 },
  { name: '马德里', country: '西班牙', lat: 40.4, lon: -3.7 },
  { name: '巴塞罗那', country: '西班牙', lat: 41.4, lon: 2.2 },
  { name: '里斯本', country: '葡萄牙', lat: 38.7, lon: -9.1 },
  { name: '阿姆斯特丹', country: '荷兰', lat: 52.4, lon: 4.9 },
  { name: '布鲁塞尔', country: '比利时', lat: 50.8, lon: 4.4 },
  { name: '维也纳', country: '奥地利', lat: 48.2, lon: 16.4 },
  { name: '苏黎世', country: '瑞士', lat: 47.4, lon: 8.5 },
  { name: '布拉格', country: '捷克', lat: 50.1, lon: 14.4 },
  { name: '华沙', country: '波兰', lat: 52.2, lon: 21.0 },
  { name: '布达佩斯', country: '匈牙利', lat: 47.5, lon: 19.0 },
  { name: '雅典', country: '希腊', lat: 37.9, lon: 23.7 },
  { name: '斯德哥尔摩', country: '瑞典', lat: 59.3, lon: 18.1 },
  { name: '奥斯陆', country: '挪威', lat: 59.9, lon: 10.7 },
  { name: '哥本哈根', country: '丹麦', lat: 55.7, lon: 12.6 },
  { name: '赫尔辛基', country: '芬兰', lat: 60.2, lon: 24.9 },
  { name: '莫斯科', country: '俄罗斯', lat: 55.8, lon: 37.6 },
  { name: '圣彼得堡', country: '俄罗斯', lat: 59.9, lon: 30.3 },
  { name: '基辅', country: '乌克兰', lat: 50.5, lon: 30.5 },
  { name: '都柏林', country: '爱尔兰', lat: 53.3, lon: -6.3 },

  // ═══════════ 非洲 ═══════════
  { name: '开罗', country: '埃及', lat: 30.0, lon: 31.2 },
  { name: '亚历山大', country: '埃及', lat: 31.2, lon: 29.9 },
  { name: '卡萨布兰卡', country: '摩洛哥', lat: 33.6, lon: -7.6 },
  { name: '阿尔及尔', country: '阿尔及利亚', lat: 36.8, lon: 3.1 },
  { name: '突尼斯', country: '突尼斯', lat: 36.8, lon: 10.2 },
  { name: '拉各斯', country: '尼日利亚', lat: 6.5, lon: 3.4 },
  { name: '内罗毕', country: '肯尼亚', lat: -1.3, lon: 36.8 },
  { name: '亚的斯亚贝巴', country: '埃塞俄比亚', lat: 9.0, lon: 38.7 },
  { name: '约翰内斯堡', country: '南非', lat: -26.2, lon: 28.0 },
  { name: '开普敦', country: '南非', lat: -33.9, lon: 18.4 },

  // ═══════════ 北美 ═══════════
  { name: '纽约', country: '美国', lat: 40.7, lon: -74.0 },
  { name: '洛杉矶', country: '美国', lat: 34.1, lon: -118.2 },
  { name: '芝加哥', country: '美国', lat: 41.9, lon: -87.6 },
  { name: '华盛顿', country: '美国', lat: 38.9, lon: -77.0 },
  { name: '波士顿', country: '美国', lat: 42.4, lon: -71.1 },
  { name: '旧金山', country: '美国', lat: 37.8, lon: -122.4 },
  { name: '西雅图', country: '美国', lat: 47.6, lon: -122.3 },
  { name: '休斯顿', country: '美国', lat: 29.8, lon: -95.4 },
  { name: '迈阿密', country: '美国', lat: 25.8, lon: -80.2 },
  { name: '达拉斯', country: '美国', lat: 32.8, lon: -96.8 },
  { name: '亚特兰大', country: '美国', lat: 33.7, lon: -84.4 },
  { name: '丹佛', country: '美国', lat: 39.7, lon: -105.0 },
  { name: '费城', country: '美国', lat: 40.0, lon: -75.2 },
  { name: '檀香山', country: '美国', lat: 21.3, lon: -157.9 },
  { name: '多伦多', country: '加拿大', lat: 43.7, lon: -79.4 },
  { name: '温哥华', country: '加拿大', lat: 49.3, lon: -123.1 },
  { name: '蒙特利尔', country: '加拿大', lat: 45.5, lon: -73.6 },
  { name: '墨西哥城', country: '墨西哥', lat: 19.4, lon: -99.1 },
  { name: '哈瓦那', country: '古巴', lat: 23.1, lon: -82.4 },

  // ═══════════ 南美 ═══════════
  { name: '圣保罗', country: '巴西', lat: -23.5, lon: -46.6 },
  { name: '里约热内卢', country: '巴西', lat: -22.9, lon: -43.2 },
  { name: '布宜诺斯艾利斯', country: '阿根廷', lat: -34.6, lon: -58.4 },
  { name: '利马', country: '秘鲁', lat: -12.0, lon: -77.0 },
  { name: '圣地亚哥', country: '智利', lat: -33.4, lon: -70.7 },
  { name: '波哥大', country: '哥伦比亚', lat: 4.7, lon: -74.1 },
  { name: '加拉加斯', country: '委内瑞拉', lat: 10.5, lon: -66.9 },

  // ═══════════ 大洋洲 ═══════════
  { name: '悉尼', country: '澳大利亚', lat: -33.9, lon: 151.2 },
  { name: '墨尔本', country: '澳大利亚', lat: -37.8, lon: 145.0 },
  { name: '布里斯班', country: '澳大利亚', lat: -27.5, lon: 153.0 },
  { name: '珀斯', country: '澳大利亚', lat: -31.9, lon: 116.0 },
  { name: '奥克兰', country: '新西兰', lat: -36.8, lon: 174.8 },
  { name: '惠灵顿', country: '新西兰', lat: -41.3, lon: 174.8 }
] as const
