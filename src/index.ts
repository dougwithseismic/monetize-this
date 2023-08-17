import browser, { Tabs } from 'webextension-polyfill'
import { CookieDropData, LaunchOptions, MessageCommand, MonetizeThisInit } from './types'
import { ACTION_MONETIZE, MONETIZABLE_COOKIE } from './constants'
import cookieManager from './modules/cookie-manager'
import browserInteraction from './modules/browser-interaction'
import customHookManager from './modules/custom-hook-manager'
import fetchAffiliateLink from './functions/fetch-affiliate-link'
import isMonetizable from './functions/is-monetizable'

// Default options
const defaultOptions: LaunchOptions = {
    mode: 'auto',
    enabled: false,
}

// Main MonetizeThis Function
const MonetizeThis = ({ apiKey, options }: MonetizeThisInit) => {
    const mergedOptions = { ...defaultOptions, ...options }

    // Define hooks
    const listeners = {
        onBeforeTabUpdate: customHookManager.addListener('beforeTabUpdate'),
        onAfterTabUpdate: customHookManager.addListener('afterTabUpdate'),
        onBeforeMonetizeTab: customHookManager.addListener('beforeMonetizeTab'),
        onAfterMonetizeTab: customHookManager.addListener('afterMonetizeTab'),
        onEnable: customHookManager.addListener('onEnable'),
        onDisable: customHookManager.addListener('onDisable'),
    }

    // Run initialization hooks
    customHookManager.runHooks('onInit', { options: mergedOptions })

    // Enable or disable monetization
    const enabled = async (on: boolean) => {
        on ? enableMonetization() : disableMonetization()
    }

    // Enable monetization
    const enableMonetization = () => {
        mergedOptions.enabled = true
        setupListeners()
        customHookManager.runHooks('onEnable', {})
    }

    // Disable monetization
    const disableMonetization = () => {
        mergedOptions.enabled = false
        removeListeners()
        customHookManager.runHooks('onDisable', {})
    }

    const setupListeners = () => {
        if (mergedOptions.mode === 'auto') {
            browser.tabs.onUpdated.addListener(onTabUpdate)
        }
        browser.runtime.onMessage.addListener(onMessage)
    }

    const removeListeners = () => {
        browser.tabs.onUpdated.removeListener(onTabUpdate)
        browser.runtime.onMessage.removeListener(onMessage)
    }

    const checkAndMonetizeTab = async (url: string) => {
        const hostname = new URL(url).hostname
        const list = convertDomainsToHostnames(mergedOptions.ignoreList)
        if (list.includes(hostname) || (await cookieManager.checkRecentCookieDrop(hostname))) return
        await monetizeTab(url)
    }

    const convertDomainsToHostnames = (ignoreList: string[] = []): string[] =>
        ignoreList.map((domain) => (domain.startsWith('http') ? new URL(domain).hostname : domain))

    const onTabUpdate = async (
        tabId: number,
        changeInfo: Tabs.OnUpdatedChangeInfoType,
        tab: Tabs.Tab
    ) => {
        await customHookManager.runHooks('beforeTabUpdate', { tabId, changeInfo, tab })
        if (changeInfo.status === 'complete' && tab.active) {
            await checkAndMonetizeTab(tab.url || '')
        }
        await customHookManager.runHooks('afterTabUpdate', { tabId, changeInfo, tab })
    }

    const onMessage = async (message: MessageCommand) => {
        const { command, url } = message
        await customHookManager.runHooks('onBeforeMessage', { command, url })
        if (command !== ACTION_MONETIZE) return
        try {
            await monetizeTab(url)
        } catch (error: unknown) {
            console.error('Failed to swap tabs', error)
        }
        await customHookManager.runHooks('onAfterMessage', { command, url })
    }

    const monetizeTab = async (url: string): Promise<void> => {
        await customHookManager.runHooks('beforeMonetizeTab', { url })
        const hostname = new URL(url).hostname
        const hasRecentCookieDrop = await cookieManager.checkRecentCookieDrop(hostname)

        if (hasRecentCookieDrop || (await isMonetizedTab(hostname))) return

        const newTab = await createMoneyTab(url, hostname)
        if (!newTab) return

        const listener = (tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType) => {
            if (tabId === newTab.id && changeInfo.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener)
                finalizeMonetization(hostname, url, newTab.id)
            }
        }

        browser.tabs.onUpdated.addListener(listener)
    }

    const isMonetizedTab = async (hostname: string): Promise<boolean> => {
        const monetizedTabs = await browser.storage.local.get('monetizedTabs')
        return monetizedTabs.monetizedTabs?.[hostname] ?? false
    }

    const createMoneyTab = async (url: string, hostname: string): Promise<Tabs.Tab | null> => {
        console.log(`Cookie drop status for ${hostname}:`, false)
        const affiliateURL = await fetchAffiliateLink(url, apiKey)
        if (!affiliateURL) {
            console.error(`No money link exists for ${url}`)
            return null
        }

        const activeTab = await browserInteraction.getActiveTab()
        if (!activeTab) return null

        // Retrieve existing monetized tabs and update with the new one.
        const monetizedTabs = (await browser.storage.local.get('monetizedTabs')).monetizedTabs || {}
        monetizedTabs[hostname] = true

        await browser.storage.local.set({ monetizedTabs })

        const newTab = await browserInteraction.createNewTab(affiliateURL)
        if (!newTab?.id) return null

        await browserInteraction.setActiveTab(activeTab.id as number)

        return newTab
    }

    const finalizeMonetization = async (
        hostname: string,
        url: string,
        newTabId: number
    ): Promise<void> => {
        // Retrieve existing monetized tabs and remove the current one.
        const monetizedTabs = (await browser.storage.local.get('monetizedTabs')).monetizedTabs || {}
        delete monetizedTabs[hostname]

        await browser.storage.local.set({ monetizedTabs })

        browser.tabs.remove(newTabId)

        const cookieData: CookieDropData = { value: MONETIZABLE_COOKIE, timestamp: Date.now() }
        browser.storage.local.set({ [hostname]: cookieData })

        await customHookManager.runHooks('afterMonetizeTab', { url, success: true })
    }
    return {
        enabled,
        listeners,
        monetizeTab,
        isMonetizable,
        options: mergedOptions,
        checkAndMonetizeTab
    }
}

export type MonetizeThisInstance = ReturnType<typeof MonetizeThis>

export default MonetizeThis

// const monetizeThis: MonetizeThisInstance = MonetizeThis({
//     apiKey: '1234567890',
//     options: { mode: 'auto' },
// })

