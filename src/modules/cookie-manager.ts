import { CookieDropData } from '../types'
import { COOKIE_DROP_EXPIRATION_HOURS, NOT_AVAILABLE } from '../constants'
import browser from 'webextension-polyfill'

const getCookieDrop = async (hostname: string): Promise<CookieDropData | undefined> => {
    const result = await browser.storage.local.get([hostname])
    return result[hostname] as CookieDropData | undefined
}

const calculateHoursSinceDrop = (dropTime: number): number => (Date.now() - dropTime) / 1000 / 60 / 60

const checkRecentCookieDrop = async (hostname: string): Promise<boolean> => {
    const cookieDrop = await getCookieDrop(hostname)
    if (!cookieDrop) return false

    const hoursSinceDrop = calculateHoursSinceDrop(cookieDrop.timestamp)
    const hasRecentDrop = hoursSinceDrop < COOKIE_DROP_EXPIRATION_HOURS

    if (!hasRecentDrop) {
        await browser.storage.local.set({ [hostname]: NOT_AVAILABLE })
    }

    console.log(
        hasRecentDrop
            ? `Not dropping new cookie for ${hostname} as existing cookie is less than ${COOKIE_DROP_EXPIRATION_HOURS} hours old.`
            : `Cookie expired for ${hostname}.`
    )

    return hasRecentDrop
}

export type CookieManager = {
    getCookieDrop: typeof getCookieDrop,
    checkRecentCookieDrop: typeof checkRecentCookieDrop,
}

export default {
    getCookieDrop,
    checkRecentCookieDrop,
}
