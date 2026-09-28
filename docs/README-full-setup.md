# SideQuest: Full Setup (Backend + App)

Use this guide if you want to run **everything yourself**: the Spring Boot backend, the tunnels, and the mobile app. When you finish, anyone on the team can scan **your** QR code and use the app.

If you only want to open the app on your phone, use **[README-app-only.md](README-app-only.md)** instead.

---

## How it fits together

```
Phone (Expo Go)
  |-- loads the app code ------> Tunnel B (port 8081) --> Expo on your laptop
  |-- sends quests/check-ins --> Tunnel A (port 8080) --> Spring Boot backend on your laptop
                                                            |--> OpenAI   (AI picks the stops)
                                                            |--> Supabase (saves quests + stamps)
```

- **Tunnel A** gives the backend a public `https://...trycloudflare.com` address so phones can reach it.
- **Tunnel B** does the same for the app code. Expo's built-in `--tunnel` uses ngrok, which has been failing, so we use Cloudflare for this too.
- **Both addresses change every time a tunnel restarts.** That causes most of the errors.

You'll have **4 terminals** running at once:

| Terminal | Runs | Type in it after starting? |
|---|---|---|
| 1. BACKEND | Spring Boot | No |
| 2. TUNNEL A | Cloudflare tunnel, port 8080 | No |
| 3. TUNNEL B | Cloudflare tunnel, port 8081 | No |
| 4. EXPO | `npx expo start` | Only to restart Expo |

Open a **5th terminal** for any other command. In VS Code, right-click each terminal tab and choose **Rename**, so you never type in the wrong one.

---

## 1. One-time setup

### 1.1 Install the tools

| Tool | Why | Where |
|---|---|---|
| **Java JDK 17+** | Runs the backend | [adoptium.net](https://adoptium.net) (Temurin). Keep **"Add to PATH"** on during install |
| **Node.js LTS** | Runs the app (Expo) | [nodejs.org](https://nodejs.org) |
| **cloudflared** | Creates the tunnels | Windows: download `cloudflared-windows-amd64.exe` from [github.com/cloudflare/cloudflared/releases](https://github.com/cloudflare/cloudflared/releases) into your **Downloads** folder. Mac: `brew install cloudflared` |
| **Git** | Gets the code | [git-scm.com](https://git-scm.com) |
| **Expo Go** (on your phone) | Opens the app | App Store / Google Play |

Close and reopen your terminal, then check:

```
java -version
node -v
npm -v
```

<details>
<summary><b>School laptop without admin rights? (Node.js)</b></summary>

1. On nodejs.org, download the **Windows Binary (.zip)** for LTS, not the `.msi`.
2. Unzip it and add it to your PATH (no admin needed):
   ```powershell
   Expand-Archive "$env:USERPROFILE\Downloads\node-v*-win-x64.zip" -DestinationPath "$env:USERPROFILE\nodejs"
   $nodeDir = (Get-ChildItem "$env:USERPROFILE\nodejs" -Directory | Select-Object -First 1).FullName
   [Environment]::SetEnvironmentVariable("Path", "$nodeDir;" + [Environment]::GetEnvironmentVariable("Path", "User"), "User")
   ```
3. Open a new terminal. If `npm` says *"running scripts is disabled on this system"*, run this once per terminal:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
   or type `npm.cmd` / `npx.cmd` instead of `npm` / `npx`.
4. If a Windows Firewall popup asks for admin rights, press **Cancel**. The tunnels don't need it.

</details>

### 1.2 Get the code

```
git clone https://github.com/DEVELOPING100/SideQuest.git
cd SideQuest
git checkout main
git pull
```

### 1.3 Add the backend keys (never commit this file)

Create this file:

```
backend/src/main/resources/application-local.properties
```

Put these four lines in it. **Ask David for the values in a private message.** Never post them in the group chat or on GitHub.

```properties
openai.api.key=
sidequest.supabase.url=
sidequest.supabase.secret-key=
sidequest.routing.api-key=
```

| Key | Needed? | Without it |
|---|---|---|
| `sidequest.supabase.url` + `secret-key` | **Required** | Every quest, check-in and stamp fails (they're saved in Supabase) |
| `openai.api.key` | Strongly recommended | Quests still work, but use a simpler vibe-based pick instead of the AI |
| `sidequest.routing.api-key` | Optional | Travel times are estimated from straight-line distance |

This file is already in `.gitignore`. Before every commit, run `git status` and make sure it's **not** listed.

### 1.4 Install the app's packages

```
cd frontend
npm install
cd ..
```

---

## 2. Every time you run it

### Before you start
- **Plug the laptop in and turn off sleep** (Windows: **Settings > System > Power > Screen and sleep > Never** when plugged in). Sleep kills the tunnels.
- On your phone, open Expo Go and **delete old SideQuest entries** under *Recently opened*. They point to dead addresses.
- Open Notepad to write down **address A** and **address B**.

### Step 1: Backend (terminal 1)

Windows:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Mac / Linux:
```bash
cd backend
./mvnw spring-boot:run
```

Wait until you see **both** lines:
```
Place catalog loaded: 66 places
Started BackendApplication
```

### Step 2: Tunnel A for the backend (terminal 2)

Windows:
```powershell
cd "$env:USERPROFILE\Downloads"
.\cloudflared-windows-amd64.exe tunnel --protocol http2 --url http://localhost:8080
```
Mac:
```bash
cloudflared tunnel --protocol http2 --url http://localhost:8080
```

Find the box that says *"Your quick Tunnel has been created!"* and copy the address. That's **address A**.

### Step 3: Tunnel B for the app (terminal 3)

Same command, but port **8081**:

Windows:
```powershell
cd "$env:USERPROFILE\Downloads"
.\cloudflared-windows-amd64.exe tunnel --protocol http2 --url http://localhost:8081
```
Mac:
```bash
cloudflared tunnel --protocol http2 --url http://localhost:8081
```

Copy its address. That's **address B**.

### Step 4: Check that address A works (5th terminal)

Replace `ADDRESS-A`:

Windows:
```powershell
Invoke-RestMethod "https://ADDRESS-A.trycloudflare.com/api/passport"
```
Mac:
```bash
curl https://ADDRESS-A.trycloudflare.com/api/passport
```

You should get JSON with stamps. New tunnels can take up to 30 seconds, so retry once if it fails.

### Step 5: Start the app (terminal 4)

Run these **one line at a time**, replacing `ADDRESS-A` and `ADDRESS-B`.

Windows (PowerShell):
```powershell
cd frontend
Set-Content -Path .env.local -Value "EXPO_PUBLIC_API_URL=https://ADDRESS-A.trycloudflare.com/api"
Get-Content .env.local
$env:EXPO_PACKAGER_PROXY_URL = "https://ADDRESS-B.trycloudflare.com"
npx expo start -c
```
Mac / Linux:
```bash
cd frontend
echo "EXPO_PUBLIC_API_URL=https://ADDRESS-A.trycloudflare.com/api" > .env.local
cat .env.local
export EXPO_PACKAGER_PROXY_URL="https://ADDRESS-B.trycloudflare.com"
npx expo start -c
```

In the startup output, check for:
- `env: export EXPO_PUBLIC_API_URL`
- a line under the QR code that mentions **address B**

Rules:
- **Address A** goes in `.env.local`, **with `/api` on the end**.
- **Address B** goes in `EXPO_PACKAGER_PROXY_URL`, **without `/api`**.
- Always use **`-c`** after changing either address. It clears the old one from Expo's cache.
- **Don't** use `--tunnel`. That's the ngrok option that's been failing.

### Step 6: Open it on a phone

1. In the phone's browser, open `https://ADDRESS-B.trycloudflare.com/status`. It should say **`packager-status:running`**.
2. Scan the QR code: **iPhone** with the Camera app, **Android** from inside Expo Go.
3. The EXPO terminal should print **`iOS Bundled`** or **`Android Bundled`**.
4. Tap **Build my quest**. The BACKEND terminal should show the request arrive.

**Teammates can now scan your QR code too.** They only need Expo Go. Send them nothing else.

---

## 3. Troubleshooting

| What you see | What it means | Fix |
|---|---|---|
| **530** or **Error 1033: Cloudflare Tunnel error** | That tunnel address is dead (the tunnel was closed or restarted). The `zone` in the error names which address | Restart that tunnel, update `.env.local` (A) or `EXPO_PACKAGER_PROXY_URL` (B), restart Expo with `-c` |
| **"There was a problem running the requested project"** in Expo Go | Expo Go opened an **old saved link** (dead tunnel B) | Delete old SideQuest entries in Expo Go, scan the **new** QR code |
| **"A server with the specified hostname could not be found"** | The app calls an address that no longer exists | Same as the 530 fix |
| **404** | Address A is missing `/api`, or has it twice | `.env.local` must end in `.trycloudflare.com/api` |
| **"Set EXPO_PUBLIC_API_URL to an absolute backend URL..."** | `.env.local` is empty, missing, or in the wrong folder | It must be in `frontend/`. Check it with `Get-Content .env.local` (or `cat`), then restart with `-c` |
| **`CommandError: ... reading 'body'`** / "Check the Ngrok status page" | Expo's `--tunnel` (ngrok) failed | Don't use `--tunnel`. Use tunnel B + `EXPO_PACKAGER_PROXY_URL` (step 5) |
| **Changes don't show on the phone** | Expo Go is running an old cached copy | Delete old entries in Expo Go, scan the new QR code, look for `Bundled` in the EXPO terminal |
| **`npx` / `node` not recognized** | Node isn't on this terminal's PATH | Open a new terminal, or redo the PATH lines in section 1.1 |
| **`Unable to connect to the remote server`** on `localhost:8080` | The backend isn't running | Restart it in terminal 1, wait for `Started BackendApplication` |
| Backend shows red **`COMPILATION ERROR`** | Code problem on your branch | `git status` to see what changed. `git checkout main` then `git pull` for the working version |
| Backend: **`SUPABASE_URL is not configured`** | Keys file missing or empty | See section 1.3 |
| Backend: **`Routing: OpenRouteService failed ... using straight-line estimate`** | Routing key missing or invalid | **Not an error.** The fallback is working |
| Backend: **`OpenAI call failed, using vibe-based fallback`** | OpenAI key missing, wrong, or out of credit | Check `openai.api.key`. A `429` means the account needs credit |

**Quick health check** (all three should succeed):
```powershell
Invoke-RestMethod "http://localhost:8080/api/passport"
Invoke-RestMethod "https://ADDRESS-A.trycloudflare.com/api/passport"
Get-Content frontend\.env.local
```
- First fails: the **backend** is down.
- Second fails: **tunnel A** is down.
- Third is empty or wrong: fix **`.env.local`**.

---

## 4. Golden rules

1. **Never close or type in terminals 1-3** while people are using the app.
2. **A restarted tunnel means a new address.** Update `.env.local` or `EXPO_PACKAGER_PROXY_URL`, restart Expo with `-c`, and tell the team.
3. **Never commit** `application-local.properties` or `.env.local`.
4. **Demo from `main`:** `git checkout main` then `git pull`.
