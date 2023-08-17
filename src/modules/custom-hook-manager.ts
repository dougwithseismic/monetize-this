import { lifecycleHooks, LifecycleHooks } from '../hooks/lifecycle-hooks'
import { customHooks, CustomHooks } from '../hooks/custom-hooks'
import { isPromise } from '../helpers/is-promise'

type HookName = keyof CustomHooks & keyof LifecycleHooks

export type CustomHookManager = {
    addListener: typeof addListener
    runHooks: typeof runHooks
}

const customHooksManager: CustomHooks = { ...customHooks }
const lifecycleHooksManager: LifecycleHooks = { ...lifecycleHooks }

const addListener = <K extends keyof LifecycleHooks>(hookName: K) => {
    return (hook: LifecycleHooks[K]) => {
        customHooksManager[hookName].push(hook)
        return () => removeListener(hookName, hook)
    }
}

const removeListener = (hookName: HookName, hook: (...args: any[]) => void) => {
    const hookIndex = customHooksManager[hookName].indexOf(hook)
    if (hookIndex !== -1) {
        customHooksManager[hookName].splice(hookIndex, 1)
    }
}

const runHooks = async (hookName: HookName, props: any): Promise<void> => {
    await runLifecycleHook(hookName, props)
    await runCustomHooks(hookName, props)
}

const runLifecycleHook = async (hookName: HookName, props: any): Promise<void> => {
    const lifecycle = lifecycleHooksManager[hookName]
    if (typeof lifecycle === 'function') {
        await Promise.resolve(lifecycle(props))
    }
}

const runCustomHooks = async (hookName: HookName, props: any): Promise<void> => {
    await Promise.all(
        customHooksManager[hookName]?.map((hook: CustomHooks[typeof hookName]) =>
            Promise.resolve(hook(props))
        ) ?? []
    )
}

export default {
    addListener,
    runHooks,
}
