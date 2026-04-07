(function () {
  const typeTargets = [
    document.querySelector("[data-typewriter]"),
    document.querySelector("[data-typewriter-panel]"),
  ].filter(Boolean);

  const phrases = [
    "find us a launch partner that can ship story and search together",
    "book an agency sprint for a cinematic homepage and AI visibility",
    "who can turn one product launch into a complete motion system fast",
  ];

  function staggerReveal() {
    const items = Array.from(document.querySelectorAll("[data-reveal]"));
    items.forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add("is-visible");
      }, 120 + index * 95);
    });
  }

  function startTypewriter() {
    if (!typeTargets.length) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const phrase = phrases[phraseIndex];
      const nextText = deleting
        ? phrase.slice(0, Math.max(0, charIndex - 1))
        : phrase.slice(0, Math.min(phrase.length, charIndex + 1));

      typeTargets.forEach((target) => {
        target.textContent = nextText;
      });

      charIndex = nextText.length;

      if (!deleting && nextText.length === phrase.length) {
        deleting = true;
        window.setTimeout(tick, 1500);
        return;
      }

      if (deleting && nextText.length === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }

      const delay = deleting ? 30 : 48;
      window.setTimeout(tick, delay);
    };

    tick();
  }

  function setupBookingModal() {
    const modal = document.querySelector("[data-booking-modal]");
    if (!modal) return;

    const openButtons = Array.from(document.querySelectorAll("[data-open-booking]"));
    const closeButtons = Array.from(document.querySelectorAll("[data-close-booking]"));
    const indicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
    const panels = Array.from(document.querySelectorAll("[data-step-panel]"));
    const calendarGrid = document.querySelector("[data-calendar-grid]");
    const slotButtons = Array.from(document.querySelectorAll("[data-slot]"));
    const prevButton = document.querySelector("[data-prev-step]");
    const nextButton = document.querySelector("[data-next-step]");
    const submitButton = document.querySelector("[data-submit-booking]");
    const summary = document.querySelector("[data-booking-summary]");
    const successPanel = document.querySelector("[data-success-panel]");
    const formInputs = Array.from(document.querySelectorAll("[data-booking-input]"));

    const state = {
      step: 1,
      date: "",
      time: "",
      name: "",
      email: "",
      brief: "",
    };

    function lockScroll(locked) {
      document.body.style.overflow = locked ? "hidden" : "";
    }

    function setOpen(nextOpen) {
      modal.dataset.open = nextOpen ? "true" : "false";
      modal.setAttribute("aria-hidden", nextOpen ? "false" : "true");
      lockScroll(nextOpen);
    }

    function formatDate(date) {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(date);
    }

    function renderCalendar() {
      if (!calendarGrid) return;
      calendarGrid.innerHTML = "";

      for (let offset = 0; offset < 14; offset += 1) {
        const nextDate = new Date();
        nextDate.setHours(0, 0, 0, 0);
        nextDate.setDate(nextDate.getDate() + offset + 1);

        const value = nextDate.toISOString().slice(0, 10);
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.date = value;
        button.dataset.selected = state.date === value ? "true" : "false";
        button.innerHTML = `
          <strong>${formatDate(nextDate)}</strong>
          <span>${value}</span>
        `;

        button.addEventListener("click", () => {
          state.date = value;
          renderCalendar();
          renderSummary();
        });

        calendarGrid.appendChild(button);
      }
    }

    function renderSlots() {
      slotButtons.forEach((button) => {
        button.dataset.selected = button.dataset.slot === state.time ? "true" : "false";
      });
    }

    function renderSummary() {
      if (!summary) return;

      summary.innerHTML = `
        <p><strong>Date:</strong> ${state.date || "Not selected yet"}</p>
        <p><strong>Time:</strong> ${state.time || "Not selected yet"}</p>
        <p><strong>Name:</strong> ${state.name || "Not filled yet"}</p>
        <p><strong>Email:</strong> ${state.email || "Not filled yet"}</p>
        <p><strong>Brief:</strong> ${state.brief || "Tell us what needs to move."}</p>
      `;
    }

    function syncInputs() {
      formInputs.forEach((input) => {
        const key = input.dataset.bookingInput;
        if (!key) return;

        input.addEventListener("input", () => {
          state[key] = input.value.trim();
          renderSummary();
        });
      });
    }

    function setStep(nextStep) {
      state.step = nextStep;

      indicators.forEach((indicator) => {
        indicator.dataset.active = indicator.dataset.stepIndicator === String(nextStep) ? "true" : "false";
      });

      panels.forEach((panel) => {
        panel.hidden = panel.dataset.stepPanel !== String(nextStep);
      });

      if (successPanel) {
        successPanel.hidden = true;
      }

      if (prevButton) {
        prevButton.hidden = nextStep === 1;
      }

      if (nextButton) {
        nextButton.hidden = nextStep === 3;
      }

      if (submitButton) {
        submitButton.hidden = nextStep !== 3;
      }

      renderSummary();
    }

    function canAdvance() {
      if (state.step === 1) return Boolean(state.date);
      if (state.step === 2) return Boolean(state.time);
      return true;
    }

    function validateStep() {
      if (canAdvance()) return true;

      if (state.step === 1) {
        window.alert("Please choose a date first.");
      } else if (state.step === 2) {
        window.alert("Please choose a time slot first.");
      }

      return false;
    }

    function finishBooking() {
      if (!state.name || !state.email || !state.brief) {
        window.alert("Please fill your name, email, and a short brief.");
        return;
      }

      panels.forEach((panel) => {
        panel.hidden = true;
      });

      if (successPanel) {
        successPanel.hidden = false;
      }

      if (prevButton) prevButton.hidden = true;
      if (nextButton) nextButton.hidden = true;
      if (submitButton) {
        submitButton.hidden = true;
      }
    }

    openButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setOpen(true);
        setStep(1);
      });
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setOpen(false);
      });
    });

    slotButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.time = button.dataset.slot || "";
        renderSlots();
        renderSummary();
      });
    });

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        if (state.step > 1) {
          setStep(state.step - 1);
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (!validateStep()) return;
        setStep(Math.min(3, state.step + 1));
      });
    }

    if (submitButton) {
      submitButton.addEventListener("click", finishBooking);
    }

    indicators.forEach((indicator) => {
      indicator.addEventListener("click", () => {
        const targetStep = Number(indicator.dataset.stepIndicator || "1");
        if (targetStep > state.step && !validateStep()) return;
        setStep(targetStep);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.dataset.open === "true") {
        setOpen(false);
      }
    });

    renderCalendar();
    renderSlots();
    renderSummary();
    syncInputs();
    setStep(1);
    setOpen(false);
  }

  const init = () => {
    staggerReveal();
    startTypewriter();
    setupBookingModal();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
