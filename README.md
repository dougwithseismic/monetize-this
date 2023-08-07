# Monetize-This

[![Monetize-This](https://img.shields.io/npm/v/monetize-this)](https://www.npmjs.com/package/monetize-this)

**Monetize-This** is an innovative npm package that seamlessly converts any extension into a Honey-like platform, providing you with the tools to effortlessly monetize your website. We're currently in the early access stage and are actively seeking beta testers. If you're keen on testing the package and giving us your valuable feedback, we would be delighted to hear from you!

## 📌 Prerequisites
To utilize Monetize-This, you need to include `storage` and `tabs` permissions to your extension. The `storage` permission allows us to add checks to avoid repeatedly remonetizing a tab. The `tabs` permission, somewhat surprisingly, facilitates reading the URL of a tab.

In your extension's manifest.json, add:

```json
{
  ...
  "permissions": ["storage", "tabs"],
  ...
}
```

## 🚀 Getting Started

1. Install the Monetize-This package:

```bash
npm install monetize-this
```

2. Import and initialize Monetize-This in your application - To obtain an API key, please email doug+mt@withseismic.com before deploying your application in a production environment. A failure to do so might result in an inability to map back your sales to your specific account!

```javascript
import monetizeThis from 'monetize-this';
const monetize = new monetizeThis({ apiKey: '@dougwithseismic', options: { mode: 'auto' } });
monetize.init();
```

3. What happens after initialization?

Once initiated, `monetize-this` interacts with the `gimme` server (our community cashback tool) to verify if a URL can be monetized via an affiliate link. If possible, it opens a tab in the background with a monetizable link, then shuts it once the page fully loads. Subsequent purchases made by customers will be attributed to your API key, leading to earned commissions. 

## FAQ

### How many stores can be monetized currently?

Currently, about 10,000 stores globally can be monetized with new ones being added every day. Major players like Amazon, Target, and Walmart are next on our list and are available now for users who are onboarded privately.

## 📚 Documentation

We're working on comprehensive documentation. In the meantime, don't hesitate to reach out with any questions or concerns.

## 🙏 Contributing

We're in early access and are actively looking for beta testers. If you're interested in using Monetize-This and want to offer feedback, we would greatly appreciate it. Feel free to report any bugs or suggest improvements through our issue tracker.

## 📧 Contact

For questions, suggestions, or friendly chats, email Doug Silkstone at doug@withseismic.com.

## 📃 License

Monetize-This is [MIT licensed](./LICENSE).

## ⭐️ Show your support

If this project has been helpful, please give us a ⭐️!

---

Happy monetizing! 💰
