/* -------------------------
   GRID: feature last card
-------------------------- */
function reflowShopGrid() {
  const grid = document.querySelector("#shopGrid");
  if (!grid) return;

  const cards = [...grid.querySelectorAll(".product-card")];
  const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length || 3;

  cards.forEach((c) => c.classList.remove("is-featured"));

  const remainder = cards.length % cols;
  if (remainder === 1 && cards.length > 1) {
    cards[cards.length - 1].classList.add("is-featured");
  }
}

/* -------------------------
   LIKES: anonymous toggle
-------------------------- */
function getAnonToken() {
  const key = "anon_token_v1";
  let t = localStorage.getItem(key);
  if (!t) {
    t = crypto.randomUUID ? crypto.randomUUID() : `${Math.random()}`.slice(2) + Date.now();
    localStorage.setItem(key, t);
  }
  return t;
}

function getCSRFToken() {
  const m = document.cookie.match(/csrftoken=([^;]+)/);
  return m ? m[1] : "";
}

async function wireLikes() {
  const token = getAnonToken();
  const buttons = document.querySelectorAll(".like[data-product]");
  const csrf = getCSRFToken();

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pid = btn.dataset.product;
      if (!pid) return;

      const form = new FormData();
      form.append("anon_token", token);

      let res;
      try {
        res = await fetch(`/shop/like/${pid}/`, {
          method: "POST",
          body: form,
          headers: csrf ? { "X-CSRFToken": csrf } : {},
        });
      } catch {
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        return;
      }
      if (!res.ok || data.error) return;

      btn.classList.toggle("is-liked", !!data.liked);
      const heart = btn.querySelector(".like-heart");
      const count = btn.querySelector(".like-count");
      if (heart) heart.textContent = data.liked ? "♥" : "♡";
      if (count) count.textContent = data.count;
    });
  });
}

/* -------------------------
   INIT
-------------------------- */
window.addEventListener("load", () => {
  reflowShopGrid();
  wireLikes();
});

window.addEventListener("resize", () => {
  reflowShopGrid();
});
