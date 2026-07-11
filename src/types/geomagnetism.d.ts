/**
 * 最小类型声明 for 'geomagnetism'
 *
 * WMM 世界地磁模型包。
 * 官方无 .d.ts，这里声明最小接口让 TypeScript 不报错。
 */

declare module 'geomagnetism' {
  interface GeomagnetismModel {
    /** 计算指定坐标点的地磁参数 */
    point(coords: [number, number, number]): {
      /** 磁偏角（度，东偏为正） */
      decl: number
      /** 磁倾角（度） */
      dip: number
      /** 水平强度 */
      intensity: number
    }
  }

  interface GeomagnetismOptions {
    /** 超出模型有效期时允许回退近似值 */
    allowOutOfBoundsModel?: boolean
  }

  interface GeomagnetismModule {
    /**
     * 获取指定日期的地磁模型
     * @param date 计算日期
     * @param opts 配置选项
     */
    model(date: Date, opts?: GeomagnetismOptions): GeomagnetismModel
  }

  const geomagnetism: GeomagnetismModule
  export default geomagnetism
}
