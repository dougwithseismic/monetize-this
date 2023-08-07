import browser, { Tabs } from 'webextension-polyfill'
import { CookieDropData, MonetizeThisInit } from './types'

const ACTION_MONETIZE = 'monetizeThis'
const APP_NAME = 'MonetizeThis'
const TAB_SWAPPED = 'Tab Swapped'
const COOKIE_DROP_EXPIRATION_HOURS = 24
const NOT_AVAILABLE = 'NOT_AVAILABLE'

class MonetizeThis {
    private apiKey: string
    private options: any = {
        mode: 'auto',
    }

    constructor({ apiKey, options }: MonetizeThisInit) {
        this.apiKey = apiKey
        this.options = options
    }

    public async init(): Promise<void> {
        this.setupListeners()
    }

    setupListeners(): void {
        if (this.options.mode === 'auto') {
            browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
                if (changeInfo.status == 'complete' && tab.active) {
                    await this.initAutoMode()
                }
            })
        }

        browser.runtime.onMessage.addListener(async (message) => {
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
        })
    }

    private async initAutoMode(): Promise<void> {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true })
        const activeTab = tabs.find((tab) => tab.active && tab.highlighted)
        if (!activeTab) return

        const { url } = activeTab
        if (!url) return

        const hostname = new URL(url).hostname
        const hasRecentCookieDrop = await this.getHasRecentCookieDrop(hostname)
        if (hasRecentCookieDrop) return

        await this.monetizeTab(url)
    }

    private async getCookieDrop(hostname: string): Promise<CookieDropData> {
        return new Promise(async (resolve) => {
            const result = await browser.storage.local.get([hostname])
            resolve(result[hostname])
        })
    }

    private getHoursSinceDrop(timestamp: number): number {
        const currentTime = Date.now()
        return (currentTime - timestamp) / 1000 / 60 / 60
    }

    private async getHasRecentCookieDrop(hostname: string): Promise<boolean> {
        const cookieDrop = await this.getCookieDrop(hostname)
        if (!cookieDrop) return false

        const hoursSinceDrop = this.getHoursSinceDrop(cookieDrop.timestamp)
        const hasRecentDrop = hoursSinceDrop < COOKIE_DROP_EXPIRATION_HOURS

        if (hasRecentDrop) {
            console.log(
                `Not dropping new cookie for ${hostname} as existing cookie is less than ${COOKIE_DROP_EXPIRATION_HOURS} hours old.`
            )
        } else {
            browser.storage.local.set({ [hostname]: false })
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
        const hostname = new URL(url).hostname
        // Lets get an affiliate link from the Gimme API
        const response = await fetch(
            `https://api.savewithgimme.com/api/v1/store/get-store-by-domain/${hostname}?fobs=${this.apiKey}&fobs2=${APP_NAME}`
        )
        const { AffiliateRelationship } = await response.json()

        if (!AffiliateRelationship || AffiliateRelationship.length === 0) {
            // set cookie to NOT_AVAILABLE if no affiliate relationship so we'll check again later.
            browser.storage.local.set({
                [hostname]: { value: NOT_AVAILABLE, timestamp: Date.now() },
            })

            return null
        }

        // Get the URL from the AffiliateRelationship object
        const affiliateURL = AffiliateRelationship[0].url
        return affiliateURL
    }

    getActiveTab(): Promise<Tabs.Tab | undefined> {
        return new Promise(async (resolve) => {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true })
            const activeTab = tabs.find((tab) => tab.active && tab.highlighted)
            resolve(activeTab)
        })
    }

    public async monetizeTab(url: string): Promise<void> {
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
        browser.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === 'complete') {
                browser.tabs.onUpdated.removeListener(listener)
                browser.tabs.remove(newTab.id)

                const cookieData = { value: 'MONETIZABLE', timestamp: Date.now() }
                browser.storage.local.set({ [hostname]: cookieData })
            }
        })
    }
}

export default MonetizeThis
