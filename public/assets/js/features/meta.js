export async function initMetaFeature({ elements, apiFetch }) {
  if (!elements.candidateName || !elements.pmaDescription) {
    return;
  }

  try {
    const meta = await apiFetch("/api/meta");
    elements.candidateName.textContent = meta.candidateName;
    elements.pmaDescription.textContent = meta.pmaDescription;
  } catch {
    elements.candidateName.textContent = "Your Name";
    elements.pmaDescription.textContent =
      "PM Accelerator details are currently unavailable. Please ensure backend API is running.";
  }
}
