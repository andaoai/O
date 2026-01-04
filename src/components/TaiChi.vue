<script setup lang="ts">
import { computed } from 'vue'

/**
 * 太极图组件
 *
 * 显示传统的太极图（阴阳鱼）：
 * 1. 根据时间旋转（24小时转一圈）
 * 2. 支持旋转方向控制
 * 3. 可配置颜色和大小
 */

/**
 * 组件属性接口定义
 */
interface Props {
  /** 太极图半径（像素） */
  radius?: number
  /** 阴色（黑色） */
  yinColor?: string
  /** 阳色（白色） */
  yangColor?: string
  /** 阴眼颜色 */
  yinEyeColor?: string
  /** 阳眼颜色 */
  yangEyeColor?: string
  /** 边框颜色 */
  strokeColor?: string
  /** 边框宽度 */
  strokeWidth?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 观测时间（用于计算旋转角度） */
  time?: Date
}

/**
 * 组件默认属性值
 */
const props = withDefaults(defineProps<Props>(), {
  radius: 80,                 // 默认半径 80px
  yinColor: '#000000',        // 标准黑色
  yangColor: '#FFFFFF',       // 标准白色
  yinEyeColor: '#FFFFFF',     // 阴眼白色
  yangEyeColor: '#000000',    // 阳眼黑色
  strokeColor: '#666666',     // 灰色边框
  strokeWidth: 2,             // 边框宽度
  rotationDirection: 'clockwise',  // 默认顺时针
  time: () => new Date()      // 默认使用当前时间
})

/**
 * 根据时间计算太极旋转角度
 * 24小时旋转360度（一天一圈）
 * 白色部分始终指向太阳位置
 *
 * 使用从公元1年开始计算的总天数，支持两千年前的时间
 * 角度连续累加，不会每日重置，避免反转问题
 */
const timeRotation = computed(() => {
  const time = props.time || new Date()

  /**
   * 计算从公元1年1月1日到指定日期的总天数
   * 考虑闰年规则：
   * - 4年一闰
   * - 100年不闰
   * - 400年又闰
   */
  const calculateTotalDays = (date: Date): number => {
    const year = date.getFullYear()
    const month = date.getMonth() // 0-11
    const day = date.getDate()

    // 每月天数（非闰年）
    const monthDays: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    // 计算完整年份的天数
    const y = year - 1
    const totalYears = y

    // 闰年次数计算
    const leap4 = Math.floor(totalYears / 4)
    const leap100 = Math.floor(totalYears / 100)
    const leap400 = Math.floor(totalYears / 400)
    const leapYears = leap4 - leap100 + leap400

    const totalYearsDays = totalYears * 365 + leapYears

    // 计算当年已过的天数
    let yearDays = day
    for (let m = 0; m < month; m++) {
      yearDays += monthDays[m]!
    }

    // 如果是闰年且月份超过2月，加1天
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    if (isLeap && month > 1) {
      yearDays += 1
    }

    return totalYearsDays + yearDays
  }

  // 计算总天数
  const totalDays = calculateTotalDays(time)

  // 计算当天的时间部分（小时、分钟、秒、毫秒）
  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()
  const milliseconds = time.getMilliseconds()

  // 当天的总毫秒数
  const dayMilliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds

  // 一天的总毫秒数
  const fullDayMilliseconds = 24 * 3600000

  // 计算小数天数
  const dayFraction = dayMilliseconds / fullDayMilliseconds

  // 总天数 = 整数天数 + 小数部分
  const exactDays = totalDays + dayFraction

  // 计算旋转角度：每天360度
  const angle = exactDays * 360

  // 加上90度让白色部分在正确位置
  return angle + 90
})
</script>

<template>
  <!-- 太极图容器，直接使用 transform 旋转，围绕自身中心 (0, 0) -->
  <g class="tai-chi" :transform="`rotate(${timeRotation} 0 0)`">
    <!-- 定义裁剪路径 -->
    <defs>
      <clipPath id="tai-chi-clip">
        <circle cx="0" cy="0" :r="radius" />
      </clipPath>
    </defs>

    <!-- 1. 黑色整圆背景 -->
    <circle cx="0" cy="0" :r="radius" :fill="yinColor" />

    <!-- 2. 右半边白色矩形（应用裁剪，形成右半白圆） -->
    <g clip-path="url(#tai-chi-clip)">
      <path
        :d="`M 0,${-radius}
                L ${radius},${-radius}
                L ${radius},${radius}
                L 0,${radius}
                Z`"
        :fill="yangColor"
      />
    </g>

    <!-- 3. 外圆边框 -->
    <circle
      cx="0"
      cy="0"
      :r="radius"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
    />

    <!-- 4. 上部白色小圆 -->
    <circle cx="0" :cy="(-radius / 2)" :r="radius / 2" :fill="yangColor" />

    <!-- 5. 下部黑色小圆 -->
    <circle cx="0" :cy="(radius / 2)" :r="radius / 2" :fill="yinColor" />

    <!-- 6. 阳眼（黑色小圆点） -->
    <circle cx="0" :cy="(-radius / 2)" :r="radius / 6" :fill="yangEyeColor" />

    <!-- 7. 阴眼（白色小圆点） -->
    <circle cx="0" :cy="(radius / 2)" :r="radius / 6" :fill="yinEyeColor" />
  </g>
</template>

<style scoped>
.tai-chi:hover {
  /* 鼠标悬停时稍微提亮 */
  filter: brightness(1.1);
  cursor: pointer;
}
</style>
