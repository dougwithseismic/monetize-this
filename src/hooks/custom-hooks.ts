import { TabProps } from '../types'

// These are extensible hooks that can be used to add custom functionality.

export interface CustomHooks {
    onEnable: (() => void)[]
    onDisable: (() => void)[]
    beforeTabUpdate: ((props: TabProps) => void)[]
    afterTabUpdate: ((props: TabProps) => void)[]
    beforeMonetizeTab: ((props: { url: string }) => void)[]
    afterMonetizeTab: ((props: { url: string; success: boolean }) => void)[]
    [key: string]: any
    // Add other hooks as needed
}

export const customHooks: CustomHooks = {
    onEnable: [],
    onDisable: [],
    beforeTabUpdate: [],
    afterTabUpdate: [],
    beforeMonetizeTab: [],
    afterMonetizeTab: [],
}
