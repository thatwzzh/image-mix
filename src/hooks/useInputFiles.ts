import type { IUploadFilesOptions } from '@/types/common'
export function useInputFiles() {
  const inputFile = document.createElement('input')
  inputFile.setAttribute('id', 'myInput')
  inputFile.setAttribute('type', 'file')
  inputFile.setAttribute('accept', 'image/jpeg,image/jpg,image/png')
  inputFile.setAttribute('name', 'file')
  inputFile.setAttribute('style', 'display: none')
  /**
   * 设置input元素的属性
   * @param inputFile input元素
   * @param options 配置参数
   */
  const handleAttribute = (inputFile: Element, options: IUploadFilesOptions) => {
    if (options.multiple) {
      inputFile.setAttribute('multiple', 'multiple')
    } else {
      inputFile.removeAttribute('multiple')
    }
    inputFile.setAttribute('accept', options.accept)
  }
  /**
   * 创建input元素
   * @param options 配置参数
   */
  const createInput = (options: IUploadFilesOptions) => {
    handleAttribute(inputFile, options)
    document.body.appendChild(inputFile)
  }
  /**
   * 将文件转为url
   * @param e 事件对象
   */
  const pushFiles = (e: Event) => {
    const urlArr = []
    for (let i = 0; i < (e.target as HTMLInputElement).files!.length; i++) {
      const file = (e.target as HTMLInputElement).files![i]
      const url = URL.createObjectURL(file)
      urlArr.push(url)
    }
    return urlArr
  }
  /**
   * 上传文件
   * @param options 配置参数
   */
  const uploadFiles = (options: IUploadFilesOptions): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      // 创建input元素
      createInput(options)
      // 监听input元素的change事件
      inputFile.onchange = (e) => {
        const files = pushFiles(e)
        if (files.length > 0) {
          document.body.removeChild(inputFile)
          resolve(files)
        } else {
          reject()
        }
      }
      // 触发input元素的click事件
      inputFile.click()
    })
  }
  return {
    uploadFiles,
  }
}
