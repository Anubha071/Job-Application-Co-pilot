
const token =
    localStorage.getItem(
        "token"
    )

const draftId =
    localStorage.getItem(
        "draft_id"
    )

if (
    !token ||
    !draftId
) {

    window.location.href =
        "/static/html/dashboard.html"
}

async function loadRevisions() {

    try {

        const response =
            await fetch(

                `${API_BASE}/revisions/draft/${draftId}`,

                {

                    headers: {

                        Authorization:
                        `Bearer ${token}`
                    }
                }
            )

        const revisions =
            await response.json()

        renderRevisionList(
            revisions
        )

    }

    catch(error){

        console.error(
            error
        )
    }
}

function renderRevisionList(
    revisions
){

    const container =
        document.getElementById(
            "revisionList"
        )

    container.innerHTML = ""

    if(
        revisions.length === 0
    ){

        container.innerHTML =
            "<p>No revisions found.</p>"

        return
    }

    revisions.forEach(

        revision => {

            const item =
                document.createElement(
                    "div"
                )

            item.className =
                "revision-item"

            item.innerHTML = `

                <h3>
                    Revision
                    ${revision.id}
                </h3>

                <p>
                    Section:
                    ${revision.section}
                </p>

                <button
                    onclick="
                    compareRevision(
                    ${revision.id}
                    )"
                >
                    Compare
                </button>

            `

            container.appendChild(
                item
            )
        }
    )
}

async function compareRevision(
    revisionId
){

    const response =
        await fetch(

            `${API_BASE}/revisions/draft/${draftId}`,

            {

                headers: {

                    Authorization:
                    `Bearer ${token}`
                }
            }
        )

    const revisions =
        await response.json()

    const revision =
        revisions.find(

            r =>
            r.id === revisionId
        )

    if(
        !revision
    ){
        return
    }

    document
    .getElementById(
        "oldVersion"
    )
    .textContent =
        revision.old_text

    document
    .getElementById(
        "newVersion"
    )
    .textContent =
        revision.new_text

    renderDiff(revision.diff)
}

function renderDiff(
    diffLines
){

    const viewer =
        document.getElementById(
            "diffViewer"
        )

    viewer.innerHTML = ""

    diffLines.forEach(

        line => {

            const row =
                document.createElement(
                    "div"
                )

            row.className =
                "diff-row"

            if(
                line.startsWith("+ ")
            ){

                row.classList.add(
                    "diff-added"
                )
            }

            else if(
                line.startsWith("- ")
            ){

                row.classList.add(
                    "diff-removed"
                )
            }

            else{

                row.classList.add(
                    "diff-same"
                )
            }

            row.textContent =
                line

            viewer.appendChild(
                row
            )
        }
    )
}

// Logout
document.querySelectorAll("#logoutBtn, #logoutBtnSidebar").forEach(btn => {
    btn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("application_id");
        localStorage.removeItem("draft_id");
        window.location.href = "/static/html/login.html";
    });
});

loadRevisions()
