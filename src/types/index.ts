import { Tabs } from 'webextension-polyfill'

export interface MonetizeThisInit {
    apiKey: string
    options: LaunchOptions
}

export interface LaunchOptions {
    mode: 'auto' | 'manual'
    enabled?: boolean
    ignoreList?: string[]
}

export type CookieDropData = { value: string; timestamp: number } | undefined

export type TabProps = {
    tabId: number
    changeInfo: Tabs.OnUpdatedChangeInfoType
    tab: Tabs.Tab
}

export type MessageCommand = {
    command: string
    url: string
}

export type HookFunction = (...args: any[]) => void
