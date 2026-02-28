# Librairie en Ligne - Architecture Microservices

## Presentation du Projet

Ce projet implemente une librairie en ligne utilisant une architecture microservices orchestree par Kubernetes. Il demontre la communication inter-services, le stockage persistant, la securite RBAC et le routage via un Ingress Gateway.

**Etudiantes** : Aya CHIHOUB, Nour khelassi
**Formation** : Master 1 VMI
**Professeur** : Benoit Charroux

## Architecture

Le systeme est compose de trois composants principaux :

```
            Ingress Gateway (nginx)
                |              |
           /api/books     /api/orders
                |              |
         book-service    order-service
          (port 3000)     (port 3001)
                |              |
                +------+-------+
                       |
                  PostgreSQL
                  (port 5432)
```

1. **book-service (Aya)** : Gere le catalogue de livres (CRUD complet)
2. **order-service (Nour)** : Gere les commandes, verifie la disponibilite des livres en appelant le book-service
3. **PostgreSQL** : Base de donnees partagee par les deux services

## Technologies Utilisees

- Node.js + Express (microservices REST API)
- PostgreSQL 16 (base de donnees)
- Docker (conteneurisation)
- Kubernetes / Minikube (orchestration)
- Ingress NGINX (gateway / routage)
- RBAC (securite du cluster)

## Pre-requis

- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Node.js](https://nodejs.org/) (pour le developpement local)

## Guide d'Execution

### 1. Demarrer Minikube

```bash
minikube start
minikube addons enable ingress
```

### 2. Deployer l'ensemble du projet

```bash
kubectl apply -f k8s/
```

Cela deploie automatiquement :
- PostgreSQL avec stockage persistant (PVC)
- book-service (2 replicas)
- order-service (1 replica)
- Ingress Gateway
- RBAC (ServiceAccounts, Roles, RoleBindings)

### 3. Verifier que tout fonctionne

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```

Tous les pods doivent etre en statut `Running` avec `READY 1/1`.

### 4. Tester les APIs

Ouvrir un tunnel pour acceder aux services :

```bash
kubectl port-forward svc/book-service 3000:3000
```

Dans un autre terminal :

```bash
curl http://localhost:3000/api/books
```

Pour le order-service :

```bash
kubectl port-forward svc/order-service 3001:3001
```

```bash
curl http://localhost:3001/api/orders
```

### 5. Creer une commande (test inter-service)

```bash
curl -X POST http://localhost:3001/api/orders -H "Content-Type: application/json" -d "{\"book_id\":1,\"customer_name\":\"Aya\",\"quantity\":2}"
```

Le order-service appelle automatiquement le book-service via le DNS Kubernetes pour verifier que le livre existe.

## Endpoints API

### book-service (port 3000)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/books | Liste tous les livres |
| GET | /api/books/:id | Recupere un livre par ID |
| POST | /api/books | Cree un nouveau livre |
| PUT | /api/books/:id | Met a jour un livre |
| DELETE | /api/books/:id | Supprime un livre |

### order-service (port 3001)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/orders | Liste toutes les commandes |
| POST | /api/orders | Cree une commande |

## Images Docker

| Service | Image | Port |
|---------|-------|------|
| book-service | `ayach10/book-service:latest` | 3000 |
| order-service | `nourno/order-service:latest` | 3001 |

## Structure du Projet

```
.
├── book-service/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── order-service/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── k8s/
│   ├── book-service-deployment.yaml
│   ├── book-service-service.yaml
│   ├── order-service-deployment.yaml
│   ├── order-service-service.yaml
│   ├── postgres-deployment.yaml
│   ├── postgres-service.yaml
│   ├── postgres-pvc.yaml
│   ├── ingress.yaml
│   └── rbac.yaml
└── README.md
```
