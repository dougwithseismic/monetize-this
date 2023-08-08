import { Tabs } from 'webextension-polyfill'
import { LaunchOptions } from '../options'

export interface MonetizeThisInit {
    apiKey: string
    options: LaunchOptions
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


export type HookFunction = (...args: any[]) => void;
