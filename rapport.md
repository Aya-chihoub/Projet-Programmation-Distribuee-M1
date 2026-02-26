# Mini Rapport - Projet Programmation Distribuee

**Etudiants** : Aya, Nour  
**Date** : 26 Fevrier 2026  
**Sujet** : Online Bookstore - Architecture Microservices

---

## 1. Architecture du Projet

Le projet est compose de deux microservices communiquant entre eux, deployes dans un cluster Kubernetes avec une base de donnees PostgreSQL.

```
                    +-------------------+
                    |   Ingress Gateway |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+          +--------v---------+
     |  book-service    |          |  order-service    |
     |  (Node.js/Express|          |  (Node.js/Express)|
     |  Port 3000)      |          |  Port 3001)       |
     +--------+---------+          +--------+----------+
              |                             |
              +-------------+---------------+
                            |
                   +--------v--------+
                   |   PostgreSQL    |
                   |   (Port 5432)   |
                   +-----------------+
```

### Technologies utilisees

| Technologie | Utilisation |
|-------------|-------------|
| Node.js + Express | Microservices REST API |
| PostgreSQL 16 | Base de donnees |
| Docker | Conteneurisation |
| Kubernetes (Minikube) | Orchestration |
| Ingress | Gateway / Routage |
| RBAC | Securite du cluster |

---

## 2. Microservice : book-service (Aya)

### Endpoints REST API

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/books | Liste tous les livres |
| GET | /api/books/:id | Recupere un livre par ID |
| POST | /api/books | Cree un nouveau livre |
| PUT | /api/books/:id | Met a jour un livre |
| DELETE | /api/books/:id | Supprime un livre |
| GET | /health | Health check pour Kubernetes |

### Capture d'ecran : API fonctionnelle

> [INSERER SCREENSHOT : resultat de `curl http://localhost:3000/api/books`]

---

## 3. Microservice : order-service (Nour)

### Endpoints REST API

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/orders | Liste toutes les commandes |
| GET | /api/orders/:id | Recupere une commande par ID |
| POST | /api/orders | Cree une commande (appelle book-service) |
| PATCH | /api/orders/:id/status | Met a jour le statut d'une commande |
| GET | /health | Health check pour Kubernetes |

### Communication inter-services

Le order-service appelle le book-service via le DNS interne Kubernetes (`http://book-service:3000`) pour verifier la disponibilite et le prix d'un livre avant de creer une commande.

### Capture d'ecran : API fonctionnelle

> [INSERER SCREENSHOT : resultat de `curl http://localhost:3001/api/orders`]

---

## 4. Docker

Chaque microservice possede son propre Dockerfile base sur `node:20-alpine`.

**Images Docker Hub** :
- `ayach10/book-service:latest`
- `[nour-username]/order-service:latest`

### Capture d'ecran : Docker Hub

> [INSERER SCREENSHOT : page Docker Hub montrant l'image book-service]

### Capture d'ecran : Docker build

> [INSERER SCREENSHOT : terminal montrant `docker build` reussi]

---

## 5. Kubernetes

### Ressources deployees

| Ressource | Nom | Details |
|-----------|-----|---------|
| Deployment | book-service | 2 replicas |
| Deployment | order-service | 2 replicas |
| Deployment | postgres | 1 replica |
| Service | book-service | ClusterIP, port 3000 |
| Service | order-service | ClusterIP, port 3001 |
| Service | postgres | ClusterIP, port 5432 |
| PersistentVolumeClaim | postgres-pvc | 1Gi de stockage |
| Ingress | bookstore-ingress | Routage /api/books et /api/orders |

### Capture d'ecran : Pods en cours d'execution

> [INSERER SCREENSHOT : resultat de `kubectl get pods`]

### Capture d'ecran : Services

> [INSERER SCREENSHOT : resultat de `kubectl get svc`]

---

## 6. Base de Donnees PostgreSQL

- Deployee dans Kubernetes avec un PersistentVolumeClaim (1Gi)
- Base : `bookstore`
- Tables : `books`, `orders`
- Donnees initiales : 5 livres pre-charges automatiquement

### Capture d'ecran : Donnees en base

> [INSERER SCREENSHOT : resultat de l'API montrant les livres avec `created_at` (preuve de PostgreSQL)]

---

## 7. Securite - RBAC

Mise en place de controles d'acces via RBAC Kubernetes :

| Ressource | Nom | Permissions |
|-----------|-----|-------------|
| ServiceAccount | book-service-sa | Attache au deployment book-service |
| ServiceAccount | postgres-sa | Attache au deployment postgres |
| Role | book-service-role | Lecture pods, services, configmaps |
| Role | postgres-role | Lecture pods, PVCs |
| RoleBinding | book-service-rolebinding | Lie book-service-sa au role |
| RoleBinding | postgres-rolebinding | Lie postgres-sa au role |

### Capture d'ecran : RBAC

> [INSERER SCREENSHOT : resultat de `kubectl get serviceaccounts` et `kubectl get roles`]

---

## 8. Gateway / Ingress

Mise en place d'un Ingress Kubernetes pour router les requetes :

- `/api/books` → book-service (port 3000)
- `/api/orders` → order-service (port 3001)

### Capture d'ecran : Ingress

> [INSERER SCREENSHOT : resultat de `kubectl get ingress`]

---

## 9. GitHub

Le code source est disponible sur GitHub :

> [INSERER LIEN GITHUB]

---

## 10. Conclusion

Ce projet nous a permis de mettre en pratique :
- Le developpement de microservices avec Node.js/Express
- La conteneurisation avec Docker
- L'orchestration avec Kubernetes
- La gestion de base de donnees PostgreSQL dans un cluster
- La securisation avec RBAC
- Le routage avec Ingress Gateway
- La communication inter-services via DNS Kubernetes
