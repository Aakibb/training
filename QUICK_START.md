# Quick Start Guide

## For the Absolute Beginner (No Coding Knowledge Required!)

### ONE-TIME SETUP (5 minutes)

#### Step 1: Install Node.js (Only do this ONCE)

1. Go to https://nodejs.org/
2. Click the big green **"LTS"** button to download
3. Open the downloaded file and run the installer
4. Click **"Next"** on all screens
5. At the end, click **"Install"** and wait
6. Click **"Finish"**
7. **Restart your computer**

That's it! You only need to do this once.

---

### STARTING THE APPLICATION (Every time you want to use it)

#### Method 1: Easy Way (Recommended! 👍)

1. In the **"Training Test"** folder, look for **"START.bat"**
2. **Double-click it**
3. Wait for it to finish (first time takes 1-2 minutes)
4. Your browser should open automatically
5. If not, open your browser and go to: **http://localhost:3000**
6. Done! 🎉

---

#### Method 2: Manual Way (If Method 1 doesn't work)

1. Open **PowerShell** or **Command Prompt** in the "Training Test" folder
   - Right-click in the folder → "Open PowerShell here"

2. Type this command:
   ```
   npm install
   ```
   - Press Enter
   - Wait for it to finish (1-2 minutes, only needed the first time)

3. Type this command:
   ```
   npm start
   ```
   - Press Enter
   - You should see this message:
   ```
   Training Management System is running!
   Open your browser and go to:
   http://localhost:3000
   ```

4. Open your browser and go to: **http://localhost:3000**

5. To stop the application later: Press **Ctrl + C** in the Terminal

---

## Now You're Ready!

Once the application is running:

1. **First time?** Click **"Go to Admin Panel"**
2. Start by creating a **Learning Point**
3. Then create a **Training Session**
4. Create some **Tasks**
5. Team members can view tasks by clicking **"Go to Learner Dashboard"**
6. Track everything in **"View Analytics"**

---

## Common Issues

| Problem | Solution |
|---------|----------|
| **"npm command not found"** | Restart your computer after installing Node.js |
| **"Port 3000 is already in use"** | Close other applications or restart your computer |
| **Black screen appears then closes** | This means Node.js isn't installed. Follow Step 1 again |
| **Browser won't open** | Manually go to http://localhost:3000 |
| **Data disappeared** | Check if training.db file still exists in the folder |

---

## To RESTART the Application

1. Close the Terminal window (or press Ctrl+C)
2. Double-click **START.bat** again

---

## To Add More Team Members

**Option A: Without touching code**
- Just type any name when creating tasks
- In the Learner Dashboard, team members can click their name to select

**Option B: Add to buttons (a bit technical)**
1. Open **public\admin.html** with Notepad
2. Find: `<option value="Moushumi">Moushumi</option>`
3. Add below it: `<option value="YourName">YourName</option>`
4. Do the same in **public\learner.html**
5. Save and refresh the browser

---

## Keyboard Shortcuts

- **Ctrl + C** = Stop the application
- **Ctrl + R** = Refresh the browser
- **Ctrl + Shift + Delete** = Clear browser cache (if things look broken)

---

**You're all set! Happy training! 🚀**

For more details, read the full **README.md** file.
