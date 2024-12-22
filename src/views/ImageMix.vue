<template>
  <div class="main">
    <div class="viewer">
      <canvas
        id="canvas"
        :width="blockPixel * blockCount"
        :height="blockPixel * blockCount"
      ></canvas>
      <div class="generating" v-if="generating">生成中。。。</div>
    </div>
    <div class="operator">
      <div class="flex">
        <button @click="uploadTarget">选择目标</button>
        <button @click="resetTarget">重置目标</button>
      </div>
      <div class="flex">
        <button @click="uploadMaterial">选择素材</button>
        <button @click="resetMaterials">重置素材</button>
      </div>
      <div>共选择{{ materialList.length }}个素材</div>
      <button @click="generateImg" :disabled="generating">生成图片</button>
      <button @click="exportImg">导出图片</button>
      <div>
        当前选中：
        <img v-if="selectedUrl" :src="selectedUrl" alt="当前选中" width="200" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Canvas, FabricImage } from 'fabric'
import { useInputFiles } from '@/hooks/useInputFiles'
import { getBlockAverageColor, getAverageColor } from '@/utils/averageColor'
import type { IFileObj, IBlock, IDiffItem } from '@/types/common'
import { PiniaVuePlugin } from 'pinia'

const dpi = window.devicePixelRatio

/**
 * 像素块大小
 */
const blockPixel = 6
/**
 * 画布分为100*100个像素块
 */
const blockCount = 100

/**
 * 是否正在生成
 */
const generating = ref(false)
/**
 * canvas实例
 */
const canvas = ref()
/**
 * canvas上下文
 */
const ctx = ref()
/**
 * 素材列表
 */
const materialList = ref<IFileObj[]>([])
/**
 * 像素块列表
 */
const blockList = ref<IBlock[]>([])
/**
 * 像素块信息列表
 */
const blockInfoList = ref<IDiffItem[]>([])
/**
 * 当前选中的图片
 */
const selectedUrl = ref('')

const { uploadFiles } = useInputFiles()

/**
 * 获取画布数据
 */
const getCanvasData = async () => {
  for (let Y = 0; Y < canvas.value.height / blockPixel; Y++) {
    for (let X = 0; X < canvas.value.width / blockPixel; X++) {
      //每blockPixel*blockPixel像素的一块区域一组
      const tempColorData: Uint8ClampedArray = ctx.value.getImageData(
        X * blockPixel * dpi,
        Y * blockPixel * dpi,
        blockPixel * dpi,
        blockPixel * dpi,
      ).data
      //获取这一块区域的主色调
      getBlockAverageColor(tempColorData, blockPixel, blockPixel).then((color) => {
        blockList.value[Y * blockCount + X] = { position: [X, Y], color }
      })
    }
  }
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
 * 上传素材图片
 */
const uploadMaterial = async () => {
  try {
    const files = await uploadFiles({
      accept: '.jpg,.jpeg,.png',
      multiple: true,
    })
    for (let i = 0; i < files.length; i++) {
      getAverageColor(files[i]).then((image) => {
        materialList.value.push(image)
      })
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * 重置目标图片
 */
const resetTarget = () => {
  selectedUrl.value = ''
  canvas.value.dispose().then(() => {
    initCanvas()
  })
}
/**
 * 重置素材图片
 */
const resetMaterials = () => {
  materialList.value = []
}
/**
 * 计算颜色差异
 * @param color1 【r,g,b,a】
 * @param color2 【r,g,b,a】
 */
const colorDiff = (color1: number[], color2: number[]) => {
  let d = 0
  for (let i = 0; i < color1.length; i++) {
    d += (color1[i] - color2[i]) ** 2
  }
  return Math.sqrt(d)
}
/**
 * 生成图片
 */
const generateImg = async () => {
  resetTarget()
  generating.value = true
  // 存储每个像素块的颜色差异
  const diffColorList: IDiffItem[] = []
  try {
    for (let i = 0; i < blockList.value.length; i++) {
      const block = blockList.value[i]
      // 计算颜色差异
      const diffs = calculateColorDifferences(block)
      // 获取颜色差异最小的素材
      const material = diffs[0]
      // 创建差异项
      diffColorList[i] = createDiffItem(block, material)
      // 添加图片到画布
      addImageToCanvas(material, block)
    }
    blockInfoList.value = diffColorList
    // console.log("🚀 ~ generateImg ~ blockInfoList.value:", blockInfoList.value)
  } catch (error) {
    console.error(error)
  } finally {
    generating.value = false
  }
}
/**
 * 计算颜色差异并排序
 * @param block 目标像素块
 */
const calculateColorDifferences = (block: IBlock) => {
  return materialList.value
    .map((img) => ({
      url: img.url,
      diff: colorDiff(block.color, img.color),
      color: img.color,
    }))
    .sort((a, b) => a.diff - b.diff)
}
/**
 * 创建差异项
 * @param block 目标像素块
 * @param material 素材
 */
const createDiffItem = (block: IBlock, material: IFileObj) => ({
  position: block.position,
  url: material.url,
  targetColor: block.color,
  materialColor: material.color,
})
/**
 * 添加图片到画布
 * @param material 素材
 * @param block 目标像素块
 */
const addImageToCanvas = async (material: IFileObj, block: IBlock) => {
  const img = await FabricImage.fromURL(material.url)
  const scale = img.height > img.width ? blockPixel / img.width : blockPixel / img.height
  img.set({
    left: block.position[0] * blockPixel,
    top: block.position[1] * blockPixel,
    width: blockPixel / scale,
    height: blockPixel / scale,
    scaleX: scale,
    scaleY: scale,
    selectable: true,
    lockMovementX: true,
    lockMovementY: true,
  })
  img.on('selected', () => {
    selectedUrl.value = material.url
  })
  canvas.value.add(img)
}
/**
 * 导出图片
 */
const exportImg = () => {
  const dataURL = canvas.value.toDataURL({
    width: canvas.value.width,
    height: canvas.value.height,
    left: 0,
    top: 0,
    format: 'png',
  })
  const link = document.createElement('a')
  link.download = 'canvas.png'
  link.href = dataURL
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
/**
 * 初始化canvas
 */
const initCanvas = () => {
  canvas.value = new Canvas('canvas', {
    width: blockPixel * blockCount,
    height: blockPixel * blockCount,
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
