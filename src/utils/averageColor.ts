import type { IFileObj } from '@/types/common'

/**
 * 获取一个像素块的主色调（平均颜色）
 * @param imageData 图像数据
 * @param blockWidth 宽
 * @param blockHeight 高
 * @returns [r，g，b，a]
 */
function getBlockAverageColor(
  imageData: Uint8ClampedArray,
  blockWidth: number,
  blockHeight: number,
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    try {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      // 取所有像素的平均值
      for (let row = 0; row < blockHeight; row++) {
        for (let col = 0; col < blockWidth; col++) {
          r += imageData[(blockWidth * row + col) * 4]
          g += imageData[(blockWidth * row + col) * 4 + 1]
          b += imageData[(blockWidth * row + col) * 4 + 2]
          a += imageData[(blockWidth * row + col) * 4 + 3]
        }
      }
      // 求取平均值
      r /= blockWidth * blockHeight
      g /= blockWidth * blockHeight
      b /= blockWidth * blockHeight
      a /= blockWidth * blockHeight
      // 将最终的值取整
      r = Math.round(r)
      g = Math.round(g)
      b = Math.round(b)
      a = Math.round(a)
      resolve([r, g, b, a])
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 计算主色调
 * @param imgUrl 图片地址
 * @param canvasSize canvas大小
 * @returns color: 主色调, url: 图片url
 */
async function getAverageColor(imgUrl: string, canvasSize: number = 20): Promise<IFileObj> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      // 设置canvas的宽高都为20,越小越快,但是越小越不精确
      canvas.width = canvasSize
      canvas.height = canvasSize
      const img = new Image() // 创建img元素
      img.src = imgUrl // 设置图片源地址
      img.onload = async () => {
        const ctx = canvas.getContext('2d')!
        const scaleH = canvas.height / img.height
        img.height = canvas.height
        img.width *= scaleH
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        const averageColor = await getBlockAverageColor(imageData, canvas.width, canvas.height)
        resolve({ color: averageColor, url: imgUrl })
      }
    } catch (e) {
      reject(e)
    }
  })
}
export { getBlockAverageColor, getAverageColor }
