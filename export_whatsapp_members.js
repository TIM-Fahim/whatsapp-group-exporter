(async function exportAllWhatsAppMembers() {
    console.clear();
    console.log("%c[WhatsApp Extractor] Starting...", "color: #25D366; font-size: 16px; font-weight: bold;");

    // 1. Check for modal (large groups with "View all members")
    var modal = document.querySelector('[data-testid=contacts-modal]') || 
                document.querySelector('[data-animate-modal-body=true]');

    // 2. Check for Group Info drawer (small groups without a modal)
    var drawer = document.querySelector('[data-testid="chat-info-drawer"]') ||
                 document.querySelector('[data-testid="contact-info-drawer"]') ||
                 document.querySelector('[data-testid="drawer-right"]') ||
                 document.querySelector('aside[data-testid="chat-info-drawer"]');

    if (!drawer && !modal) {
        var panels = document.querySelectorAll('#app div[tabindex="-1"], #app [role="region"], #main ~ div');
        for (var p = 0; p < panels.length; p++) {
            var el = panels[p];
            if (el.innerText && /Group info|Group details|members|participants/i.test(el.innerText)) {
                drawer = el;
                break;
            }
        }
    }

    var targetContainer = modal || drawer;
    if (!targetContainer) {
        alert("Error: Neither 'Contacts modal' nor 'Group Info' panel was found!\n\n• For large groups: Open 'Group Info' -> click 'View all members'.\n• For small groups: Open 'Group Info' (click the group header).");
        return;
    }

    var isModalMode = !!modal;
    console.log("[WhatsApp Extractor] Mode:", isModalMode ? "Modal (Large Group)" : "Sidebar Drawer (Small Group)");

    // Locate the true scroll container
    var scrollEl = null;
    var allDivs = targetContainer.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
        var d = allDivs[i];
        var s = window.getComputedStyle(d);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 20) {
            scrollEl = d;
            break;
        }
    }

    if (!scrollEl && isModalMode) {
        var tall = modal.querySelector('div[style*="height:"][style*="px"]');
        if (tall) {
            var curr = tall.parentElement;
            while (curr && curr !== modal) {
                if (curr.scrollHeight > curr.clientHeight + 50) {
                    scrollEl = curr;
                    break;
                }
                curr = curr.parentElement;
            }
        }
    }

    if (!scrollEl) {
        scrollEl = targetContainer.querySelector('.x1r8uery') || targetContainer.querySelector('div[tabindex="0"]') || targetContainer;
    }

    // Determine estimated total members if modal
    var estTotal = isModalMode ? 350 : 20;
    if (isModalMode) {
        var tallContainer = modal.querySelector('div[style*="height:"][style*="px"]');
        if (tallContainer && tallContainer.style.height) {
            var px = parseInt(tallContainer.style.height, 10);
            if (px > 0) estTotal = Math.round(px / 72);
        }
    }

    // Create a live on-screen status overlay
    var overlay = document.getElementById("wa-extractor-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "wa-extractor-overlay";
        overlay.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:#111b21;color:#00a884;padding:16px 22px;border-radius:10px;font-family:sans-serif;font-size:15px;box-shadow:0 4px 20px rgba(0,0,0,0.5);border:1px solid #00a884;";
        document.body.appendChild(overlay);
    }

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
        var items = targetContainer.querySelectorAll('div[data-testid^="list-item-"], div[role="listitem"]');
        if (items.length === 0 && !isModalMode) {
            items = targetContainer.querySelectorAll('div[role="button"]');
        }

        items.forEach(function(item) {
            if (item.querySelector('[data-testid=section-header]')) return;
            
            var titleEl = item.querySelector('[data-testid=cell-frame-title]') ||
                          item.querySelector('span[title], div[title], h2, h3');
            if (!titleEl) return;

            var titleSpan = titleEl.querySelector('[title]');
            var title = (titleSpan ? titleSpan.getAttribute('title') : (titleEl.getAttribute('title') || titleEl.textContent || "")).trim();
            if (!title) return;

            if (ignoredTitles.has(title.toLowerCase())) return;

            var secondaryEl = item.querySelector('[data-testid=cell-frame-secondary]');
            var allText = item.innerText || item.textContent || "";
            var isAdmin = /\b(group\s+admin|admin)\b/i.test(allText);

            var cleanDigits = title.replace(/\D/g, "");
            var isPhone = title.indexOf("+") === 0 || (/^[\d\s\-()]+$/.test(title) && cleanDigits.length >= 8);
            var isYou = /\byou\b/i.test(title) || /\(you\)/i.test(allText);
            var hasAvatar = !!item.querySelector('img, [data-testid="default-user"], [data-testid="avatar"]');

            if (!isModalMode && !hasAvatar && !isPhone && !isAdmin && !isYou) {
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

    if (isModalMode) {
        // Modal mode (large groups with virtual scroll)
        scrollEl.scrollTop = 0;
        await new Promise(function(r) { setTimeout(r, 500); });
        collect();

        var consecutiveNoNew = 0;
        var lastCount = 0;
        var step = 0;

        while (consecutiveNoNew < 12) {
            step++;
            collect();

            var count = membersMap.size;
            overlay.innerHTML = "<strong>WhatsApp Extractor</strong><br>" + 
                                "Extracted: <span style='color:#fff;font-size:18px;font-weight:bold;'>" + count + "</span> / ~" + estTotal + " members<br>" +
                                "<span style='color:#8696a0;font-size:12px;'>Scrolling... please wait</span>";

            if (count > lastCount) {
                consecutiveNoNew = 0;
                lastCount = count;
            } else {
                consecutiveNoNew++;
            }

            var visibleItems = modal.querySelectorAll('div[data-testid^="list-item-"]');
            if (visibleItems.length > 0) {
                var lastVisible = visibleItems[visibleItems.length - 1];
                try {
                    lastVisible.scrollIntoView({ block: "end", behavior: "auto" });
                } catch(e) {
                    lastVisible.scrollIntoView(false);
                }
            }

            scrollEl.scrollTop += 450;
            scrollEl.dispatchEvent(new Event("scroll", { bubbles: true }));

            var isAtBottom = (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 100);
            if (isAtBottom && consecutiveNoNew >= 5) {
                break;
            }

            await new Promise(function(r) { setTimeout(r, 280); });
        }
    } else {
        // Sidebar mode (small groups)
        overlay.innerHTML = "<strong>WhatsApp Extractor</strong><br>" + 
                            "<span style='color:#8696a0;font-size:13px;'>Scanning Group Info panel...</span>";
        if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight) {
            for (var pos = 0; pos <= scrollEl.scrollHeight; pos += 250) {
                scrollEl.scrollTop = pos;
                scrollEl.dispatchEvent(new Event("scroll", { bubbles: true }));
                collect();
                await new Promise(function(r) { setTimeout(r, 150); });
            }
            scrollEl.scrollTop = 0;
        }
    }

    collect(); // Final sweep

    if (membersMap.size === 0) {
        overlay.innerHTML = "<strong style='color:#ff5f56;'>No members found</strong>";
        setTimeout(function() { if (overlay) overlay.remove(); }, 4000);
        alert("No members found. Make sure the members list or Group Info panel is visible.");
        return;
    }

    overlay.innerHTML = "<strong>WhatsApp Extractor</strong><br>" + 
                        "Done! Total: <span style='color:#fff;font-size:18px;font-weight:bold;'>" + membersMap.size + "</span> members<br>" +
                        "<span style='color:#8696a0;font-size:12px;'>Generating CSV file...</span>";

    console.log("%c[WhatsApp Extractor] Extraction complete! Total: " + membersMap.size + " members", "color: #25D366; font-size: 16px; font-weight: bold;");

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
    link.download = "WhatsApp_Group_Members_All_" + membersMap.size + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(function() {
        if (overlay) overlay.remove();
    }, 4000);

    alert("Success! Exported " + membersMap.size + " members to CSV (Excel). Check your Downloads folder!");
})();
