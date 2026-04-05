# Training Management System

A complete web-based training management system for managing team training sessions, tasks, and tracking progress.

## Features

✅ **Learning Points Management** - Create and manage learning modules  
✅ **Training Sessions** - Schedule training sessions and add participants  
✅ **Task Management** - Create tasks with deadlines and attach files  
✅ **Learner Dashboard** - Team members can view their assigned tasks  
✅ **Analytics Dashboard** - Track progress, completion rates, and performance metrics  

## Quick Start (No Coding Required!)

### Step 1: Install Node.js
1. Download Node.js from https://nodejs.org/ (Get the latest LTS version)
2. Run the installer and follow the steps
3. Click "Next" through all the default options

### Step 2: Start the Application

1. Open a Command Prompt or PowerShell in this folder (right-click → "Open PowerShell here")
2. Run this command:
```
npm install
```
(Wait for it to finish - this takes 1-2 minutes)

3. Then run:
```
npm start
```

4. You should see:
```
========================================
Training Management System is running!

Open your browser and go to:
http://localhost:3000

Admin Panel: http://localhost:3000/admin.html
Learner Dashboard: http://localhost:3000/learner.html
Analytics: http://localhost:3000/analytics.html
========================================
```

5. Open your browser and go to: **http://localhost:3000/admin.html**

## How to Use

### PHASE 1: Create Learning Points (Admin Panel)

1. Go to **Admin Panel** → **Learning Points** tab
2. Fill in the form:
   - **Type** (Required): Choose from Sr App / Manager App / Web App / Scenario Based
   - **Task/Module Name** (Required): Enter the name of what you want to train
   - **Description** (Optional): Add details about this learning point
3. Click **"Create Learning Point"**
4. View all created learning points below

**Example:**
- Type: Sr App
- Module Name: Data Entry Training
- Description: Learn how to properly enter customer data in the system

---

### PHASE 2: Create Training Sessions (Admin Panel)

1. Go to **Admin Panel** → **Training Sessions** tab
2. Choose a **Learning Point** from the dropdown
3. Select the **Session Date & Time**
4. Click **"Create Session"**
5. For each session, click **"Add Participant"** and type the person's name
   - Available: Mahi, Saimom, Moushumi
   - (You can add your own names too)

---

### PHASE 3: Create Tasks (Admin Panel)

1. Go to **Admin Panel** → **Tasks** tab
2. Fill in the form:
   - **Training Session**: Select which session this task belongs to
   - **Task Name**: Name of the task
   - **Description**: What they need to do
   - **Deadline**: When they need to complete it
   - **Assign To**: Choose who will do this task (Mahi, Saimom, or Moushumi)
   - **Attachment**: (Optional) Upload a file they need for the task
3. Click **"Create Task"**

**Example:**
- Session: Data Entry Training
- Task Name: Complete 100 customer records
- Deadline: 2 days from now
- Assign To: Mahi
- Attachment: training_data.xlsx

---

### Team Member View (Learner Dashboard)

Your team members can:

1. Go to **http://localhost:3000/learner.html**
2. Click their name (Mahi, Saimom, or Moushumi)
3. See all tasks assigned to them
4. Click on any task to see details
5. Update task status: Pending → In Progress → Completed
6. View their personal statistics

---

### Analytics Dashboard

1. Go to **http://localhost:3000/analytics.html**
2. See overall statistics:
   - Total training sessions completed
   - Total tasks assigned and completed
   - Average time to complete tasks

3. View team performance:
   - How many tasks each person completed
   - Completion rate charts
   - Individual performance stats

4. View all tasks in a table format

---

## Data Management

All your data is saved in a file called **training.db** in this folder. You don't need to do anything - it's automatic!

To delete all data and start fresh:
- Simply delete the **training.db** file and restart the app

---

## Team Members Setup

Currently, the system has 3 team members:
- **Mahi**
- **Saimom**
- **Moushumi**

### To add more team members:

This is a bit technical, but here's how:

1. Open **public/admin.html** in a text editor (Notepad)
2. Find this section:
```html
<option value="Mahi">Mahi</option>
<option value="Saimom">Saimom</option>
<option value="Moushumi">Moushumi</option>
```
3. Add a new line like:
```html
<option value="YourName">YourName</option>
```
4. Also add the same line in **public/learner.html** where you see:
```html
<button class="person-btn" onclick="selectPerson('Mahi')">Mahi</button>
```

Add:
```html
<button class="person-btn" onclick="selectPerson('YourName')">YourName</button>
```

5. Save the file and refresh your browser

---

## Troubleshooting

### "Port 3000 is already in use"
- Another app is using the same port
- Run the command: `npx kill-port 3000` or restart your computer

### "npm command not found"
- Node.js is not installed properly
- Restart your computer after installing Node.js

### Tasks not showing up?
- Make sure you created a training session first
- Then select that session when creating tasks

### Can't open the website?
- Make sure the Terminal shows "Training Management System is running!"
- Try: http://localhost:3000 in your browser
- Check that the Terminal is still running (don't close it)

---

## File Structure

```
Training Test/
├── package.json            (Settings file)
├── server.js              (Main program)
├── training.db            (Your data - created automatically)
├── uploads/               (Files uploaded for tasks)
└── public/
    ├── admin.html         (Admin panel)
    ├── learner.html       (Team member view)
    ├── analytics.html     (Dashboard statistics)
    ├── admin.js           (Admin panel logic)
    ├── learner.js         (Learner dashboard logic)
    ├── analytics.js       (Analytics logic)
    └── styles.css         (Design and colors)
```

---

## Support

If something doesn't work:
1. Close the Terminal (Ctrl+C)
2. Delete the **training.db** file
3. Run `npm install` again
4. Run `npm start` again
5. Go to http://localhost:3000

This usually fixes most issues!

---

**Created with ❤️ for easy team training management**
