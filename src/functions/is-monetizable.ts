import fetchAffiliateLink from './fetch-affiliate-link'

const isMonetizable = async (url: string): Promise<boolean> => {
    try {
        const hostname = new URL(url).hostname
        const response = await fetchAffiliateLink(hostname, '@dougwithseismic')
        return !!response
    } catch (error) {
        return false
    }
}

export default isMonetizable
