<template>
  <div class="main">
    <div class="viewer">
      <canvas
        id="canvas"
        :width="blockPixel * blockCount"
        :height="blockPixel * blockCount"
      ></canvas>
    </div>
    <div class="operator">
      <div class="flex">
        <button @click="uploadTarget">选择目标</button>
        <button @click="resetTarget">重置目标</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Canvas, FabricImage } from 'fabric'
import { useInputFiles } from '@/hooks/useInputFiles'
import { getBlockAverageColor } from '@/utils/averageColor'
import type { IBlock } from '@/types/common'

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
 * 像素块列表
 */
const blockList = ref<IBlock[]>([])

const { uploadFiles } = useInputFiles()

/**
 * 获取画布数据
 */
const getCanvasData = async () => {
  for (let Y = 0; Y < canvas.value.height / blockPixel; Y++) {
    for (let X = 0; X < canvas.value.width / blockPixel; X++) {
      //每blockPixel*blockPixel像素的一块区域一组
      const tempColorData: Uint8ClampedArray = ctx.value.getImageData(
        X * blockPixel,
        Y * blockPixel,
        blockPixel,
        blockPixel,
      ).data
      //获取这一块区域的主色调
      getBlockAverageColor(tempColorData, blockPixel, blockPixel).then((color) => {
        blockList.value[Y * blockCount + X] = { position: [X, Y], color }
      })
    }
  }
  console.log("🚀 ~ getBlockAverageColor ~ blockList.value:", blockList.value)
}
/**
 * 绘制目标图像
 * @param url 图片url
 */
const drawImage = async (url: string) => {
  try {
    // 通过url获取图片实例
    const img = await FabricImage.fromURL(url)
    // 计算缩放比例，以较短的边为基准
    const scale =
      img.height > img.width ? canvas.value.width / img.width : canvas.value.height / img.height
    // 设置图片属性
    img.set({
      left: canvas.value.width / 2,
      top: canvas.value.height / 2,
      originX: 'center', // 设置图片的原点为中心
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
      selectable: true, // 设置图片可选中
    })
    img.on('added', () => {
      //这里有个问题,added后获取的是之前的画布像素数据,其他手动触发的事件,不会有这种问题
      //故用一个异步解决
      setTimeout(() => {
        getCanvasData()
      }, 500)
    })
    // 添加图片到画布
    canvas.value.add(img)
  } catch (error) {
    console.error(error)
  }
}
/**
 * 上传目标图片
 */
const uploadTarget = async () => {
  try {
    const files = await uploadFiles({
      accept: '.jpg,.jpeg,.png',
      multiple: false,
    })
    resetTarget()
    drawImage(files[0])
  } catch (error) {
    console.error(error)
  }
}

/**
 * 重置目标图片
 */
const resetTarget = () => {
  canvas.value.dispose().then(() => {
    initCanvas()
  })
}
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
