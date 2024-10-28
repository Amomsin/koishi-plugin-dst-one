import { Session } from 'koishi'

declare module 'koishi' {
    interface Tables {
        simpleInfo: SimpleInfo
    }
}

// 定义数据库表接口
export interface SimpleInfo {
    id: number
    name: string
    mode: string
    rowId: string
    season: string
    maxconnections: number
    connected: number
    version: string
    platform: string
}