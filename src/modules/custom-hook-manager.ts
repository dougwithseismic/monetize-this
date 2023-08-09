import { lifecycleHooks, LifecycleHooks } from '../hooks/lifecycle-hooks'
import { customHooks, CustomHooks } from '../hooks/custom-hooks'
import { isPromise } from 'util/types'

type HookName = keyof CustomHooks & keyof LifecycleHooks

class CustomHookManager {
    public customHooks: CustomHooks = customHooks
    public lifecycleHooks: LifecycleHooks = lifecycleHooks

    constructor() {
        // Using arrow functions to avoid binding in the constructor
    }

    // A helper method to add listeners to custom hooks.
    addListener = <K extends keyof LifecycleHooks>(hookName: K) => {
        return (hook: LifecycleHooks[K]) => {
            this.customHooks[hookName].push(hook)
            return () => this.removeListener(hookName, hook) // Return a function to remove this specific listener
        }
    }

    // A helper method to remove listeners from custom hooks.
    private removeListener = (hookName: HookName, hook: (...args: any[]) => void) => {
        const hookIndex = this.customHooks[hookName].indexOf(hook)
        if (hookIndex !== -1) {
            this.customHooks[hookName].splice(hookIndex, 1)
        }
    }

    // A method to run hooks with proper error handling
    async runHooks(hookName: HookName, props: any): Promise<void> {
        try {
            await this.runLifecycleHook(hookName, props)
            await this.runCustomHooks(hookName, props)
        } catch (error) {
            console.error(`An error occurred while running hooks for ${hookName}`, error)
            throw error // Propagate error for higher-level handling if needed
        }
    }

    // Separate method for lifecycle hook execution
    private async runLifecycleHook(hookName: HookName, props: any): Promise<void> {
        const lifecycle = this.lifecycleHooks[hookName]
        if (typeof lifecycle === 'function') {
            const result: any | Promise<any> = lifecycle(props)
            if (isPromise(result)) {
                await result
            }
        }
    }

    // Separate method for custom hook execution
    private async runCustomHooks(hookName: HookName, props: any): Promise<void> {
        await Promise.all(
            this.customHooks[hookName]?.map(
                async (hook: CustomHooks[typeof hookName]) => await hook(props)
            ) ?? []
        )
    }
}

export default CustomHookManager
