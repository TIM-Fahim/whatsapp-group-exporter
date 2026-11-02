# WhatsApp Group Member Extractor 🚀

A lightweight, zero-dependency browser script collection to extract all members (phone numbers, display names, admin roles, and bio/about status) from any WhatsApp Web group directly into a clean CSV / Excel file.

Unlike extensions or third-party paid tools, these scripts run entirely within your browser's Developer Tools console. Your data never leaves your computer, ensuring complete privacy and security.

---

## 📦 Included Scripts

| Script | Best Used For | Mode of Operation |
| :--- | :--- | :--- |
| **[`export_whatsapp_members.js`](./export_whatsapp_members.js)** | **Large & Standard Groups** | Extracts from the **"View all members"** modal with high-performance virtual auto-scrolling (supports hundreds or thousands of contacts). Also auto-falls back to sidebar if no modal exists. |
| **[`export_small_group_members.js`](./export_small_group_members.js)** | **Small Groups (< 10-15 members)** | Specifically designed for groups where WhatsApp Web **does not show** a "View all" button. Extracts members directly from the **Group Info side panel**. |

---

## ✨ Features

- **⚡ Zero Dependencies / No Installation:** No sketchy browser extensions or external software. Works purely with native JavaScript in Developer Tools.
- **📜 Virtual Scrolling Support:** Handles WhatsApp Web's dynamic DOM unmounting smoothly without skipping contacts.
- **🏷️ Smart Field Parsing:**
  - Phone Number (for unsaved contacts)
  - Display Name / Saved Contact Label
  - Admin Role Detection (`Admin` vs `Member`)
  - "About" / Bio status
- **🖥️ Live On-Screen Progress HUD:** Floating overlay on the WhatsApp Web page showing live extraction count and progress.
- **📊 Direct CSV Export:** Automatically triggers a download of a UTF-8 BOM encoded CSV file, directly compatible with Microsoft Excel, Google Sheets, and CRM tools.
- **🔒 100% Client-Side & Private:** All processing happens locally in your browser memory. No data is sent to external servers or third-party APIs.

---

## 📋 How to Use

### Option A: For Large / Standard Groups (with "View all" modal)
1. Open [web.whatsapp.com](https://web.whatsapp.com) and click on the group.
2. Click the group header / title at the top to open **Group Info**.
3. Scroll down to the **Members** section and click **"View all"** to open the member popup modal.
4. Press `F12` (or right-click anywhere -> **Inspect**) and go to the **Console** tab.
5. Copy the code from [`export_whatsapp_members.js`](./export_whatsapp_members.js), paste it into the Console, and press **Enter**.
6. The script will auto-scroll through the entire modal and download your CSV.

---

### Option B: For Small Groups (No "View all" modal)
When a group only has a few members (usually under ~10–15), WhatsApp Web displays all members directly in the sidebar drawer and hides the "View all" button.

1. Open [web.whatsapp.com](https://web.whatsapp.com) and click on the group.
2. Click the group header / title at the top to open the **Group Info** right sidebar.
3. Press `F12` and open the **Console** tab.
4. Copy the code from [`export_small_group_members.js`](./export_small_group_members.js), paste it into the Console, and press **Enter**.
5. It will scan the Group Info panel, collect all members, and automatically download the CSV.

> *Note: If Chrome/Edge blocks pasting with a warning about self-XSS, type `allow pasting` and press Enter first, then paste the script.*

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

1. **DOM Container Detection:** Detects whether the active view is the popup contacts dialog (`[data-testid=contacts-modal]`) or the side drawer (`[data-testid=chat-info-drawer]`).
2. **Auto-Scroll & Render Loop:** Advances the scroll container while dispatching scroll events to trigger WhatsApp Web's component rendering.
3. **Deduplication:** Maintains an internal unique `Map` to prevent duplicate entries while elements are mounted and unmounted.
4. **CSV Generation & Download:** Converts records into an RFC 4180-compliant CSV with a `\ufeff` UTF-8 Byte Order Mark (BOM) to guarantee correct character display in Microsoft Excel.

---

## ⚠️ Troubleshooting & Tips

- **"Please open the 'View all members' / Contacts modal first!"**  
  If the group is large, make sure you clicked "View all" in group details so the modal is open. If it's a small group without a "View all" button, use `export_small_group_members.js`.
- **Opening in Excel:**  
  Because the CSV includes a UTF-8 BOM, double-clicking it will open cleanly in Excel without garbling international characters or phone number formatting.

---

## ⚖️ Disclaimer

This project is for educational and administrative purposes only (e.g., managing your own community groups, events, and educational cohorts). Please ensure you respect privacy regulations (such as GDPR) and WhatsApp's Terms of Service when handling contact information. Do not use this tool for unsolicited spam or mass marketing.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
