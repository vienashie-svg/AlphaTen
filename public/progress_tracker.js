// Checklist ng mga gawain ng turista sa website
let tourChecklist = {
    visitedHome: false,
    subscribedNewsletter: false,
    visitedFacilities: false
};

// Function para tawagin ang C++ at i-update ang dashboard UI
async function checkTourProgress() {
    // 1. Basahin kung ano na ang nagawa ng user mula sa browser memory
    tourChecklist.visitedHome = localStorage.getItem("visitedHome") === "true";
    tourChecklist.subscribedNewsletter = localStorage.getItem("subscribedNewsletter") === "true";
    tourChecklist.visitedFacilities = localStorage.getItem("visitedFacilities") === "true";

    // 2. Bilangin ang tapos na vs kabuuang gawain
    const completedCount = Object.values(tourChecklist).filter(Boolean).length;
    const totalCount = Object.keys(tourChecklist).length; 

    try {
        // 3. Ipasa sa Node.js Express at C++ Backend ang data
        const res = await fetch("/api/update-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: completedCount, total: totalCount })
        });

        const data = await res.json();

        if (data.success) {
            // 4. I-update ang Progress Box at Ring-label na nasa dashboard ninyo
            const ringLabel = document.querySelector(".ring-label");
            const progressText = document.querySelector(".progress-text h4");

            if (ringLabel) ringLabel.innerText = `${data.progress}%`;
            if (progressText) progressText.innerText = `${completedCount} of ${totalCount} Tasks Done`;
        }
    } catch (error) {
        console.error("Progress error:", error);
    }
}

// Patakbuhin kapag nag-load ang page
document.addEventListener("DOMContentLoaded", checkTourProgress);

// Mga helper functions para i-trigger mula sa iba't ibang parte ng inyong site:
function markHomeVisited() {
    localStorage.setItem("visitedHome", "true");
}

function markNewsletterSubscribed() {
    localStorage.setItem("subscribedNewsletter", "true");
    checkTourProgress(); // i-refresh ang progress agad
}

function markFacilitiesVisited() {
    localStorage.setItem("visitedFacilities", "true");
    checkTourProgress(); // i-refresh ang progress agad
}
