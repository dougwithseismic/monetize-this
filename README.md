# Monetize-This: Effortlessly Monetize Any Free Browser Extension

[![Discord](https://img.shields.io/discord/1140522766764888084?style=flat&logo=discord&logoColor=blue&label=discord)](https://discord.gg/gimme) [![Monetize-This](https://img.shields.io/npm/v/monetize-this)](https://www.npmjs.com/package/monetize-this)

**Monetize-This** is an npm package that seamlessly transforms any extension into a Honey-like platform, allowing you to effortlessly monetize your website. **Please note: This project is actively under development**, so breaking changes, bugs, and other hiccups are possible. However, we’d love for you to join us in making free extensions profitable for everyone!

## 📌 Installation & Prerequisites

To use Monetize-This, your extension needs `storage` and `tabs` permissions. `storage` is required to avoid remonetizing tabs repeatedly, and `tabs` facilitates reading URLs.

Add the following to your `manifest.json`:

```json
{
  "permissions": ["storage", "tabs"]
}
```

When developer stores ask for permission justification, this explanation works well: `This is required for https://github.com/dougwithseismic/monetize-this to function properly in order to monetize my app`.

*// TODO: Add specific text templates for storage & tabs permissions explanations. PRs welcome!*

## 🚀 Getting Started

### Quick Start Checklist

1. **Star this repo!**
2. **Join the Discord** and say hi: [https://discord.gg/gimme](https://discord.gg/gimme)
3. **Get set up!**

### Install Monetize-This

```bash
npm install monetize-this
```

### Import and Initialize

To obtain an API key, email [doug+mt@withseismic.com](mailto:doug+mt@withseismic.com) before deploying to production. Without it, we won't be able to link sales to your account!

In your background script:

```typescript
import MonetizeThis from 'monetize-this';

const monetizeThis = new MonetizeThis({
    apiKey: 'your-api-key',
    options: {
        mode: 'auto', // Options: 'auto' to monetize all tabs, 'manual' to manually call monetizeTab().
        enabled: true,
        ignoreList: ['example.com', 'another-domain.com'],
    },
});

monetizeThis.enable(); // Enables monetization
```

### What Happens After Enabling?

Once enabled, **Monetize-This** interacts with the `gimme` server (our community cashback tool) to see if a URL can be monetized via an affiliate link. If a monetizable link is found, it will open in a background tab, then close once loaded. Purchases made afterward are attributed to your API key, resulting in commissions.

## 📜 API Methods

### `isMonetizable(url: string): Promise<boolean>`
Checks if a URL can be monetized.

```typescript
const canBeMonetized = await monetizeThis.isMonetizable('https://www.amazon.com');
```

### `monetizeTab(url: string): Promise<void>`
Monetizes a tab by initiating monetization through the service worker.

```typescript
await monetizeThis.monetizeTab('https://www.amazon.com');
```

## 🔄 Custom Hooks
Extend functionality with custom lifecycle hooks at different stages of monetization.

### Available Hooks

- **`onEnable`** - Triggered when monetization is enabled.
  ```typescript
  monetizeThis.listeners.onEnable(() => {
      console.log('Monetization enabled!');
  });
  ```

- **`onDisable`** - Triggered when monetization is disabled.
  ```typescript
  monetizeThis.listeners.onDisable(() => {
      console.log('Monetization disabled!');
  });
  ```

- **`beforeTabUpdate`** - Triggered before a tab update.
  ```typescript
  monetizeThis.listeners.beforeTabUpdate((props) => {
      console.log('Before tab update', props);
  });
  ```

- **`afterTabUpdate`** - Triggered after a tab update.
  ```typescript
  monetizeThis.listeners.afterTabUpdate((props) => {
      console.log('After tab update', props);
  });
  ```

- **`beforeMonetizeTab`** - Triggered before a tab is monetized.
  ```typescript
  monetizeThis.listeners.beforeMonetizeTab(({ url }) => {
      console.log(`Before monetizing tab with URL: ${url}`);
  });
  ```

- **`afterMonetizeTab`** - Triggered after a tab is monetized.
  ```typescript
  monetizeThis.listeners.afterMonetizeTab(({ url, success }) => {
      console.log(`After monetizing tab with URL: ${url}. Success: ${success}`);
  });
  ```

### Removing Hooks
Hooks return a function for removing listeners.

```typescript
const removeListener = monetizeThis.listeners.beforeMonetizeTab(({ url }) => {
    console.log('About to monetize URL:', url);
});

// Remove listener when done
removeListener();
```

## 🛣️ Roadmap

**Monetize-This** has an ambitious roadmap, and here are some planned features:

- **Store Discounts** - `getAllDiscounts(url)` for obtaining active discount codes for a given URL.
- **Search Engine Augmentation** - Enhancements to search results, reminding users to support your extension.
- **Dashboards & Self-serve** - Simplifying onboarding through `gimme`.
- **Ads & Targeting** - Non-intrusive ad placements to boost extension revenue.
- **Web Component Templates** - Quickly integrate discount features with a single function.

Got an idea? Contact [doug+mt@withseismic.com](mailto:doug+mt@withseismic.com) or create an issue on this repo. We’re open to collaborations!

## ❓ FAQ

### How many stores can be monetized?
Currently, around 10,000 stores globally, with more added every day. Major stores like Amazon, Target, and Walmart are already available for private onboarded users.

## 📚 Documentation
We’re working on complete documentation—in the meantime, feel free to reach out with any questions.

## 🙏 Contributing
We’re actively looking for beta testers. If you’re interested in trying **Monetize-This** and providing feedback, we’d greatly appreciate it. Report bugs or suggest improvements through our issue tracker.

## 📧 Contact
Questions or suggestions? Email Doug Silkstone at [doug@withseismic.com](mailto:doug@withseismic.com).

## 📃 License
Monetize-This is [MIT licensed](./LICENSE).

## ⭐️ Show Your Support
If this project has helped you, please give us a ⭐️!

---
Happy monetizing! 💰

