import browser, { Tabs } from 'webextension-polyfill'

export type BrowserInteraction = {
    setActiveTab: (tabId: number) => Promise<Tabs.Tab>;
    createNewTab: (url: string) => Promise<Tabs.Tab>;
    getActiveTab: () => Promise<Tabs.Tab | undefined>;
  };

  
/**
 * Activates a browser tab by its ID.
 * @param tabId The ID of the tab to activate.
 * @returns A promise resolving to the activated tab.
 */
export const setActiveTab = async (tabId: number): Promise<Tabs.Tab> => {
    return browser.tabs.update(tabId, { active: true })
}

/**
 * Creates a new browser tab with the specified URL.
 * @param url The URL to open in the new tab.
 * @returns A promise resolving to the new tab.
 */
export const createNewTab = async (url: string): Promise<Tabs.Tab> => {
    return browser.tabs.create({ url })
}

/**
 * Gets the currently active and highlighted browser tab.
 * @returns A promise resolving to the active tab, or undefined if no such tab is found.
 */
export const getActiveTab = async (): Promise<Tabs.Tab | undefined> => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    return tabs.find((tab) => tab.active && tab.highlighted)
}

export default {
    setActiveTab,
    createNewTab,
    getActiveTab,
}
