export function showMessage(el, text) {
  if (!el) {
    return;
  }

  el.textContent = text;
  el.classList.remove("hidden");
}

export function hideMessage(el) {
  if (!el) {
    return;
  }

  el.textContent = "";
  el.classList.add("hidden");
}
