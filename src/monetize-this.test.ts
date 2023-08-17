chrome.runtime.id = 'test id'

import 'jest-webextension-mock'
import MonetizeThis from './index'
import cookieManager from './modules/cookie-manager'
import browserInteraction from './modules/browser-interaction'
import { MonetizeThisInit } from './types'

type Tab = {
    id: number
    index: number
    highlighted: boolean
    active: boolean
    pinned: boolean
    incognito: boolean
    // ... other properties ...
}

const mockTab: Tab = {
    id: 42,
    index: 0,
    highlighted: false,
    active: false,
    pinned: false,
    incognito: false,
    // ... other properties ...
}

describe('MonetizeThis', () => {
    let monetizeThis: ReturnType<typeof MonetizeThis>

    describe('Initialization', () => {
        it('should initialize with default options', () => {
            monetizeThis = MonetizeThis({ apiKey: '12345' })
            expect(monetizeThis.options.mode).toBe('auto')
            expect(monetizeThis.options.enabled).toBe(false)
        })

        it('should initialize with custom options', () => {
            const options: MonetizeThisInit['options'] = { mode: 'manual', enabled: true }
            monetizeThis = MonetizeThis({ apiKey: '12345', options })
            expect(monetizeThis.options.mode).toBe('manual')
            expect(monetizeThis.options.enabled).toBe(true)
        })
    })

    describe('Listeners', () => {
        beforeEach(() => {
            monetizeThis = MonetizeThis({ apiKey: '12345', options: { mode: 'auto' } })
        })

        it('should setup listeners when enabled', () => {
            monetizeThis.enabled(true)
            expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledWith(expect.any(Function))
            expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function))
        })

        it('should remove listeners when disabled', () => {
            monetizeThis.enabled(false)
            expect(chrome.tabs.onUpdated.removeListener).toHaveBeenCalledWith(expect.any(Function))
            expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(
                expect.any(Function)
            )
        })
    })

    describe('Enable/Disable', () => {
        beforeEach(() => {
            monetizeThis = MonetizeThis({ apiKey: '12345' })
        })

        it('should enable monetization', async () => {
            await monetizeThis.enabled(true)
            expect(monetizeThis.options.enabled).toBe(true)
        })

        it('should disable monetization', async () => {
            await monetizeThis.enabled(false)
            expect(monetizeThis.options.enabled).toBe(false)
        })
    })

    describe('Tab Monetization', () => {
        beforeEach(() => {
            monetizeThis = MonetizeThis({ apiKey: '12345' })
            jest.spyOn(cookieManager, 'checkRecentCookieDrop').mockResolvedValue(false)
            jest.spyOn(browserInteraction, 'getActiveTab').mockResolvedValue(mockTab)
            jest.spyOn(browserInteraction, 'createNewTab').mockResolvedValue({ ...mockTab, id: 43 })
        })

        it('should check for a recent cookie drop', async () => {
            await monetizeThis.checkAndMonetizeTab('http://example.com')
            expect(cookieManager.checkRecentCookieDrop).toHaveBeenCalledWith('example.com')
            // Add more assertions
        })

        // ... Remaining tests ...
    })
})
