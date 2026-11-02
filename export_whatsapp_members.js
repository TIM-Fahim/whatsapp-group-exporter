(async function exportAllWhatsAppMembers() {
    console.clear();
    console.log("%c[WhatsApp Extractor] Starting...", "color: #25D366; font-size: 16px; font-weight: bold;");

    var modal = document.querySelector('[data-testid=contacts-modal]') || 
                document.querySelector('[data-animate-modal-body=true]');
                
    if (!modal) {
        alert("Error: Please open the 'View all members' / Contacts modal first!");
        return;
    }

    // 1. Locate the true scroll container
    var scrollEl = null;
    var allDivs = modal.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
        var d = allDivs[i];
        var s = window.getComputedStyle(d);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 50) {
            scrollEl = d;
            break;
        }
    }

    if (!scrollEl) {
        // Fallback: search upward from the virtual height container
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
        scrollEl = modal.querySelector('.x1r8uery') || modal.querySelector('div[tabindex="0"]');
    }

    if (!scrollEl) {
        alert("Error: Could not locate the scrolling list inside the modal.");
        return;
    }

    // Determine estimated total members
    var tallContainer = modal.querySelector('div[style*="height:"][style*="px"]');
    var estTotal = 350;
    if (tallContainer && tallContainer.style.height) {
        var px = parseInt(tallContainer.style.height, 10);
        if (px > 0) estTotal = Math.round(px / 72);
    }
    console.log("Found scroll container:", scrollEl);
    console.log("Estimated total members to extract: ~" + estTotal);

    // Create a live on-screen status overlay
    var overlay = document.getElementById("wa-extractor-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "wa-extractor-overlay";
        overlay.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:#111b21;color:#00a884;padding:16px 22px;border-radius:10px;font-family:sans-serif;font-size:15px;box-shadow:0 4px 20px rgba(0,0,0,0.5);border:1px solid #00a884;";
        document.body.appendChild(overlay);
    }

    var membersMap = new Map();

    function collect() {
        var items = modal.querySelectorAll('div[data-testid^="list-item-"]');
        items.forEach(function(item) {
            if (item.querySelector('[data-testid=section-header]')) return;
            
            var titleEl = item.querySelector('[data-testid=cell-frame-title]');
            var secondaryEl = item.querySelector('[data-testid=cell-frame-secondary]');
            
            var titleSpan = titleEl ? titleEl.querySelector('[title]') : null;
            var title = (titleSpan ? titleSpan.getAttribute('title') : (titleEl ? titleEl.textContent : "")).trim();
            if (!title) return;

            var allText = item.innerText || item.textContent || "";
            var isAdmin = /\b(group\s+admin|admin)\b/i.test(allText);
            
            var about = "";
            if (secondaryEl) {
                about = (secondaryEl.innerText || secondaryEl.textContent || "").replace(/Add member tag/gi, "").trim();
            }

            var cleanDigits = title.replace(/\D/g, "");
            var isPhone = title.indexOf("+") === 0 || (/^[\d\s\-()]+$/.test(title) && cleanDigits.length >= 8);
            var phone = isPhone ? title : "";
            var name = isPhone ? "" : title;

            var key = title;
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

    // Scroll to the very top first
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

        // Method A: scrollIntoView on the last visible list item
        var visibleItems = modal.querySelectorAll('div[data-testid^="list-item-"]');
        if (visibleItems.length > 0) {
            var lastVisible = visibleItems[visibleItems.length - 1];
            try {
                lastVisible.scrollIntoView({ block: "end", behavior: "auto" });
            } catch(e) {
                lastVisible.scrollIntoView(false);
            }
        }

        // Method B: also manually advance scrollTop on the container
        scrollEl.scrollTop += 450;
        scrollEl.dispatchEvent(new Event("scroll", { bubbles: true }));

        // Check if reached the bottom of scrollHeight
        var isAtBottom = (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 100);
        if (isAtBottom && consecutiveNoNew >= 5) {
            console.log("Reached bottom of list and collected all available items.");
            break;
        }

        // Allow WhatsApp Web time to mount next items
        await new Promise(function(r) { setTimeout(r, 280); });
    }

    collect(); // Final sweep

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
