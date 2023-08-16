import fetchAffiliateLink from './fetch-affiliate-link'

const isMonetizable = async (url: string): Promise<boolean> => {
    try {
        const response = await fetchAffiliateLink(url, '@dougwithseismic')
        return !!response
    } catch (error) {
        return false
    }
}

export default isMonetizable
