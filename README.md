# Monetize-This; Monetize Any Free Web Extension With 3 Lines Of Code

[![Monetize-This](https://img.shields.io/npm/v/monetize-this)](https://www.npmjs.com/package/monetize-this)

**Monetize-This** is an npm package that seamlessly converts any extension into a Honey-like platform, providing you with the tools to effortlessly monetize your website.  **IT'S HEAVILY UNDER CONSTRUCTION RIGHT NOW** so expect breaking changes, bugs, and other typical headaches. That being said, I welcome you to join me in making free extensions profitable for everyone :)

## Roadmap

Feature-wise, `monetize-this` follows an ambitious roadmap - right now, we're doing a background cookie swap on monetizable urls, but the plan is to help anyone build robust monetization features into their chrome extension.

A few upcoming roadmap topics. Here are some potential directions that

- **Store discounts** ::  `getAllDiscounts(url)` - For a given URL, returns all the current live discount codes and offers associated. This is how <https://www.joinhoney.com/> works to help shoppers find a discount code.

- **Search Engine Results augmentation** - I'd like to add  small, non-obtrusive enhancements to google, bing etc so that users can be reminded to support your extension by allowing their next sale to be monetized.

- **Dashboards & Self-serve**. Right now, the signup process is super manual. `monetize-this` is powered by my community cashback portal, that allows anyone to create a group and start pooling together cashback. I'd like onboarding to be as simple as creating a new `gimme` group.

- **Ads & Targeting** - Brands are looking for new ways to reach customers, and as extension owners, we're in a unique position to help link together customers and productse in a far more organic way. In the future, `gimme` will offer non-obtrusive ads on pages to generate more revenue for your extension.

- **Web component templates** - Adding discount extension functionality like Honey's should be as simple as calling one function, e.g. `monetizeThis.discounts.modal.enabled(true)` so we can monetize new extensions quickly, before building out more custom journeys.

Have an improvement for `monetize-this`? Hit me up on <doug+mt@withseismic.com> or create an issue on this repo! I'm also up for collaboration here so please get in touch.

## 📌 Installation & Prerequisites

To utilize Monetize-This, you need to include `storage` and `tabs` permissions to your extension. The `storage` permission allows us to add checks to avoid repeatedly remonetizing a tab. The `tabs` permission, somewhat unsurprisingly, facilitates reading the URL of a tab.
In your extension's manifest.json, add:

```json
{
  ...
  "permissions": ["storage", "tabs"],
  ...
}
```

Developer stores (google etc) will ask you for justification of using the storage and tabs permission. I've had success that inputting `This is required for https://github.com/dougwithseismic/monetize-this to function properly to monetize my app` is enough to get going.

// TODO: ADD SPECIFIC TEXT TEMPLATES FOR STORAGE & TABS PERMISSION EXPLANATIONS. (Someone wanna take this? A great filler issue. )

## 🚀 Getting Started

### Install the Monetize-This package

```bash
npm install monetize-this
```

### Import and initialize Monetize-This in your application

To obtain an API key, please email <doug+mt@withseismic.com> before deploying your application in a production environment. Without it, I won't be able to map back your sales to your specific account!

On your background script, import the package and initialize it with your API key:

```javascript
import monetizeThis from 'monetize-this';

const monetizeThis = new MonetizeThis({
    apiKey: '1',
    options: {
        mode: 'auto', // Will attempt to monetize every tab automatically. 'manual' mode will wait for you to call monetizeThis.monetizeTab(url) from your content script.
        enabled: true,
        ignoreList: ['example.com', 'another-domain.com'], // Domains to ignore
    },
})

monetize.enabled(true); // Call this to enable monetization
```

### What happens after enabling?

Once enabled, `monetize-this` interacts with the `gimme` server (our community cashback tool) to verify if a URL can be monetized via an affiliate link. If possible, it opens a tab in the background with a monetizable link, then shuts it once the page fully loads. Subsequent purchases made by customers will be attributed to your API key, leading to earned commissions.

## Custom Hooks

### onEnable

Triggered when monetization is enabled.

```typescript
monetize.listeners.onEnable(() => {
    console.log('Monetization enabled!');
});
```

### onDisable

Triggered when monetization is disabled.

```typescript
monetize.listeners.onDisable(() => {
    console.log('Monetization disabled!');
});
```

### beforeTabUpdate

Triggered before a tab update. It takes `TabProps` as a parameter.

```typescript
import { TabProps } from '../types';

monetize.listeners.beforeTabUpdate((props: TabProps) => {
    console.log('Before tab update', props);
});
```

### afterTabUpdate

Triggered after a tab update. It also takes `TabProps` as a parameter.

```typescript
import { TabProps } from '../types';

monetize.listeners.afterTabUpdate((props: TabProps) => {
    console.log('After tab update', props);
});
```

### beforeMonetizeTab

Triggered before a tab is monetized. Returns the url

```typescript
monetize.listeners.beforeMonetizeTab((props: { url: string }) => {
    console.log(`Before monetizing tab with URL: ${props.url}`);
});
```

### afterMonetizeTab

Triggered after a tab is monetized.

```typescript
monetize.listeners.afterMonetizeTab((props: { url: string; monetizeUrl: string,  success: boolean }) => {
    console.log(`After monetizing tab with URL: ${props.url}. Success: ${props.success}`);
});
```

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

- **Removing Custom Hooks**:  Hooks return a function that you can call to remove that specific listener, just like other implementations youi might be familiar with.

#### Example of Removing Custom Hooks

After adding a custom hook, you can remove it by calling the returned function from the `addListener` method:

```typescript
const removeListener = monetizeThis.listeners.onBeforeMonetizeTab((props) => {
    console.log('About to monetize URL:', props.url);
});

// Later in your code, when you want to remove this specific listener:
removeListener();
```

## FAQ

### How many stores can be monetized currently?

Currently, about 10,000 stores globally can be monetized with new ones being added every day. Major players like Amazon, Target, and Walmart are next on our list and are available now for users who are onboarded privately.

## 📚 Documentation

We're working on comprehensive documentation. In the meantime, don't hesitate to reach out with any questions or concerns.

## 🙏 Contributing

We're in early access and are actively looking for beta testers. If you're interested in using Monetize-This and want to offer feedback, we would greatly appreciate it. Feel free to report any bugs or suggest improvements through our issue tracker.

## 📧 Contact

For questions, suggestions, or friendly chats, email Doug Silkstone at <doug@withseismic.com>.

## 📃 License

Monetize-This is [MIT licensed](./LICENSE).

## ⭐️ Show your support

If this project has been helpful, please give us a ⭐️!

---

Happy monetizing! 💰
