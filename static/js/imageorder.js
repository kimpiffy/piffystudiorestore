console.log("⚡ imageorder.js loaded");


document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("image-sort-container");

    if (!container) return;

    new Sortable(container, {
        animation: 150,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        handle: ".card-img-top",    // drag using the image
        onEnd: function () {
            let order = [];

            document.querySelectorAll(".image-sort-item").forEach((item, index) => {
                order.push({
                    id: item.dataset.id,
                    position: index
                });
            });

            fetch(window.updateImageOrderUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({ order: order })
            });
        }
    });

    // Simple cookie getter for CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
