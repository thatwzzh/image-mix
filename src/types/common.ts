export interface IUploadFilesOptions {
  accept: string
  multiple: boolean
}
export interface IFileObj {
  color: number[]
  url: string
}
export interface IBlock {
  position: number[]
  color: number[]
}

export interface IDiffItem {
  position: number[]
  url: string
  targetColor: number[]
  materialColor: number[]
}
