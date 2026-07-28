/// <reference types="vite/client" />

/** 非标准浏览器 API 类型声明 */
interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

interface ScreenOrientation {
  angle: number
}

interface Window {
  DeviceOrientationEvent?: DeviceOrientationEventStatic
  orientation?: number
  ondeviceorientationabsolute?: ((event: DeviceOrientationEvent) => void) | null
}

interface Screen {
  orientation?: ScreenOrientation
}
