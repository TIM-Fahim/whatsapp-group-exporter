(async function exportSmallGroupMembers() {
    console.clear();
    console.log("%c[WhatsApp Small Group Extractor] Starting...", "color: #25D366; font-size: 16px; font-weight: bold;");

    // 1. Locate the Group Info drawer / sidebar or contacts modal
    var drawer = document.querySelector('[data-testid="chat-info-drawer"]') ||
                 document.querySelector('[data-testid="contact-info-drawer"]') ||
                 document.querySelector('[data-testid="drawer-right"]') ||
                 document.querySelector('aside[data-testid="chat-info-drawer"]');

    // Fallback: look for right side panel if specific testid changed
    if (!drawer) {
        var panels = document.querySelectorAll('#app div[tabindex="-1"], #app [role="region"], #main ~ div');
        for (var p = 0; p < panels.length; p++) {
            var el = panels[p];
            if (el.innerText && /Group info|Group details|members|participants/i.test(el.innerText)) {
                drawer = el;
                break;
            }
        }
    }

    // Also support if user happens to have the modal open
    var modal = document.querySelector('[data-testid=contacts-modal]') || 
                document.querySelector('[data-animate-modal-body=true]');
    var container = modal || drawer;

    if (!container) {
        alert("Error: Please open the 'Group Info' side panel first!\n\nClick the group name/header at the top of the chat so the right sidebar opens.");
        return;
    }

    // 2. Identify scroll container within the drawer (if the group has 8-15 members and needs scrolling)
    var scrollEl = null;
    var allDivs = container.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
        var d = allDivs[i];
        var s = window.getComputedStyle(d);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 20) {
            scrollEl = d;
            break;
        }
    }
    if (!scrollEl) {
        scrollEl = container;
    }

    // 3. Create on-screen status overlay
    var overlay = document.getElementById("wa-extractor-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "wa-extractor-overlay";
        overlay.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:#111b21;color:#00a884;padding:16px 22px;border-radius:10px;font-family:sans-serif;font-size:15px;box-shadow:0 4px 20px rgba(0,0,0,0.5);border:1px solid #00a884;";
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = "<strong>WhatsApp Small Group Extractor</strong><br>" +
                        "<span style='color:#8696a0;font-size:13px;'>Scanning Group Info panel...</span>";

    // Blacklist non-member action titles inside Group Info
    var ignoredTitles = new Set([
        "add member", "add members", "invite to group via link", 
        "exit group", "report group", "disappearing messages", 
        "group permissions", "media, links and docs", "media, links, and docs",
        "starred messages", "mute notifications", "custom notifications", 
        "encryption", "chat lock", "add to favorites", "clear chat", 
        "delete group", "search", "group settings", "leave group"
    ]);

    var membersMap = new Map();

    function collect() {
        // Find all list item containers inside the panel
        var items = container.querySelectorAll('div[data-testid^="list-item-"], div[role="listitem"], div[role="button"]');
        
        items.forEach(function(item) {
            // Ignore section headers
            if (item.querySelector('[data-testid=section-header]')) return;

            var titleEl = item.querySelector('[data-testid=cell-frame-title]');
            if (!titleEl) {
                // Fallback for drawer layout
                titleEl = item.querySelector('span[title], div[title], h2, h3');
            }
            if (!titleEl) return;

            var titleSpan = titleEl.querySelector('[title]');
            var title = (titleSpan ? titleSpan.getAttribute('title') : (titleEl.getAttribute('title') || titleEl.textContent || "")).trim();
            if (!title) return;

            // Ignore action rows like "Add member", "Exit group"
            if (ignoredTitles.has(title.toLowerCase())) return;

            var secondaryEl = item.querySelector('[data-testid=cell-frame-secondary]');
            var allText = item.innerText || item.textContent || "";

            // Check if this row is actually a person/member
            var hasAvatar = !!item.querySelector('img, [data-testid="default-user"], [data-testid="avatar"]');
            var isAdmin = /\b(group\s+admin|admin)\b/i.test(allText);
            var isYou = /\byou\b/i.test(title) || /\(you\)/i.test(allText);
            var cleanDigits = title.replace(/\D/g, "");
            var isPhone = title.indexOf("+") === 0 || (/^[\d\s\-()]+$/.test(title) && cleanDigits.length >= 8);

            // Row must be a recognized participant
            if (!hasAvatar && !isPhone && !isAdmin && !isYou) {
                return;
            }

            var about = "";
            if (secondaryEl) {
                about = (secondaryEl.innerText || secondaryEl.textContent || "").replace(/Add member tag/gi, "").trim();
            }

            var phone = isPhone ? title : "";
            var name = isPhone ? "" : title;

            var key = phone || name || title;
            if (!membersMap.has(key)) {
                membersMap.set(key, {
                    phone: phone,
                    name: name,
                    role: isAdmin ? "Admin" : "Member",
                    about: about
                });
            } else if (isAdmin) {
                membersMap.get(key).role = "Admin";
            }
        });
    }

    // Scroll through the drawer to ensure all rendered members are captured
    if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
        var maxScroll = scrollEl.scrollHeight;
        for (var pos = 0; pos <= maxScroll; pos += 300) {
            scrollEl.scrollTop = pos;
            scrollEl.dispatchEvent(new Event("scroll", { bubbles: true }));
            collect();
            await new Promise(function(r) { setTimeout(r, 180); });
        }
        // Scroll back to top
        scrollEl.scrollTop = 0;
        await new Promise(function(r) { setTimeout(r, 200); });
    }

    // Final sweep
    collect();

    if (membersMap.size === 0) {
        overlay.innerHTML = "<strong style='color:#ff5f56;'>No members found</strong><br>" +
                            "<span style='color:#8696a0;font-size:12px;'>Make sure the Group Info panel is visible on the right.</span>";
        setTimeout(function() { if (overlay) overlay.remove(); }, 4000);
        alert("Could not detect group members in the side panel.\n\nPlease ensure the Group Info panel is opened on the right side of the screen!");
        return;
    }

    overlay.innerHTML = "<strong>WhatsApp Small Group Extractor</strong><br>" + 
                        "Done! Total: <span style='color:#fff;font-size:18px;font-weight:bold;'>" + membersMap.size + "</span> members<br>" +
                        "<span style='color:#8696a0;font-size:12px;'>Generating CSV file...</span>";

    console.log("%c[WhatsApp Extractor] Successfully extracted " + membersMap.size + " members!", "color: #25D366; font-size: 16px; font-weight: bold;");

    // Generate CSV
    var csvRows = [];
    csvRows.push(["SL", "Phone Number", "Name / Contact Label", "Admin Status", "About / Bio"]);

    var idx = 1;
    membersMap.forEach(function(m) {
        csvRows.push([
            idx,
            m.phone ? m.phone : "Not displayed (Saved Contact)",
            m.name ? m.name : "Unsaved Contact",
            m.role,
            m.about ? m.about : "-"
        ]);
        idx++;
    });

    var csvContent = "\ufeff" + csvRows.map(function(row) {
        return row.map(function(val) {
            var str = String(val == null ? "" : val);
            return '"' + str.replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\r\n");

    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "WhatsApp_Small_Group_Members_" + membersMap.size + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(function() {
        if (overlay) overlay.remove();
    }, 4000);

    alert("Success! Exported " + membersMap.size + " group members to CSV (Excel). Check your Downloads folder!");
})();
