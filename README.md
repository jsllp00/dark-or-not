# Dark or Not? — setup guide

Three pages:

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Students (via the QR code) | Join with a name, vote on each poll |
| `present.html` | You, on the projector | Lobby with QR and names, start polls, timer, who answered, results |
| `edit.html` | You, before class | Write each question, upload images, set timers, edit poll 7's options |

Setup takes about 15 minutes, once.

---

## Step 1 — Create a free Firebase project

1. Go to **https://console.firebase.google.com** and sign in with a Google account.
2. Click **Create a project** (or **Add project**). Name it anything, e.g. `dark-or-not`.
3. When asked about Google Analytics, you can turn it **off**. Click **Create project**.

## Step 2 — Turn on the Realtime Database

1. In the left menu, open **Build → Realtime Database**.
2. Click **Create Database**. Pick the location closest to you (e.g. *United States*).
3. Choose **Start in locked mode** → **Enable**.
4. Open the **Rules** tab. Delete everything there, paste the full contents of `database.rules.json` from this folder, and click **Publish**.

## Step 3 — Copy your settings into `firebase-config.js`

1. Click the **gear icon** next to *Project Overview* → **Project settings**.
2. Scroll to **Your apps** and click the **web icon `</>`**.
3. Give it a nickname (e.g. `poll`). Leave *Firebase Hosting* unchecked. Click **Register app**.
4. Firebase shows a block of code containing `const firebaseConfig = { ... }`. Copy the lines **inside** the curly braces.
5. Open `firebase-config.js` in this folder and replace the `PASTE_HERE` lines with what you copied. Make sure `databaseURL` is there; if it is missing, copy it from the top of the Realtime Database page (it looks like `https://your-project-default-rtdb.firebaseio.com`).

## Step 4 — Put the files on GitHub Pages

1. Go to **https://github.com/new**. Name the repository e.g. `dark-or-not`, set it to **Public**, and click **Create repository**.
2. Click **uploading an existing file**. Drag in **all the files from this folder**, then click **Commit changes**.
3. Open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. Wait about a minute. Your site will be at `https://YOUR-USERNAME.github.io/dark-or-not/`.

Your pages:
- Students: `https://YOUR-USERNAME.github.io/dark-or-not/` (the QR code points here automatically)
- Presenter: `https://YOUR-USERNAME.github.io/dark-or-not/present.html`
- Editor: `https://YOUR-USERNAME.github.io/dark-or-not/edit.html`

## Step 5 — Fill in your polls

1. Open the **editor** page. The first time, it asks you to **create a PIN**. You'll use the same PIN on the presenter page.
2. Each poll is pre-filled with the case text; edit the question, **upload an image**, and adjust the timer (default 45 seconds).
3. Poll 7 is multiple choice, pre-filled with the closing question.
4. Click **Save all changes**.

## Step 6 — Test before class (5 minutes)

1. Open the **presenter** page on your laptop and scan the QR code with your phone.
2. Join with a name, then start Poll 1 from the laptop. Vote on your phone and watch your name get a ✓.
3. Click **Finish** to see the results, then **Back to lobby** → **Reset session** to clear the test.

---

## In class

1. Open `present.html` on the projector → students scan the QR and enter their names.
2. Choose the poll → **Start poll**. Use **+15s** if people need more time.
3. **Finish** shows the results on the projector only. Phones never show results.
4. **Start poll N** moves on. **Lobby** brings the QR code back for latecomers.
5. **Reset session** (click twice) removes everyone, for next time.

## Good to know

- Students can't change an answer once submitted, and can't submit after the timer ends (the database enforces both).
- A student who closes the page and reopens it on the same phone is still joined.
- The PIN keeps students out of the presenter and editor screens. It is a light lock, fine for a class; don't reuse an important password as the PIN.
- If you forget the PIN: in the Firebase console, open Realtime Database → Data, delete `config/pinHash`, and set a new one on the editor page.
- Free Firebase limits are far above what a class of 30 uses.
