// Third-party imports
import browser, { Tabs } from 'webextension-polyfill'

// Internal imports
import { CookieDropData, LaunchOptions, MessageCommand, MonetizeThisInit } from './types'
import { ACTION_MONETIZE, MONETIZABLE_COOKIE } from './constants'
import { monetizeUrl } from './helpers/monetize-url'
import cookieManager, { CookieManager } from './modules/cookie-manager'
import browserInteraction, { BrowserInteraction } from './modules/browser-interaction'
import customHookManager, { CustomHookManager } from './modules/custom-hook-manager'
import fetchAffiliateLink from './functions/fetch-affiliate-link'
import isMonetizable from './functions/is-monetizable'

const defaultOptions: LaunchOptions = {
    mode: 'auto', // Default mode set to 'auto'
    enabled: false, // Default is disabled. Call monetizeThis.enabled(true) to enable
}

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
        this.options = { ...defaultOptions, ...options }

        this.onTabUpdate = this.onTabUpdate.bind(this)
        this.onMessage = this.onMessage.bind(this)
        this.monetizeTab = this.monetizeTab.bind(this)

        this.cookieManager = cookieManager
        this.browserInteraction = browserInteraction
        this.customHookManager = customHookManager

        this.listeners = {
            onBeforeTabUpdate: this.customHookManager.addListener('beforeTabUpdate'),
            onAfterTabUpdate: this.customHookManager.addListener('afterTabUpdate'),
            onBeforeMonetizeTab: this.customHookManager.addListener('beforeMonetizeTab'),
            onAfterMonetizeTab: this.customHookManager.addListener('afterMonetizeTab'),
            onEnable: this.customHookManager.addListener('onEnable'),
            onDisable: this.customHookManager.addListener('onDisable'),
        }

        this.customHookManager.runHooks('onInit', { options })
    }

    /**
     * Enable or disable monetization.
     * @param {boolean} on - State of monetization.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     * @example monetize.enabled(true)
     */
    public async enabled(on: boolean): Promise<void> {
        on ? this.enableMonetization() : this.disableMonetization()
    }

    private enableMonetization(): void {
        this.options.enabled = true
        this.setupListeners()
        this.customHookManager.runHooks('onEnable', {})
    }

    private disableMonetization(): void {
        this.options.enabled = false
        this.removeListeners()
        this.customHookManager.runHooks('onDisable', {})
    }

    private setupListeners(): void {
        if (this.options.mode === 'auto') {
            browser.tabs.onUpdated.addListener(this.onTabUpdate)
        }

        browser.runtime.onMessage.addListener(this.onMessage)
    }

    private removeListeners(): void {
        browser.tabs.onUpdated.removeListener(this.onTabUpdate)
        browser.runtime.onMessage.removeListener(this.onMessage)
    }

    private async checkAndMonetizeTab(url: string): Promise<void> {
        const hostname = new URL(url).hostname
        const list = this.convertDomainsToHostnames(this.options.ignoreList)

        if (list.includes(hostname)) {
            console.log(`Domain exists in Ignore List: ${hostname}`)
            return
        }

        if (await this.cookieManager.checkRecentCookieDrop(hostname)) return
        await this.monetizeTab(url)
    }

    private convertDomainsToHostnames(ignoreList: string[] = []): string[] {
        return ignoreList.map((domain) =>
            domain.startsWith('http') ? new URL(domain).hostname : domain
        )
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

        await this.customHookManager.runHooks('onBeforeMessage', { command, url })

        if (command !== ACTION_MONETIZE) return

        try {
            await this.monetizeTab(url)
        } catch (error: unknown) {
            console.error('Failed to swap tabs', error)
        }

        await this.customHookManager.runHooks('onAfterMessage', { command, url })
    }

    public async monetizeTab(url: string): Promise<void> {
        await this.customHookManager.runHooks('beforeMonetizeTab', { url })

        const hostname = new URL(url).hostname
        const hasRecentCookieDrop = await this.cookieManager.checkRecentCookieDrop(hostname)

        if (hasRecentCookieDrop || (await this.isMonetizedTab(hostname))) return

        const newTab = await this.createMoneyTab(url, hostname)
        if (!newTab) return

        const listener = (tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType) => {
            if (tabId === newTab.id && changeInfo.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener)
                this.finalizeMonetization(hostname, url, newTab.id)
            }
        }

        browser.tabs.onUpdated.addListener(listener)
    }

    private async isMonetizedTab(hostname: string): Promise<boolean> {
        const monetizedTabs = await browser.storage.local.get('monetizedTabs')
        return monetizedTabs.monetizedTabs?.[hostname] ?? false
    }

    private async createMoneyTab(url: string, hostname: string): Promise<Tabs.Tab | null> {
        console.log(`Cookie drop status for ${hostname}:`, false)

        const affiliateURL = await fetchAffiliateLink(url, this.apiKey)
        if (!affiliateURL) {
            console.error(`No money link exists for ${url}`)
            return null
        }

        const activeTab = await this.browserInteraction.getActiveTab()
        if (!activeTab) return null

        // Retrieve existing monetized tabs and update with the new one.
        const monetizedTabs = (await browser.storage.local.get('monetizedTabs')).monetizedTabs || {}
        monetizedTabs[hostname] = true

        await browser.storage.local.set({ monetizedTabs })

        const newTab = await this.browserInteraction.createNewTab(affiliateURL)
        if (!newTab?.id) return null

        await this.browserInteraction.setActiveTab(activeTab.id as number)

        return newTab
    }

    private async finalizeMonetization(
        hostname: string,
        url: string,
        newTabId: number
    ): Promise<void> {
        // Retrieve existing monetized tabs and remove the current one.
        const monetizedTabs = (await browser.storage.local.get('monetizedTabs')).monetizedTabs || {}
        delete monetizedTabs[hostname]

        await browser.storage.local.set({ monetizedTabs })

        browser.tabs.remove(newTabId)

        const cookieData: CookieDropData = { value: MONETIZABLE_COOKIE, timestamp: Date.now() }
        browser.storage.local.set({ [hostname]: cookieData })

        await this.customHookManager.runHooks('afterMonetizeTab', { url, success: true })
    }
}

export default MonetizeThis
export { monetizeUrl, isMonetizable }

/* Example usage

const monetizeThis = new MonetizeThis({ apiKey: '1', options: { mode: 'auto', enabled: true, ignoreList: ['example.com', 'another-domain.com'], // Domains to ignore
 } })
monetizeThis.enabled(true)
monetizeThis.listeners.onAfterMonetizeTab((data) => console.log(data))

*/

// const monetizeThis = new MonetizeThis({
//     apiKey: '@dougwithseismic',
//     options: {
//         mode: 'auto',
//         enabled: true,
//         ignoreList: ['example.com', 'another-domain.com'], // Domains to ignore
//     },
// })

// monetizeThis.enabled(true)
