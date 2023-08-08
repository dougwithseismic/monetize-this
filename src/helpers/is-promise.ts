// Helper function to check if a value is a Promise
export function isPromise(value: any): value is Promise<any> {
    return value && typeof value.then === 'function'
}
