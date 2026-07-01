# Horizon Dashboard

![Screenshot](https://raw.githubusercontent.com/your-repo/horizon-dashboard/main/docs/screenshot.png)

A premium, dark‑mode web dashboard for managing OpenStack resources (networks, subnets, routers, compute instances, etc.). Built with **Vue 3**, **Vite**, **TailwindCSS**, and **Pinia**. The UI emphasizes a modern glassmorphism aesthetic with cyan/teal accents, smooth micro‑animations, and a fully responsive layout.

---

## ✨ Features
- **Network Management** – View and edit networks, subnets, and virtual routers.
- **Compute Management** – List, inspect, and control VM instances.
- **Dynamic Topology Graph** – Interactive Vis.js based SDN visualization.
- **Dark‑Mode UI** – Premium glass‑like cards, gradients, and subtle animations.
- **Responsive Design** – Works on desktop, tablet, and mobile screens.
- **Modular Architecture** – Components are split by feature area (`/components/network`, `/components/compute`).
- **State Management** – Pinia stores for networks, routers, and compute resources.
- **Docker‑Compose Development** – Full stack can be spun up locally with a single command.

---

## 📦 Installation
### Prerequisites
- **Node.js** >= 18
- **Docker & Docker Compose** (for the backend services)
- **Git**

### Clone the repository
```bash
git clone https://github.com/your-username/horizon-dashboard.git
cd horizon-dashboard
```

### Install dependencies
```bash
npm install
```

### Run the development server
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

---

## 🛠️ Backend (Docker Compose)
A minimal OpenStack‑like backend is provided for local development.
```bash
cd backend
docker-compose up -d
```
The API is exposed at `http://localhost:8000/api` and is consumed by the frontend.

---

## 🚀 Production Build
```bash
npm run build   # Generates optimized assets in ./dist
```
Serve the `dist` folder with any static‑file server (e.g., `npx serve dist`).

---

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/awesome-feature`.
3. Make your changes and ensure the UI follows the existing design system.
4. Run the linter and formatters:
   ```bash
   npm run lint && npm run format
   ```
5. Open a pull request describing the changes.

Please read the **CODE_OF_CONDUCT.md** and **CONTRIBUTING.md** for detailed guidelines.

---

## 📜 License
This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements
- **Vue 3** – progressive JavaScript framework.
- **TailwindCSS** – utility‑first CSS framework.
- **Vis‑Network** – graph visualization.
- **Lucide‑Vue‑Next** – icon set.
- Inspired by Horizon OpenStack dashboard and modern admin UI trends.

---

*Enjoy managing your cloud resources with style!*
