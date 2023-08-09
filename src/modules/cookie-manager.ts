import { CookieDropData } from '../types'
import { COOKIE_DROP_EXPIRATION_HOURS, NOT_AVAILABLE } from '../constants'
import browser from 'webextension-polyfill'

class CookieManager {
    async getCookieDrop(hostname: string): Promise<CookieDropData | undefined> {
        try {
            const result = await browser.storage.local.get([hostname])
            return result[hostname] as CookieDropData | undefined
        } catch (error) {
            console.error(`Failed to get cookie drop for ${hostname}`, error)
            return undefined
        }
    }

    private calculateHoursSinceDrop(dropTime: number): number {
        return (Date.now() - dropTime) / 1000 / 60 / 60
    }

    

    async checkRecentCookieDrop(hostname: string): Promise<boolean> {
        try {
            const cookieDrop = await this.getCookieDrop(hostname)
            if (!cookieDrop) return false

            const hoursSinceDrop = this.calculateHoursSinceDrop(cookieDrop.timestamp)
            const hasRecentDrop = hoursSinceDrop < COOKIE_DROP_EXPIRATION_HOURS

            if (!hasRecentDrop) {
                await browser.storage.local.set({ [hostname]: NOT_AVAILABLE })
            }

            if (hasRecentDrop) {
                console.log(
                    `Not dropping new cookie for ${hostname} as existing cookie is less than ${COOKIE_DROP_EXPIRATION_HOURS} hours old.`
                )
            }

            return hasRecentDrop
        } catch (error) {
            console.error(`Failed to check recent cookie drop for ${hostname}`, error)
            throw new Error(`Failed to check recent cookie drop for ${hostname}`)
        }
    }
}

export default CookieManager
