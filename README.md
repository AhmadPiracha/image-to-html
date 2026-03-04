# 🎨 Image → HTML Generator

<p align="center">
  <strong>Transform any image into a beautiful, production-ready HTML website in seconds.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deploy">Deploy</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#sponsor">Sponsor</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🖼️ **Multiple Images** | Upload up to 5 images per generation |
| 🎨 **10 Style Presets** | Luxury, Minimal, Editorial, Bold, Pastel, Retro, E-commerce, Portfolio, Landing, Startup |
| 🎯 **Custom Colors** | Pick your own accent color scheme |
| ✏️ **Edit with AI** | Add custom instructions to refine output |
| 📦 **Auto Compression** | Client-side image optimization |
| 📜 **History Gallery** | Browse and restore previous generations |
| 📱 **Mobile Preview** | Toggle desktop/mobile views |
| 📋 **One-Click Copy** | Copy generated HTML instantly |
| 🛡️ **Rate Limiting** | Built-in API protection (10 req/min) |
| 💰 **Cost Tracker** | See estimated API costs per generation |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [OpenAI API Key](https://platform.openai.com/api-keys)

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmadpiracha/image-to-html.git
cd image-to-html

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your OpenAI API key to .env.local
# OPENAI_API_KEY=sk-your-key-here

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ahmadpiracha/image-to-html&env=OPENAI_API_KEY)

### Manual Deployment

1. Push to GitHub:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   gh repo create image-to-html --public --source=. --push
   ```

2. Go to [vercel.com/new](https://vercel.com/new), import your repo

3. Add environment variable: `OPENAI_API_KEY`

4. Click **Deploy** — your app will be live at `https://your-project.vercel.app`

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PORT` | No | Server port (default: 3000) |

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Backend:** Node.js + Express (local) / Vercel Serverless (production)
- **AI:** OpenAI GPT-4o Vision

## 💸 API Costs

This tool uses **GPT-4o** (vision model):

| Usage | Estimated Cost |
|-------|---------------|
| Per generation | ~$0.01 - $0.05 |
| Images | Compressed client-side to reduce tokens |

> **Note:** Actual costs depend on image complexity and output length.

---

## 🤝 Contributing

Contributions are what make the open source community amazing! Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/ahmadpiracha/image-to-html.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Test your changes locally
   - Update documentation if needed

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push and open a Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```

### Contribution Ideas

- 🎨 Add new style presets
- 🌍 Add i18n/translations
- 🧪 Add tests
- 📱 Improve mobile UI
- 🔧 Performance optimizations
- 📝 Improve documentation
- 🐛 Fix bugs

### Code Style

- Use 2-space indentation
- Use `const`/`let`, no `var`
- Use meaningful variable names
- Add comments for complex logic

---

## ❤️ Sponsor

**This project uses my personal OpenAI API key**, which means every generation costs real money. If you find this tool useful, please consider supporting its development:

<p align="center">
  <a href="https://github.com/sponsors/ahmadpiracha">
    <img src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink?style=for-the-badge&logo=github-sponsors" alt="Sponsor">
  </a>
  <a href="https://buymeacoffee.com/ahmadpiracha">
    <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
  </a>
  <a href="https://ko-fi.com/ahmadpiracha">
    <img src="https://img.shields.io/badge/Ko--fi-%23F16061?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi">
  </a>
</p>

### Why Sponsor?

- 💳 **API costs add up** — Every image generation costs money
- 🚀 **Keep it free** — Your support keeps the demo running
- ⭐ **Motivate development** — Sponsors get priority feature requests
- 🙏 **Show appreciation** — Even $1 helps!

### Other Ways to Support

- ⭐ **Star this repository**
- 🐦 **Share on Twitter/X**
- 📝 **Write a blog post**
- 🐛 **Report bugs**
- 💡 **Suggest features**

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for the GPT-4o Vision API
- [Vercel](https://vercel.com/) for free hosting
- All contributors and sponsors

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ahmadpiracha">Ahmad Piracha</a>
</p>

<p align="center">
  <a href="#-image--html-generator">⬆️ Back to top</a>
</p>
