document.addEventListener("DOMContentLoaded", () => {
  const footer = document.querySelector(".site-footer");
  const toggle = footer?.querySelector(".footer-peek-toggle");
  const badgeCloseZone = footer?.querySelector(".footer-badge-col");
  const isPhone = window.matchMedia("(max-width: 767.98px)");
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)");
  let collapseTimeout;

  const isTouchMobileFooter = () => isPhone.matches && isTouch.matches;

  const syncTouchModeClass = () => {
    if (!footer) {
      return;
    }

    footer.classList.toggle("is-touch-mobile", isTouchMobileFooter());
  };

  const syncMobileScroll = () => {
    if (!footer) {
      return;
    }

    const shouldUnlock = isPhone.matches && footer.classList.contains("is-open");
    document.body.classList.toggle("footer-scroll-unlocked", shouldUnlock);
  };

  const setFooterOpen = (isOpen) => {
    if (!footer) {
      return;
    }

    footer.classList.toggle("is-open", isOpen);
    if (toggle) {
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
    syncMobileScroll();
  };

  syncTouchModeClass();

  if (footer) {
    footer.addEventListener("mouseenter", () => {
      if (!isPhone.matches) {
        clearTimeout(collapseTimeout);
        setFooterOpen(true);
      }
    });

    footer.addEventListener("mouseleave", () => {
      if (!isPhone.matches) {
        collapseTimeout = setTimeout(() => {
          setFooterOpen(false);
        }, 300);
      }
    });

    footer.addEventListener("focusin", () => setFooterOpen(true));
    footer.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!footer.contains(document.activeElement)) {
          setFooterOpen(false);
        }
      });
    });

    document.addEventListener("pointerdown", (event) => {
      const isToggleButton = event.target === toggle || toggle?.contains(event.target);
      if (!footer.contains(event.target) || (isPhone.matches && isToggleButton)) {
        if (!isToggleButton) {
          setFooterOpen(false);
        }
      }
    });
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = !footer.classList.contains("is-open");
      setFooterOpen(next);
    });
  }

  if (badgeCloseZone) {
    badgeCloseZone.addEventListener("click", () => {
      if (isTouchMobileFooter() && footer?.classList.contains("is-open")) {
        setFooterOpen(false);
      }
    });
  }

  isPhone.addEventListener("change", syncMobileScroll);
  isPhone.addEventListener("change", syncTouchModeClass);
  isTouch.addEventListener("change", syncTouchModeClass);

  document.querySelectorAll("[data-prompt-widget]").forEach((widget) => {
    const endpoint = widget.dataset.promptEndpoint;
    const trigger = widget.querySelector("[data-prompt-trigger]");

    if (!endpoint || !trigger) {
      return;
    }

    const defaultLabel =
      trigger.textContent.trim() ||
      "Need some inspiration? Click here to generate a prompt";
    const iconMarkup =
      '<span class="footer-inline-refresh" aria-hidden="true">' +
      '<i class="fa-solid fa-rotate-right"></i>' +
      "</span>";
    let hasPrompt = false;

    const setLoadingState = (isLoading) => {
      trigger.disabled = isLoading;
      widget.setAttribute("aria-busy", isLoading ? "true" : "false");
    };

    const loadPrompt = async () => {
      setLoadingState(true);
      trigger.textContent = "generating...";

      try {
        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Prompt request failed with ${response.status}`);
        }

        const data = await response.json();
        const promptText = (data.prompt || defaultLabel).trim();
        hasPrompt = true;
        trigger.classList.add("has-result");
        trigger.innerHTML = `${promptText} ${iconMarkup}`;
      } catch (error) {
        console.error(error);
        if (hasPrompt) {
          trigger.innerHTML = `tap refresh to try again ${iconMarkup}`;
        } else {
          trigger.textContent = "tap refresh to try again";
        }
      } finally {
        setLoadingState(false);
      }
    };

    trigger.addEventListener("click", loadPrompt);
  });
});