<template>
  <div class="main">
    <div class="viewer">
      <canvas
        id="canvas"
        :width="blockPixel * blockCount"
        :height="blockPixel * blockCount"
      ></canvas>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Canvas } from 'fabric'

/**
 * 像素块大小
 */
const blockPixel = 6
/**
 * 画布分为100*100个像素块
 */
const blockCount = 100
/**
 * canvas实例
 */
const canvas = ref()
/**
 * canvas上下文
 */
const ctx = ref()

/**
 * 初始化canvas
 */
const initCanvas = () => {
  canvas.value = new Canvas('canvas', {
    isDrawingMode: false, //禁用自由绘画模式
    selectable: true, // 禁用对象的选择功能
    selection: true, // 禁用画布上的选择框
    hoverCursor: 'pointer', // 设置鼠标悬停在画布上的光标样式为指针
    enableRetinaScaling: true, // 启用高清屏幕支持
  })
  ctx.value = canvas.value.getContext('2d', { willReadFrequently: true })
}

onMounted(() => {
  initCanvas()
})
</script>
<style>
.main {
  display: flex;
  gap: 24px;
  padding: 24px;
}
.viewer {
  border: 1px solid #ccc;
  position: relative;
}
.generating {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: black;
  user-select: none;
  pointer-events: none;
}
.operator {
  padding: 24px;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.flex {
  display: flex;
  gap: 12px;
}
</style>
