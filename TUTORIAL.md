# Complete Training System - Step-by-Step Tutorial

## Video-like Step-by-Step Guide

This guide will walk you through every feature of the Training Management System with detailed explanations.

---

## PART 1: ADMIN SETUP (You do this)

### Step 1A: Create Your First Learning Point

**Where:** Admin Panel → Learning Points tab

**What to do:**
1. Refresh the page (Press F5 or Ctrl+R)
2. Click on the **Learning Points** tab (it's already selected)
3. In the form, fill in:
   - **Type:** Choose "Sr App" from the dropdown
   - **Task/Module Name:** Type "Basic Data Entry"
   - **Description:** Type "Learn how to enter customer information correctly"
4. Click the blue **Create Learning Point** button
5. You should see a success message!
6. Below the form, you'll see your new learning point listed

**Real Example:**
- Type: Web App
- Module Name: Website Maintenance Training
- Description: Learn to update website content, fix broken links, and manage user accounts

---

### Step 1B: Create Another Learning Point

Do the same as Step 1A, but with different information:
- Type: "Scenario Based"
- Module Name: "Customer Service Role Play"
- Description: "Practice handling difficult customer situations"

Now you have 2 learning points!

---

### Step 2A: Create a Training Session

**Where:** Admin Panel → Training Sessions tab

**What to do:**
1. Click on the **Training Sessions** tab
2. The form asks for:
   - **Select Learning Point:** Pick one from the dropdown (e.g., "Basic Data Entry")
   - **Session Date & Time:** Click the field and choose a date/time
     - For today: Just pick today's date and any time
3. Click the blue **Create Session** button
4. Below the form, you'll see your session listed

**Example:**
- Learning Point: Basic Data Entry
- Date: Today at 10:00 AM

---

### Step 2B: Add Participants to the Session

**What to do:**
1. In the Training Sessions list, find the session you just created
2. Click the **Add Participant** button
3. A popup will appear asking for a name
4. Type one of these names: **Mahi**, **Saimom**, or **Moushumi**
5. Click OK
6. The participant is now added! ✓

**Do this multiple times to add all 3 participants to the session:**
- Add Mahi
- Add Saimom
- Add Moushumi

---

### Step 3: Create Tasks for the Session

**Where:** Admin Panel → Tasks tab

**What to do:**
1. Click on the **Tasks** tab
2. Fill in the form:
   - **Select Training Session:** Pick the session you created (e.g., "Basic Data Entry - [date]")
   - **Task Name:** Type something like "Complete 50 customer records"
   - **Description:** Type "Use the data provided in the attachment"
   - **Deadline:** Pick a date that's 2-3 days from now
   - **Assign To:** Choose **Mahi** from the dropdown
   - **Attachment (Optional):** You can attach a file here if needed
3. Click the blue **Create Task** button

**Example Task 1:**
- Session: Basic Data Entry (2024-01-15 10:00)
- Task Name: Complete customer data entry
- Description: Enter all customer information from the provided list
- Deadline: 2 days from now
- Assign To: Mahi

**Create 2-3 more tasks:**
- One for Saimom
- One for Moushumi

Now you have an entire training program set up!

---

## PART 2: TEAM MEMBER VIEW (They do this)

### What Your Team Members See

**Where:** They go to http://localhost:3000/learner.html

**What they see:**
1. Three big buttons: Mahi, Saimom, Moushumi
2. Each person clicks their name
3. They see:
   - **4 cards showing:** Total Tasks, Completed, Pending, In Progress
   - **3 tabs:** All Tasks, Pending, Completed
   - **List of their tasks** with task name, module, and deadline

**When they click a task:**
- A popup (modal) shows detailed information
- Task name, description, deadline, status
- They can **update the status** (Pending → In Progress → Completed)
- If you attached a file, they can download it

---

## PART 3: ANALYTICS DASHBOARD (View Progress)

### Where:** http://localhost:3000/analytics.html

### What You'll See:

**At the Top:**
- Total training sessions completed: X
- Total tasks completed: Y
- Team members: 3
- Average completion time: Z days

**In the Middle:**
- 2 charts showing:
  1. How many tasks each person has (total and completed)
  2. Completion rate percentage for each person

**Person Cards:**
- Individual stats for Mahi, Saimom, Moushumi
- Total tasks assigned
- How many completed, pending, in progress
- Average days it took them to complete tasks

**At the Bottom:**
- A table with all tasks ever created
- Shows task name, module, who it's assigned to, deadline, status

---

## EXAMPLE SCENARIO

Let's walk through a complete example:

### Admin (You): Monday Morning
1. Create Learning Point: "Email Marketing"
2. Create Training Session: Monday 2 PM
3. Add Mahi, Saimom, Moushumi to the session
4. Create 3 tasks:
   - Task 1 (Mahi): "Create 10 email campaign templates" - Due Friday
   - Task 2 (Saimom): "Review and approve templates" - Due Friday evening
   - Task 3 (Moushumi): "Send test emails" - Due Saturday

### Team Member (Mahi): Same Day
1. Goes to Learner Dashboard
2. Clicks on "Mahi"
3. Sees: 1 pending task
4. Clicks on the task
5. Downloads the attachment if needed
6. Updates status to "In Progress"

### Admin (You): Wednesday
1. Go to Analytics
2. Check Mahi's progress - they're still "In Progress"
3. Send Mahi a message: "How's it going?"

### Team Member (Mahi): Thursday
1. Completes the task
2. In Learner Dashboard, clicks the task
3. Changes status to "Completed"
4. Task moves to "Completed" tab

### Admin (You): Friday
1. Check Analytics
2. See Mahi completed it in 3 days
3. See Saimom still working on theirs (In Progress)
4. Plan next week's training

---

## FILE ATTACHMENTS EXPLAINED

### How Attachments Work:

**Admin uploads file:**
1. When creating a task, you can click "Attachment"
2. Choose a file from your computer (Excel, PDF, Word, etc.)
3. The file is stored in the system

**Team member downloads:**
1. They see the task in their dashboard
2. Click the task to see details
3. See "Attachments" section
4. Click the attachment to download it
5. They work on it and update the task status

---

## COMMON WORKFLOWS

### Workflow 1: Weekly Training

**Monday:**
- Create 1-2 learning points for the week

**Tuesday:**
- Schedule the training sessions

**Wednesday:**
- Add all participants to the sessions

**Thursday-Friday:**
- Create tasks from what was taught
- Assign to specific people with 3-5 day deadlines

**Next Monday:**
- Check who completed tasks
- Review analytics to see who needs help
- Plan next week
- Repeat!

---

### Workflow 2: Onboarding New Employee

1. Create Learning Point: "New Employee Onboarding"
2. Create multiple sessions (Day 1, Day 2, Day 3, etc.)
3. Create tasks for each topic
4. Assign to the new employee
5. Monitor completion on Analytics
6. When 100% done, mark training complete

---

## TIPS & TRICKS

✅ **Best Practices:**
- Create one Learning Point for each topic
- Schedule sessions at realistic times
- Give reasonable deadlines (don't make them too tight)
- Review analytics weekly to see who might be struggling
- Use descriptions to explain what the task is about

❌ **Common Mistakes:**
- Don't create a Learning Point and immediately create a task
- Don't assign tasks without team members knowing about it
- Don't forget to set reasonable deadlines
- Don't assume Completed status if not confirmed

---

## KEYBOARD SHORTCUTS

| Shortcut | What it does |
|----------|-------------|
| **F5** | Refresh the page |
| **Ctrl+R** | Refresh the page |
| **Ctrl+C** (in Terminal) | Stop the application |
| **Enter** | Submit forms |
| **Escape** | Close popup windows |

---

## TROUBLESHOOTING

### Task doesn't appear in Learner view?
- ✓ Did you create the training session first?
- ✓ Did you create the task and assign it?
- ✓ Is the assignee name spelled correctly?

### Can't add participants?
- ✓ Click "Add Participant" button
- ✓ Type the exact name carefully
- ✓ Names are: Mahi, Saimom, Moushumi

### Analytics not updating?
- ✓ Refresh the page (F5)
- ✓ Close and re-open the browser
- ✓ Make sure the task status was actually saved

### File attachment won't upload?
- ✓ File size OK? (under 50 MB usually fine)
- ✓ File type OK? (Excel, PDF, Word, Image all work)
- ✓ Click "Attachment" button when creating task

---

## SUCCESS CHECKLIST

By now you should be able to:

- ✓ Create Learning Points
- ✓ Create Training Sessions
- ✓ Add Participants
- ✓ Create Tasks
- ✓ Upload Attachments
- ✓ View Learner Dashboard
- ✓ Check Analytics
- ✓ Track Completion Rates

**If you can do all of these, you're an expert!** 🎉

---

## NEXT STEPS

1. **Start small:** Create 1-2 training programs this week
2. **Get feedback:** Ask your team if it's easy to use
3. **Scale up:** Add more sessions and tasks
4. **Check progress:** Review analytics weekly
5. **Improve:** Adjust deadlines and content based on feedback

---

**Questions?** Check the README.md file or QUICK_START.md for more help!

Good luck with your training program! 🚀
