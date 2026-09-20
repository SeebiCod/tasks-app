# Deploy to EC2 with GitHub Actions

CI/CD flow: push to `main` → GitHub Actions builds images → pushes to GHCR → SSHes into EC2 → pulls and restarts containers.

## 1. Push code to GitHub

```bash
cd "/Users/haseebsmacbook/Desktop/docker-website"
git init
git add .
git commit -m "Initial commit"
gh repo create tasks-app --public --source=. --push
# or create the repo manually on github.com and:
# git remote add origin git@github.com:<you>/tasks-app.git
# git push -u origin main
```

## 2. One-time EC2 setup

SSH into your EC2 instance and run:

```bash
# install docker + compose plugin
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# app directory
mkdir -p ~/tasks-app
```

**Security group** — open these inbound ports:
- `22` from your IP (SSH)
- `80` from anywhere (frontend)
- `5001` from anywhere (backend API, optional — frontend calls it from the browser)

## 3. GitHub repo secrets

Go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret          | Value                                                        |
|-----------------|--------------------------------------------------------------|
| `EC2_HOST`      | Public IP or DNS of your EC2 instance                        |
| `EC2_USER`      | `ubuntu` (Ubuntu AMI) or `ec2-user` (Amazon Linux)           |
| `EC2_SSH_KEY`   | The **private** key contents (`-----BEGIN OPENSSH PRIVATE KEY-----` ...) that matches the EC2 keypair |
| `DB_PASSWORD`   | Strong MySQL root password (any string you pick)             |
| `VITE_API_URL`  | `http://<EC2_PUBLIC_IP>:5001/api`                            |

`GITHUB_TOKEN` is provided automatically — no setup needed.

## 4. Deploy

Push to `main`:

```bash
git push origin main
```

Watch the run in **GitHub → Actions**. On success:

- Frontend: `http://<EC2_PUBLIC_IP>/`
- API:      `http://<EC2_PUBLIC_IP>:5001/api/tasks`

## 5. Updates

Just push more commits. Each push builds new images tagged with the short SHA + `latest`, and the EC2 host pulls and restarts.

## Troubleshooting

- **Frontend loads but calls fail** → `VITE_API_URL` secret must match your EC2 IP. Rebuild required (any push).
- **SSH step fails** → check `EC2_HOST` reachable, `EC2_SSH_KEY` is the full private key including header/footer, and the key is authorized on EC2 (`~/.ssh/authorized_keys`).
- **`docker login` fails on EC2** → make sure the repo package visibility allows the EC2 pull; GHCR packages default to inheriting the repo's visibility once you push once.
- **Logs on EC2**:
  ```bash
  cd ~/tasks-app
  docker compose -f docker-compose.prod.yml ps
  docker compose -f docker-compose.prod.yml logs -f backend
  ```

## Optional hardening

- Put Nginx or Caddy in front for HTTPS with a real domain.
- Move DB off-box to Amazon RDS.
- Add a `staging` branch + second EC2 for a staging environment.
- Add tests as a job before `build-and-push` so bad commits don't ship.
