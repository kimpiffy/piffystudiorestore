document.addEventListener("DOMContentLoaded", () => {
  const copyButton = document.querySelector(".footer-email-copy");

  if (!copyButton) {
    return;
  }

  const copyIcon = copyButton.querySelector(".footer-copy-icon");
  const emailToCopy = copyButton.dataset.copyEmail || "PIFFYINFO@GMAIL.COM";
  let iconResetTimeout;

  const setCopiedState = () => {
    if (!copyIcon) {
      return;
    }

    copyButton.classList.add("is-copied");
    copyIcon.classList.remove("fa-regular");
    copyIcon.classList.add("fa-solid");

    window.clearTimeout(iconResetTimeout);
    iconResetTimeout = window.setTimeout(() => {
      copyButton.classList.remove("is-copied");
      copyIcon.classList.remove("fa-solid");
      copyIcon.classList.add("fa-regular");
    }, 1000);
  };

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(emailToCopy);
      setCopiedState();
    } catch (error) {
      // Fallback for browsers that block the Clipboard API.
      const fallbackInput = document.createElement("input");
      fallbackInput.value = emailToCopy;
      fallbackInput.setAttribute("readonly", "");
      fallbackInput.style.position = "absolute";
      fallbackInput.style.left = "-9999px";
      document.body.appendChild(fallbackInput);
      fallbackInput.select();

      try {
        document.execCommand("copy");
        setCopiedState();
      } finally {
        fallbackInput.remove();
      }

      console.warn("Clipboard API unavailable, used fallback copy.", error);
    }
  });
});