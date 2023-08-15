import browser from 'webextension-polyfill'
import { API_URL, APP_NAME, NOT_AVAILABLE } from '../constants'

async function fetchAffiliateLink(url: string, apiKey: string): Promise<string | null> {
    if (!url || !apiKey) {
        console.error('URL or API key is missing', { url, apiKey })
        return null
    }
    try {
        const hostname = new URL(url).hostname
        // Fetch the affiliate link from the Gimme API
        const response = await fetch(`${API_URL}${hostname}`)
        const { AffiliateRelationship } = await response.json()

        if (!AffiliateRelationship || AffiliateRelationship.length === 0) {
            // Handle the case when no affiliate relationship is found

            const storage = {
                [hostname]: { value: NOT_AVAILABLE, timestamp: Date.now() },
            }

            browser.storage.local.set(storage)
            return null
        }

        // Get the URL from the AffiliateRelationship object
        const affiliateURL = `${AffiliateRelationship[0].url}?fobs=${apiKey}&fobs2=${APP_NAME}`
        return affiliateURL
    } catch (error) {
        console.error('Error fetching affiliate link:', error)
        return null
    }
}

export default fetchAffiliateLink
