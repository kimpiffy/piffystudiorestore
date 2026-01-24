// static/js/about/config.js

export const ROUTES = {
  digital: "/digital/",
  work: "/art/",
  installations: "/installations/",
  contact: "/contact/",
  cv: "/static/files/cv.pdf"
};

export const BIO_TEXT = `I work with a vivid palette, light-responsive materials, and layered media, creating work that ranges from conceptual fine art and immersive installations to interactive web design.

I am passionate about exploring the intersection of art and technology, and I strive to create experiences that engage and inspire audiences.

To learn more about my work click on the buttons below. You can reach out via the contact page if you'd like to collaborate or learn more.`;

export const PORTRAITS = [
  "/static/img/about/biocover.png",
  "/static/img/about/portrait1.JPG",
];

export const ITEMS = [
  { key: "bio", label: "bio", kind: "bio" },
  { key: "art", label: "art", kind: "link", routeKey: "art", desc: "Studio work + fine art." },
  { key: "digital", label: "digital", kind: "link", routeKey: "digital", desc: "Interactive web + creative code." },
  { key: "community", label: "community", kind: "link", routeKey: "community", desc: "Installations + community projects." }
];


// Portrait image fit mode
// - "slice" = fills blob, crops (no gaps)
// - "meet"  = no crop, may show gaps
export const PORTRAIT_FIT = "xMidYMid slice";

// Motion tuning
export const MOTION = {
  portrait: {
    noiseStrength: 0.008,
    damping: 0.95,
    maxSpeed: 0.22,
    bound: 10
  },
  words: {
    desktop: { spring: 0.018, noise: 0.0022, damping: 0.91, maxSpeed: 0.12, repelDist: 78, repelStrength: 0.016 },
    mobile:  { spring: 0.016, noise: 0.0016, damping: 0.93, maxSpeed: 0.10, repelDist: 62, repelStrength: 0.012 }
  },
  wobble: {
    baseFrequency: "0.009;0.011;0.009",
    duration: "8s",
    scale: "10",
  }
};
