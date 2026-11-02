# WhatsApp Group Member Extractor 🚀

A lightweight, zero-dependency browser script to extract all members (phone numbers, display names, admin roles, and bio/about status) from any WhatsApp Web group directly into a clean CSV / Excel file.

Unlike extensions or third-party paid tools, this script runs entirely within your browser's Developer Tools console. Your data never leaves your computer, ensuring complete privacy and security.

---

## ✨ Features

- **⚡ Zero Dependencies / No Installation:** No sketchy browser extensions or software to install. Works purely with native JavaScript in Developer Tools.
- **📜 Virtual Scrolling Support:** WhatsApp Web dynamically mounts and unmounts DOM nodes as you scroll (virtualized list). This script smoothly scrolls down through the entire modal, capturing every contact without missing any.
- **🏷️ Smart Field Parsing:**
  - Phone Number (for unsaved contacts)
  - Display Name / Saved Contact Label
  - Admin Role Detection (`Admin` vs `Member`)
  - "About" / Bio status
- **🖥️ Live On-Screen Progress HUD:** Floating overlay on the WhatsApp Web page showing live extraction count and progress.
- **📊 Direct CSV Export:** Automatically triggers a download of a UTF-8 BOM encoded CSV file, perfectly compatible with Microsoft Excel, Google Sheets, and CRM tools.
- **🔒 100% Client-Side & Private:** All processing happens locally in your browser memory. No data is sent to external servers or third-party APIs.

---

## 📋 How to Use

### Step 1: Open WhatsApp Web
1. Go to [web.whatsapp.com](https://web.whatsapp.com) and log in.
2. Open the group whose members you want to extract.

### Step 2: Open Group Members Modal
1. Click the group header / title at the top to open **Group Info**.
2. Scroll down to the **Members** section.
3. Click **"View all"** (or click on the member list) to open the popup modal showing all group members.
   > **Important:** Keep the "View all members" modal open on your screen before running the script.

### Step 3: Open Browser Developer Tools
- Press `F12` or `Ctrl + Shift + I` (on Windows) or `Cmd + Option + I` (on Mac).
- Navigate to the **Console** tab.

### Step 4: Run the Script
1. Copy the full code from [`export_whatsapp_members.js`](./export_whatsapp_members.js).
2. Paste it into the Console.
   > *Note: If Chrome/Edge blocks pasting with a warning about self-XSS, type `allow pasting` and press Enter first, then paste the code.*
3. Press **Enter**.

### Step 5: Wait & Download
- The script will automatically scroll through the modal, updating you with a green progress box at the top right.
- Once completed, a CSV file named `WhatsApp_Group_Members_All_<count>.csv` will automatically download to your computer.

---

## 📁 Output Data Format

The exported `.csv` file contains the following columns:

| Column | Description | Example |
| :--- | :--- | :--- |
| **SL** | Serial sequence number | `1`, `2`, `3` |
| **Phone Number** | International formatted phone number | `+1 555-123-4567` |
| **Name / Contact Label** | Saved contact name or label | `John Doe` |
| **Admin Status** | Whether the member has admin privileges | `Admin` / `Member` |
| **About / Bio** | The user's WhatsApp "About" description | `Hey there! I am using WhatsApp.` |

---

## 🛠️ How It Works Internally

1. **Modal & Container Detection:** Automatically detects WhatsApp Web's contacts dialog (`[data-testid=contacts-modal]` or `[data-animate-modal-body=true]`) and queries the active scroll container.
2. **Auto-Scroll Loop:** Iterates down the virtualized container using dual-scroll mechanics (`scrollIntoView` on visible items + dynamic `scrollTop` offsets).
3. **Deduplication:** Maintains an internal unique `Map` to prevent duplicate entries while virtual DOM nodes are mounted/unmounted during scrolling.
4. **CSV Generation & Download:** Converts the accumulated records into an RFC 4180-compliant CSV with a `\ufeff` UTF-8 Byte Order Mark (BOM) to prevent character encoding issues in Excel.

---

## ⚠️ Troubleshooting & Tips

- **"Please open the 'View all members' / Contacts modal first!"**  
  Make sure you clicked "View all" in group details so the modal containing the member list is visible before executing the script.
- **List stops scrolling prematurely:**  
  Slow down or check if your internet or WhatsApp Web is lagging. WhatsApp Web occasionally takes a few hundred milliseconds to fetch member metadata for large groups (500+ members).
- **Opening in Excel:**  
  Because the CSV includes a UTF-8 BOM, double-clicking it will open cleanly in Excel without garbling special characters or symbols.

---

## ⚖️ Disclaimer

This project is for educational and administrative purposes only (e.g., managing your own community groups, events, and educational cohorts). Please ensure you respect privacy regulations (such as GDPR) and WhatsApp's Terms of Service when handling contact information. Do not use this tool for unsolicited spam or mass marketing.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
