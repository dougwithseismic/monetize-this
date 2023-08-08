import browser from 'webextension-polyfill'
import { ACTION_MONETIZE } from '../constants'

export function monetizeUrl(url: string): void {
    browser.runtime.sendMessage({
        command: ACTION_MONETIZE,
        url,
    })
}
