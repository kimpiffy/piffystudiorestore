document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-prompt-widget]").forEach((widget) => {
    const endpoint = widget.dataset.promptEndpoint;
    const trigger = widget.querySelector("[data-prompt-trigger]");
    const refresh = widget.querySelector("[data-prompt-refresh]");

    if (!endpoint || !trigger || !refresh) {
      return;
    }

    const defaultLabel = trigger.textContent.trim() || "click here for a prompt";

    const setLoadingState = (isLoading) => {
      trigger.disabled = isLoading;
      refresh.disabled = isLoading;
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
        trigger.textContent = data.prompt || defaultLabel;
      } catch (error) {
        console.error(error);
        trigger.textContent = "tap refresh to try again";
      } finally {
        setLoadingState(false);
      }
    };

    trigger.addEventListener("click", loadPrompt);
    refresh.addEventListener("click", loadPrompt);
  });
});