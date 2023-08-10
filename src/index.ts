import { LifecycleHooks, lifecycleHooks } from './hooks/lifecycle-hooks'
import { customHooks, CustomHooks } from './hooks/custom-hooks'

import browser, { Tabs } from 'webextension-polyfill'
import { CookieDropData, MessageCommand, MonetizeThisInit } from './types'
import { LaunchOptions } from './options'
import {
    ACTION_MONETIZE,
    TAB_SWAPPED,
    APP_NAME,
    NOT_AVAILABLE,
    API_URL,
    MONETIZABLE_COOKIE,
} from './constants'
import { monetizeUrl } from './helpers/monetize-url'
import CookieManager from './modules/cookie-manager'
import BrowserInteraction from './modules/browser-interaction'
import CustomHookManager from './modules/custom-hook-manager'
import fetchAffiliateLink from './functions/fetch-affiliate-link'

const defaultOptions: LaunchOptions = {
    mode: 'auto', // Default mode set to 'auto'
    enabled: false, // Default is disabled. Call monetizeThis.enabled(true) to enable
}

/**
 * Main class for managing monetization activities.
 */
class MonetizeThis {
    private apiKey: string
    private options: LaunchOptions = defaultOptions

    public listeners
    private cookieManager: CookieManager
    private browserInteraction: BrowserInteraction
    private customHookManager: CustomHookManager

    /**
     * Create a MonetizeThis instance.
     * @param {MonetizeThisInit} Object containing API key and options.
     * @returns {MonetizeThis} A MonetizeThis instance.
     * @example const monetize = new MonetizeThis({ apiKey: '1234567890', options: { mode: 'auto' }})
     */
    constructor({ apiKey, options }: MonetizeThisInit) {
        this.apiKey = apiKey
        this.options = options

        // Dont lose context of this within callbacks!
        this.onTabUpdate = this.onTabUpdate.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.monetizeTab = this.monetizeTab.bind(this)

        this.cookieManager = new CookieManager()
        this.browserInteraction = new BrowserInteraction()
        this.customHookManager = new CustomHookManager()

        this.listeners = {
            onBeforeTabUpdate: this.customHookManager.addListener('beforeTabUpdate'),
            onAfterTabUpdate: this.customHookManager.addListener('afterTabUpdate'),
            onBeforeMonetizeTab: this.customHookManager.addListener('beforeMonetizeTab'),
            onAfterMonetizeTab: this.customHookManager.addListener('afterMonetizeTab'),
            onEnable: this.customHookManager.addListener('onEnable'),
            onDisable: this.customHookManager.addListener('onDisable'),
        }

        this.customHookManager.runHooks('onInit', { options }) // Hook: onInit
    }

    /**
     * Enable or disable monetization.
     * @param {boolean} on - State of monetization.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     * @example monetize.enabled(true)
     */
    public async enabled(on: boolean): Promise<void> {
        if (on) {
            this.options.enabled = true
            this.setupListeners()
            await this.customHookManager.runHooks('onEnable', {}) // Hook: onEnable
        } else {
            this.options.enabled = false
            this.removeListeners()
            await this.customHookManager.runHooks('onDisable', {}) // Hook: onDisable
        }
    }

    private setupListeners(): void {
        // Auto mode listener for tab updates
        if (this.options.mode === 'auto') {
            browser.tabs.onUpdated.addListener(this.onTabUpdate)
        }

        browser.runtime.onMessage.addListener(this.onMessage)
    }

    // Private method to remove various browser listeners
    private removeListeners(): void {
        // Code to remove listeners...
        browser.tabs.onUpdated.removeListener(this.onTabUpdate)
        browser.runtime.onMessage.removeListener(this.onMessage)
    }

    private async checkAndMonetizeTab(url: string): Promise<void> {
        const hostname = new URL(url).hostname
        if (await this.cookieManager.checkRecentCookieDrop(hostname)) return
        await this.monetizeTab(url)
    }

    private async onTabUpdate(
        tabId: number,
        changeInfo: Tabs.OnUpdatedChangeInfoType,
        tab: Tabs.Tab
    ): Promise<void> {
        await this.customHookManager.runHooks('beforeTabUpdate', { tabId, changeInfo, tab })

        if (changeInfo.status === 'complete' && tab.active) {
            await this.checkAndMonetizeTab(tab.url || '')
        }

        await this.customHookManager.runHooks('afterTabUpdate', { tabId, changeInfo, tab })
    }

    private async onMessage(message: MessageCommand): Promise<void> {
        const { command, url } = message

        await this.customHookManager.runHooks('onBeforeMessage', { command, url }) // Hook: onBeforeMessage

        if (command !== ACTION_MONETIZE) return

        try {
            await this.monetizeTab(url)
        } catch (error: unknown) {
            console.error('Failed to swap tabs', error)
        }

        await this.customHookManager.runHooks('onAfterMessage', { command, url }) // Hook: onAfterMessage
    }

    public async monetizeTab(url: string): Promise<void> {
        await this.customHookManager.runHooks('beforeMonetizeTab', { url })

        const hostname = new URL(url).hostname

        // First we wanna check whether we've already dropped a cookie for this domain in the last 24 hours
        const hasRecentCookieDrop = await this.cookieManager.checkRecentCookieDrop(hostname)
        console.log(`Cookie drop status for ${hostname}:`, hasRecentCookieDrop)

        if (hasRecentCookieDrop) return
        // Get the URL from the AffiliateRelationship object
        const affiliateURL = await fetchAffiliateLink(url, this.apiKey)
        if (!affiliateURL) return

        const activeTab = await this.browserInteraction.getActiveTab()
        if (!activeTab) return

        const newTab = await this.browserInteraction.createNewTab(affiliateURL) // Use the affiliate URL instead of the original URL
        if (!newTab?.id) return

        await this.browserInteraction.setActiveTab(activeTab.id as number)

        const listener = async (tabId: number, info: any): Promise<void> => {
            if (tabId === newTab.id && info.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener) // Now you can remove it
                browser.tabs.remove(newTab.id)

                const cookieData = { value: MONETIZABLE_COOKIE, timestamp: Date.now() }
                browser.storage.local.set({ [hostname]: cookieData })

                await this.customHookManager.runHooks('afterMonetizeTab', { url, success: true })
            }
        }

        browser.tabs.onUpdated.addListener(listener) // Add the listener by referencing its name
    }
}

export default MonetizeThis
export { monetizeUrl }

/* Example usage

const monetizeThis = new MonetizeThis({ apiKey: '1', options: { mode: 'auto', enabled: true } })
monetizeThis.enabled(true)
monetizeThis.listeners.onAfterMonetizeTab((data) => console.log(data))

*/
