import { TabProps } from '../types'

export interface LifecycleHooks {
    onInit: () => void
    onEnable: () => void
    onDisable: () => void
    beforeTabUpdate: (props: TabProps) => void
    afterTabUpdate: (props: TabProps) => void
    beforeMonetizeTab: (props: { url: string }) => void
    afterMonetizeTab: (props: { url: string; monetizeUrl: string; success: boolean }) => void
    [key: string]: (arg0: any) => void // Add this line
}

export const lifecycleHooks: LifecycleHooks = {
    onInit: async () => {
        // Code to run on initialization
    },
    onEnable: async () => {
        // Code for enabling monetization listeners
    },
    onDisable: async () => {
        // Code for disabling monetization listeners
    },
    beforeTabUpdate: async (props: TabProps) => {
        // Code to run before tab update actions
    },
    afterTabUpdate: async (props: TabProps) => {
        // Code to run after tab update actions
    },
    beforeMonetizeTab: async ({ url }) => {
        // Code to run before monetizing the tab
    },
    afterMonetizeTab: async ({ url, monetizeUrl, success }) => {
        // Code to run after monetizing the tab
    },
}

export function applyHooks(baseClass: any, lifecycleHooks: LifecycleHooks) {
    Object.keys(lifecycleHooks).forEach((key) => {
        baseClass.prototype[key] = lifecycleHooks[key]
    })
}
