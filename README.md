<div align="center">

# 🎙️ VoiceFirst

#### **Empowering Customer Voice through High-Fidelity Feedback & AI-Driven Insights**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

</div>

## 🧠 What is VoiceFirst?

**VoiceFirst** is an enterprise-grade feedback management platform designed to capture and analyze the "voice" of your customers in real-time. It transforms raw data into actionable business intelligence using cutting-edge AI and robust data architectures.

-   **📡 Real-Time Feedback Collection** — Capture ratings and reviews instantly across multiple touchpoints.
-   **🔐 2FA & RBAC Security** — Enterprise-level protection with Two-Factor Authentication and granular Role-Based Access Control.
-   **🤖 AI Sentiment Analysis** — Auto-detect customer mood (Positive / Negative / Critical) and extract key loved/criticized traits.
-   **📍 Multi-Touchpoint Routing** — Track feedback specifically for individual branches, departments, or staff members.
-   **🌓 Modern Fluid UI** — A premium, responsive dashboard experience built with Next.js 14 and Shadcn/UI.
-   **📈 Advanced Analytics** — Visualize feedback trends with dynamic charts and geographic metadata (IP, Location, Browser).

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client Side (Next.js)"]
        UI["Modern Dashboard <br/>(Shadcn/UI, Tailwind)"]
        FeedbackWidget["Feedback Capture Widget"]
    end

    subgraph API ["Server Side (NestJS)"]
        Auth["Auth & 2FA Service"]
        RBAC["RBAC & Permissioning"]
        FeedbackModule["Feedback Explorer"]
        AIService["AI Sentiment Analysis"]
    end

    subgraph DB ["Data Layer"]
        Prisma["Prisma ORM"]
        Postgres[(PostgreSQL)]
    end

    UI <--> Auth
    UI --> FeedbackModule
    FeedbackWidget --> FeedbackModule
    FeedbackModule --> AIService
    FeedbackModule <--> Prisma
    Auth <--> Prisma
    Prisma <--> Postgres
```

---

## 🔥 Key Feature Modules

### 🛡️ Enterprise Security & Access
-   **Multi-Factor Authentication (MFA)**: Secure staff login using TOTP (Google Authenticator/Authy).
-   **Role-Based Access Control (RBAC)**: Manage `ADMIN`, `MANAGER`, `STAFF`, and `USER` roles with specific permissions.
-   **Session Management**: Secure JWT rotation and encrypted cookies.

### 🧪 Advanced Feedback Engine
-   **Dynamic Ratings**: Support for 1-5 star ratings with customizable weights.
-   **Contextual Metadata**: Automatically captures browser, OS, device info, and IP-based geolocation.
-   **Anonymous Submission**: Toggleable option for privacy-focused feedback channels.

### 📊 AI Analytics & Insights
-   **Sentiment Engine**: Real-time analysis of text feedback using advanced NLP.
-   **Loved/Criticized Extraction**: AI identifies specific service or product traits that customers mention most.
-   **Interactive Dashboards**: Heatmaps, trendlines, and branch performance comparisons using **Recharts**.

### 🏢 Multi-Unit Management
-   **Branch Hierarchies**: Organize feedback geographically by City, Branch, and specific Touchpoints.
-   **Staff Assignment**: Link feedback directly to staff members for performance evaluation.

---

## 🛠️ Technical Stack

### **Frontend Infrastructure**
| Technology | Purpose |
| :--- | :--- |
| **Next.js 14** | App Router, Server Actions, & SSR optimization. |
| **Tailwind CSS** | Atomic CSS engine for ultra-fast, responsive styling. |
| **Shadcn/UI** | Radix UI primitives for high-fidelity component architecture. |
| **Framer Motion** | Micro-animations and layout transitions. |
| **Lucide Icons** | Pixel-perfect SVG iconography. |

### **Backend Infrastructure**
| Technology | Purpose |
| :--- | :--- |
| **NestJS** | Modular, enterprise-ready API architecture. |
| **Prisma ORM** | Type-safe database queries and automated migrations. |
| **PostgreSQL** | High-concurrency relational data store. |
| **Passport.js** | JWT & local authentication strategies. |
| **Reflect-Metadata** | Used for dependency injection and decorators. |

---

## 🚀 Quick Setup Guide

### 1. Prerequisites
-   **Node.js** (v18.0 or higher)
-   **npm** or **yarn**
-   **PostgreSQL** instance (local or Cloud)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/NAVEEN78100/VoiceFirst.git
cd VoiceFirst

# Install Backend dependencies
npm install

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Config
Copy `.env.example` to `.env` in both the root and `frontend/` folders:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/voicefirst"
JWT_SECRET="your_secure_secret"
TWO_FACTOR_APP_NAME="VoiceFirst"
```

### 4. Database & Launch
```bash
# Run Database Migrations
npx prisma migrate dev

# Start both services
# (Backend starts on 3000, Frontend on 3001)
npm run dev
```

---

<div align="center">

Developed with ❤️ by the **VoiceFirst Team**.
[Website](#) • [Support](#) • [Documentation](#)

</div>
