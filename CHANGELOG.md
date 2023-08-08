# Changelog

## [0.0.14] - 08.08.23

### Added

- Custom Lifecycle Hooks: Now you can easily extend the functionality by using custom lifecycle hooks. These hooks allow you to perform specific actions at different stages of the monetization process.

#### Example of Adding Custom Hooks

```typescript
import MonetizeThis from 'path/to/monetize-this';

const monetizeThis = new MonetizeThis({ apiKey: 'your-api-key', options: {} });

// Add a listener
const removeListener = monetizeThis.listeners.onBeforeMonetizeTab((props) => {
    console.log('About to monetize URL:', props.url);
});

// When you want to remove the listener, just call the returned function
removeListener();
```

#### Current Custom Hooks

| Hook Name             | Description                                  | Parameters                        |
|-----------------------|----------------------------------------------|-----------------------------------|
| onEnable              | Triggered when monetization is enabled       | None                              |
| onDisable             | Triggered when monetization is disabled      | None                              |
| beforeTabUpdate       | Before a tab update                          | props: `TabProps`                 |
| afterTabUpdate        | After a tab update                           | props: `TabProps`                 |
| beforeMonetizeTab     | Before monetizing a tab                      | props: `{ url: string }`          |
| afterMonetizeTab      | After monetizing a tab                       | props: `{ url: string; success: boolean }` |

### Removed

- **Removing Custom Hooks**: The functionality to remove a specific custom hook has been introduced. Once a custom hook is added, you now have the ability to remove it at any time during the execution.

#### Example of Removing Custom Hooks

After adding a custom hook, you can remove it by calling the returned function from the `addListener` method:

```typescript
const removeListener = monetizeThis.listeners.onBeforeMonetizeTab((props) => {
    console.log('About to monetize URL:', props.url);
});

// Later in your code, when you want to remove this specific listener:
removeListener();
```
