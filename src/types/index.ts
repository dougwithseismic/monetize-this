export interface MonetizeThisInit {
    apiKey: string
    options: any
}

export interface MTOptions {
    mode: 'auto' | 'manual'
}

export type CookieDropData = { value: string; timestamp: number } | undefined
