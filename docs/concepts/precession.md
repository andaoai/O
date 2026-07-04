---
title: 岁差
---

# 岁差

**岁差**（Precession of the Equinoxes）：地球自转轴在天球上缓慢画圆，周期约 25772 年。表现为春分点沿黄道每年西退约 50.3″，恒星背景相对回归年缓慢漂移。**古今的星宿位置并不一致**——李淳风著《乙巳占》（约 665 年）时的二十八宿，与今日已相差约 20°。

下方两枚罗盘对照展示（外圈叠加 360° 刻度，主标每 30° 一格，方便对齐读数）：

<CompassFigure caption="麟德二年（665） · 二十八宿分布" time="0665-01-15T12:00:00Z">
  <DegreeScale :radius="270" :inner-radius="245" :scale-interval="5" :label-interval="30" />
  <ConstellationsRing :radius="240" :inner-radius="200" :time="new Date('0665-01-15T12:00:00Z')" />
</CompassFigure>

<CompassFigure caption="当代 · 二十八宿分布">
  <DegreeScale :radius="270" :inner-radius="245" :scale-interval="5" :label-interval="30" />
  <ConstellationsRing :radius="240" :inner-radius="200" />
</CompassFigure>

差值肉眼可见——古人所记的春分点在娄宿附近，如今已退到室壁之交。这也是「岁差不改经，改宿度」的实证。

- 参见 [二十八宿 · 距星](./constellations)（二十八宿）——本页环组件的静态版；
- 参见 [二十四节气](./solar-terms)（节气）——节气基于回归年，不受岁差影响，但其所在星宿会西退。
