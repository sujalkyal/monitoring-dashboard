# Monitoring System Dashboard

A responsive and modular monitoring dashboard built with **Next.js**, **Tailwind CSS**, and **TypeScript**. This project visualizes key system metrics such as CPU usage, memory usage, and service status in a clean and modern UI.

## 🚀 Features

- 📊 Dynamic metric panels for CPU, Memory, and Services
- 🎯 Clean, responsive layout with Tailwind CSS
- 🔧 Built-in structure for scalability and modularity
- ✅ Type-safe codebase with TypeScript
- 🧱 Based on Next.js App Router and server components

## 🖥️ Technologies Used

- [Next.js 13+ (App Router)](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Lucide Icons](https://lucide.dev/) for SVG-based system icons

## 📂 Folder Structure (Excerpt)

```
/app
  └── page.tsx           # Main dashboard page
  └── globals.css        # Tailwind base styles
/public
/...
```

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/sujalkyal2704/monitoring-dashboard.git
cd monitoring-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

Navigate to `http://localhost:3000` to view the dashboard.

## 🛠️ Development Notes

- Each monitoring panel (CPU, Memory, Services) is modular and styled with utility-first Tailwind classes.
- Icons are powered by `lucide-react`.
- The layout uses responsive grid classes (`grid-cols-1 md:grid-cols-3`) for adaptability.

## 📈 Example Dashboard Panels

- **CPU Usage**: Visual icon and mock data for CPU load
- **Memory Usage**: Displays memory metrics with stylized cards
- **Services**: Represents status or count of monitored services

---

Made with ❤️ using Next.js and Tailwind CSS
