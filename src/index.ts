import { LifecycleHooks, lifecycleHooks } from './hooks/lifecycle-hooks'
import { customHooks, CustomHooks } from './hooks/custom-hooks'

import browser, { Tabs } from 'webextension-polyfill'
import { CookieDropData, MessageCommand, MonetizeThisInit } from './types'
import { LaunchOptions } from './options'
import {
    ACTION_MONETIZE,
    TAB_SWAPPED,
    COOKIE_DROP_EXPIRATION_HOURS,
    APP_NAME,
    NOT_AVAILABLE,
    API_URL,
} from './constants'
import { monetizeUrl } from './helpers/monetize-url'
import { isPromise } from 'util/types'

class MonetizeThis {
    private apiKey: string
    private options: LaunchOptions = {
        mode: 'auto', // Default mode set to 'auto'
        enabled: false, // Default is disabled. Call monetizeThis.enabled(true) to enable
    }

    private customHooks: CustomHooks = customHooks // Incorporate custom hooks (see src/hooks/custom-hooks.ts)
    private lifecycleHooks: LifecycleHooks = lifecycleHooks // Incorporate lifecycle hooks (see src/hooks/lifecycle-hooks.ts)

    public listeners = {
        onBeforeTabUpdate: this.addListener('beforeTabUpdate'),
        onAfterTabUpdate: this.addListener('afterTabUpdate'),
        onBeforeMonetizeTab: this.addListener('beforeMonetizeTab'),
        onAfterMonetizeTab: this.addListener('afterMonetizeTab'),
        onEnable: this.addListener('onEnable'),
        onDisable: this.addListener('onDisable'),
    }

    // A helper method to add listeners to custom hooks.
    private addListener(hookName: keyof CustomHooks) {
        return (hook: (...args: any[]) => void) => {
            this.customHooks[hookName].push(hook)
            return () => this.removeListener(hookName, hook) // Return a function to remove this specific listener
        }
    }

    // a helper method to remove listeners from custom hooks.
    private removeListener(hookName: keyof CustomHooks, hook: (...args: any[]) => void) {
        const hookIndex = this.customHooks[hookName].indexOf(hook)
        if (hookIndex !== -1) {
            this.customHooks[hookName].splice(hookIndex, 1)
        }
    }

    private async runHooks(
        hookName: keyof CustomHooks & keyof LifecycleHooks,
        props: any
    ): Promise<void> {
        const lifecycle = this.lifecycleHooks[hookName]

        // Run lifecycle hooks first
        if (typeof lifecycle === 'function') {
            const result: any | Promise<any> = lifecycle(props)
            if (isPromise(result)) {
                await result
            }
        }

        // Run custom hooks and wait for all to complete
        await Promise.all(
            this.customHooks[hookName]?.map(
                async (hook: CustomHooks[typeof hookName]) => await hook(props)
            ) ?? []
        )
    }

    // Constructor accepts API key and options to initialize the instance
    constructor({ apiKey, options }: MonetizeThisInit) {
        this.apiKey = apiKey
        this.options = options

        // Dont lose context of this within callbacks!
        this.onTabUpdate = this.onTabUpdate.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.monetizeTab = this.monetizeTab.bind(this)

        this.runHooks('onInit', { options }) // Hook: onInit
    }

    // Public method to enable or disable monetization
    public async enabled(on: boolean): Promise<void> {
        if (on) {
            this.options.enabled = true
            this.setupListeners()
            await this.runHooks('onEnable', {}) // Hook: onEnable
        } else {
            this.options.enabled = false
            this.removeListeners()
            await this.runHooks('onDisable', {}) // Hook: onDisable
        }
    }

    private setupListeners(): void {
        // Auto mode listener for tab updates
        if (this.options.mode === 'auto') {
            browser.tabs.onUpdated.addListener(this.onTabUpdate)
        }

        // Message listener to handle monetize command
        browser.runtime.onMessage.addListener(this.onMessage)
    }

    // Private method to remove various browser listeners
    private removeListeners(): void {
        // Code to remove listeners...
        browser.tabs.onUpdated.removeListener(this.onTabUpdate)
        browser.runtime.onMessage.removeListener(this.onMessage)
    }

    private async onTabUpdate(
        tabId: number,
        changeInfo: Tabs.OnUpdatedChangeInfoType,
        tab: Tabs.Tab
    ): Promise<void> {
        await this.runHooks('beforeTabUpdate', { tabId, changeInfo, tab })

        if (changeInfo.status === 'complete' && tab.active) {
            this.runTabSwap()
        }

        await this.runHooks('afterTabUpdate1', { tabId, changeInfo, tab })
    }

    private async onMessage(
        message: MessageCommand
    ): Promise<{ success: boolean; message: string } | boolean | null> {
        const { command, url } = message
        if (command !== ACTION_MONETIZE) return true

        try {
            await this.monetizeTab(url)
            return {
                success: true,
                message: TAB_SWAPPED,
            }
        } catch (error: unknown) {
            console.error('Failed to swap tabs', error)
            return {
                success: false,
                message: `Failed to swap tabs: ${error}`,
            }
        }
    }

    // Private method to initialize auto mode
    private async runTabSwap(): Promise<void> {
        const [activeTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
            highlighted: true,
        })
        if (!activeTab?.url) return

        const hostname = new URL(activeTab.url).hostname
        if (await this.getHasRecentCookieDrop(hostname)) return

        await this.monetizeTab(activeTab.url)
    }

    // Private method to get the cookie drop data for a specific hostname
    private async getCookieDrop(hostname: string): Promise<CookieDropData | undefined> {
        const result = await browser.storage.local.get([hostname])
        return result[hostname]
    }

    // Private method to check if there has been a recent cookie drop
    private async getHasRecentCookieDrop(hostname: string): Promise<boolean> {
        const cookieDrop = await this.getCookieDrop(hostname)
        if (!cookieDrop) return false

        const hoursSinceDrop = (Date.now() - cookieDrop.timestamp) / 1000 / 60 / 60
        const hasRecentDrop = hoursSinceDrop < COOKIE_DROP_EXPIRATION_HOURS

        if (hasRecentDrop) {
            console.log(
                `Not dropping new cookie for ${hostname} as existing cookie is less than ${COOKIE_DROP_EXPIRATION_HOURS} hours old.`
            )
        } else {
            await browser.storage.local.set({ [hostname]: false })
        }

        return hasRecentDrop
    }

    private async setActiveTab(tabId: number): Promise<void> {
        try {
            await browser.tabs.update(tabId, { active: true })
        } catch (error) {
            console.error(`Failed to activate tab: ${tabId}`, error)
        }
    }

    private async createNewTab(url: string): Promise<Tabs.Tab | undefined> {
        try {
            return await browser.tabs.create({ url })
        } catch (error) {
            console.error(`Failed to create new tab with url: ${url}`, error)
        }
    }
    async fetchAffiliateLink(url: string): Promise<string | null> {
        try {
            const hostname = new URL(url).hostname
            // Fetch the affiliate link from the Gimme API
            const response = await fetch(
                `${API_URL}${hostname}?fobs=${this.apiKey}&fobs2=${APP_NAME}`
            )
            const { AffiliateRelationship } = await response.json()

            if (!AffiliateRelationship || AffiliateRelationship.length === 0) {
                // Handle the case when no affiliate relationship is found
                browser.storage.local.set({
                    [hostname]: { value: NOT_AVAILABLE, timestamp: Date.now() },
                })
                return null
            }

            // Get the URL from the AffiliateRelationship object
            const affiliateURL = AffiliateRelationship[0].url
            return affiliateURL
        } catch (error) {
            console.error('Error fetching affiliate link:', error)
            return null
        }
    }

    getActiveTab(): Promise<Tabs.Tab | undefined> {
        return new Promise(async (resolve) => {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true })
            const activeTab = tabs.find((tab) => tab.active && tab.highlighted)
            resolve(activeTab)
        })
    }

    public async monetizeTab(url: string): Promise<void> {
        await this.runHooks('beforeMonetizeTab', { url })

        const hostname = new URL(url).hostname

        // First we wanna check whether we've already dropped a cookie for this domain in the last 24 hours
        const hasRecentCookieDrop = await this.getHasRecentCookieDrop(hostname)
        console.log(`Cookie drop status for ${hostname}:`, hasRecentCookieDrop)

        if (hasRecentCookieDrop) return
        // Get the URL from the AffiliateRelationship object
        const affiliateURL = await this.fetchAffiliateLink(url)
        if (!affiliateURL) return

        const activeTab = await this.getActiveTab()
        if (!activeTab) return

        const newTab = await this.createNewTab(affiliateURL) // Use the affiliate URL instead of the original URL
        if (!newTab?.id) return

        await this.setActiveTab(activeTab.id as number)

        const listener = async (tabId: number, info: any): Promise<void> => {
            if (tabId === newTab.id && info.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener) // Now you can remove it
                browser.tabs.remove(newTab.id)

                const cookieData = { value: 'MONETIZABLE', timestamp: Date.now() }
                browser.storage.local.set({ [hostname]: cookieData })

                await this.runHooks('afterMonetizeTab', { url, success: true })
            }
        }

        browser.tabs.onUpdated.addListener(listener) // Add the listener by referencing its name
    }
}

export default MonetizeThis
export { monetizeUrl }
