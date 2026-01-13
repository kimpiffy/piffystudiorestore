document.addEventListener("DOMContentLoaded", () => {
  const deck = document.getElementById("deck");
  if (!deck) return;

  const cards = Array.from(deck.querySelectorAll(".card"));
  const N = cards.length;
  if (N < 2) return;

  // Higher index = above (like a real stack you’re collecting)
  cards.forEach((c, i) => (c.style.zIndex = 1000 + i));

  // How much of the next card you want to peek (paper tip)
  const PEEK = 80; // px (tune)

  // Each "step" is one viewport worth of scroll
  const step = () => window.innerHeight;
  const total = () => step() * N;

  // Make the page scroll long enough
  const setBodyHeight = () => {
    document.body.style.height = `${total()}px`;
  };
  setBodyHeight();
  window.addEventListener("resize", setBodyHeight);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function render() {
    const y = window.scrollY;
    const s = step();

    // For each card, compute how far it should be pushed up
    // Card i starts moving up when you pass i*s
    cards.forEach((card, i) => {
      const start = i * s;
      const progress = clamp((y - start) / s, 0, 1);

      // Move card up so next one can slide over it
      // At progress=1, it's moved up by (s - PEEK) so a "tip" remains
      const translate = -progress * (s - PEEK);
      card.style.transform = `translateY(${translate}px)`;
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
});
