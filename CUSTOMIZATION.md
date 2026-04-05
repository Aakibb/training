# Customization Guide

## How to Add or Change Team Members

The default team members are: Mahi, Saimom, Moushumi

If you want to change these names or add new members, follow this guide.

---

## Option 1: Simple Approach (Keep the 3 Default Names)

If you just want to use the system with the default names, you can proceed directly!

---

## Option 2: Add More Team Members (Without Coding)

You can add more people without editing files:

1. Go to **Admin Panel**
2. Go to **Tasks** tab
3. In the **"Assign To"** field: Type any name you want (even if it's not in the dropdown)
4. They can see their tasks in **Learner Dashboard** by typing their name in the "Select Your Name" field

This works perfectly fine!

---

## Option 3: Change Team Member Names (Not Recommended for Beginners)

### If You Really Need to Change the Names:

**WARNING:** Only do this if you're comfortable editing text files!

### Step 1: Edit Admin Panel Dropdown

1. Open the folder **"d:\Training Test\public"**
2. Right-click on **admin.html**
3. Click **"Open with"** → **"Notepad"**
4. Press **Ctrl+F** to find
5. Search for: `<select id="assigned_to"`
6. Find this section:
```html
<select id="assigned_to" required>
  <option value="">-- Select Person --</option>
  <option value="Mahi">Mahi</option>
  <option value="Saimom">Saimom</option>
  <option value="Moushumi">Moushumi</option>
</select>
```

7. Change the names to your team members:
```html
<select id="assigned_to" required>
  <option value="">-- Select Person --</option>
  <option value="John">John</option>
  <option value="Sarah">Sarah</option>
  <option value="Mike">Mike</option>
</select>
```

8. Press **Ctrl+S** to save
9. Close Notepad

### Step 2: Edit Learner Dashboard Buttons

1. Right-click on **learner.html** in the **public** folder
2. Click **"Open with"** → **"Notepad"**
3. Press **Ctrl+F** to find
4. Search for: `<button class="person-btn"`
5. Find this section:
```html
<button class="person-btn" onclick="selectPerson('Mahi')">Mahi</button>
<button class="person-btn" onclick="selectPerson('Saimom')">Saimom</button>
<button class="person-btn" onclick="selectPerson('Moushumi')">Moushumi</button>
```

6. Change all names to match what you did in Step 1:
```html
<button class="person-btn" onclick="selectPerson('John')">John</button>
<button class="person-btn" onclick="selectPerson('Sarah')">Sarah</button>
<button class="person-btn" onclick="selectPerson('Mike')">Mike</button>
```

7. Press **Ctrl+S** to save
8. Close Notepad

### Step 3: Reload the Browser

1. Go back to your browser
2. Press **F5** or **Ctrl+R** to refresh
3. Done! The new names are now in effect

---

## Option 4: Delete All Data and Start Fresh

If you mess something up and want to start over:

1. Stop the application (Ctrl+C in Terminal)
2. Find the file **"training.db"** in the **"d:\Training Test"** folder
3. Delete it
4. Run the application again (double-click **START.bat**)
5. Everything will be fresh and new!

---

## FAQS

### Q: Can I have more than 3 team members?
**A:** Yes! Just add more options or buttons following the same pattern.

### Q: What if I make a mistake while editing?
**A:** 
1. Don't save the file
2. Close Notepad without saving
3. The original will still be there
4. Or delete the file and re-run the system to show the original

### Q: Will changing names delete existing tasks?
**A:** No! The tasks will still be there. But you might need to search for them since names changed.

### Q: How many team members can I add?
**A:** Unlimited! You can add 10, 20, 100 people if you want.

### Q: Can I change names after creating tasks?
**A:** Yes, but it's confusing. Better to change names before creating tasks.

---

## SAFE MODE: Not Comfortable Editing?

If you're not comfortable editing files, just:
1. Keep the default names: Mahi, Saimom, Moushumi
2. When creating tasks, use their real names in task description
3. Assign to the closest default name
4. Example: If your employee is "David", assign to "Mahi" and mention his real name in description

This works fine and causes no issues!

---

## BACKUP YOUR DATA

Before making changes, it's good to backup your data:

1. Copy the **"training.db"** file
2. Put it somewhere safe (like your Desktop)
3. If something goes wrong, you can restore from backup

To restore:
1. Stop the application
2. Delete the current **training.db**
3. Copy your backup back to the folder
4. Restart the application

---

## STILL HAVING ISSUES?

If something breaks:
1. Don't panic!
2. Stop the application
3. Delete the **training.db** file (your changes are fine)
4. Restart: double-click **START.bat**

Everything will work again, and you can try again!

---

**Remember:** The system is designed to be simple. You don't need to edit files to use it effectively! 😊
