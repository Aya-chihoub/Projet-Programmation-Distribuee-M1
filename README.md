# 📚 Distributed Bookstore System - Master 1 AI

## Project Overview
This project implements a distributed bookstore using a microservices architecture managed by Kubernetes. It demonstrates inter-service communication, persistent storage, and automated health management.

## 🏗️ Architecture
The system consists of three main components:
1. **Book Service (Aya)**: Manages the inventory of books in the database.
2. **Order Service (Nour)**: Handles customer orders and validates book availability by communicating with the Book Service.
3. **PostgreSQL**: Central database used by both services to persist data.



## 🛠️ Key Technical Features
- **Inter-service Communication**: The Order Service uses `axios` to verify book existence via the Book Service's REST API.
- **Resilience**: Implemented custom "Wait and Retry" logic in Node.js to handle database startup delays.
- **Kubernetes Orchestration**:
    - **Probes**: Added `livenessProbe` and `readinessProbe` to ensure zero-downtime deployments.
    - **Ingress**: Configured an Nginx Ingress Controller for path-based routing (`/api/books` and `/api/orders`).
    - **Persistence**: Used `PersistentVolumeClaim` (PVC) for database reliability.

## 🚀 How to Run
1. Apply the configurations: `kubectl apply -f k8s/`
2. Open the dashboard: Open `dashboard.html` in a web browser.
3. Test the API: `Invoke-RestMethod -Uri "http://localhost/api/orders" -Method Post...`
