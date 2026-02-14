function hasRecordsDom(elements) {
  return Boolean(
    elements.recordForm &&
      elements.recordLocationInput &&
      elements.recordStartDateInput &&
      elements.recordEndDateInput &&
      elements.recordsBody,
  );
}

function setDefaultDates(elements) {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 4);
  const end = endDate.toISOString().slice(0, 10);

  elements.recordStartDateInput.value = start;
  elements.recordEndDateInput.value = end;
}

function setRecordFormMode(elements, record = null) {
  if (!record) {
    elements.recordIdInput.value = "";
    elements.saveRecordBtn.textContent = "Create Record";
    elements.cancelEditBtn?.classList.add("hidden");
    return;
  }

  elements.recordIdInput.value = String(record.id);
  elements.recordLocationInput.value = record.locationQuery;
  elements.recordStartDateInput.value = record.startDate;
  elements.recordEndDateInput.value = record.endDate;
  elements.saveRecordBtn.textContent = `Update Record #${record.id}`;
  elements.cancelEditBtn?.classList.remove("hidden");
}

function renderRecords(elements, records, escapeHtml) {
  if (!records.length) {
    elements.recordsBody.innerHTML =
      '<tr><td colspan="5">No records yet. Create one with the form above.</td></tr>';
    return;
  }

  elements.recordsBody.innerHTML = records
    .map(
      (record) => `
      <tr>
        <td>${record.id}</td>
        <td>${escapeHtml(record.locationName)}</td>
        <td>${escapeHtml(record.startDate)} to ${escapeHtml(record.endDate)}</td>
        <td>${escapeHtml(record.temperaturePayload?.summary?.overallMinC ?? "-")} / ${escapeHtml(record.temperaturePayload?.summary?.overallMaxC ?? "-")}</td>
        <td>
          <button class="btn-secondary row-action" data-action="view" data-id="${record.id}" type="button">View</button>
          <button class="btn-secondary row-action" data-action="edit" data-id="${record.id}" type="button">Edit</button>
          <button class="btn-secondary row-action" data-action="delete" data-id="${record.id}" type="button">Delete</button>
        </td>
      </tr>
    `,
    )
    .join("");
}

export function initRecordsFeature({ elements, apiFetch, showMessage, hideMessage, escapeHtml }) {
  if (!hasRecordsDom(elements)) {
    return;
  }

  let recordsCache = [];

  async function loadRecords() {
    try {
      const records = await apiFetch("/api/records?limit=200");
      recordsCache = records;
      renderRecords(elements, records, escapeHtml);
    } catch (error) {
      showMessage(elements.recordError, error.message);
    }
  }

  elements.recordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage(elements.recordError);
    hideMessage(elements.recordSuccess);

    const payload = {
      location: elements.recordLocationInput.value.trim(),
      startDate: elements.recordStartDateInput.value,
      endDate: elements.recordEndDateInput.value,
    };

    if (!payload.location || !payload.startDate || !payload.endDate) {
      showMessage(elements.recordError, "Location, start date, and end date are required.");
      return;
    }

    try {
      const id = elements.recordIdInput.value.trim();
      if (id) {
        await apiFetch(`/api/records/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showMessage(elements.recordSuccess, `Record #${id} updated.`);
      } else {
        const created = await apiFetch("/api/records", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showMessage(elements.recordSuccess, `Record #${created.id} created.`);
      }

      setRecordFormMode(elements, null);
      elements.recordForm.reset();
      setDefaultDates(elements);
      await loadRecords();
    } catch (error) {
      showMessage(elements.recordError, error.message);
    }
  });

  elements.cancelEditBtn?.addEventListener("click", () => {
    setRecordFormMode(elements, null);
    hideMessage(elements.recordError);
    hideMessage(elements.recordSuccess);
    elements.recordForm.reset();
    setDefaultDates(elements);
  });

  elements.recordsBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button.row-action");
    if (!button) {
      return;
    }

    hideMessage(elements.recordError);
    hideMessage(elements.recordSuccess);

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const selected = recordsCache.find((record) => record.id === id);
    if (!selected) {
      showMessage(elements.recordError, "Record not found in cache. Reloading...");
      await loadRecords();
      return;
    }

    if (action === "view") {
      if (elements.recordDetails) {
        elements.recordDetails.textContent = JSON.stringify(selected, null, 2);
      }
      return;
    }

    if (action === "edit") {
      setRecordFormMode(elements, selected);
      if (elements.recordDetails) {
        elements.recordDetails.textContent = JSON.stringify(selected.temperaturePayload, null, 2);
      }
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(`Delete record #${id}?`);
      if (!confirmed) {
        return;
      }

      try {
        await apiFetch(`/api/records/${id}`, { method: "DELETE" });

        if (elements.recordIdInput.value === String(id)) {
          setRecordFormMode(elements, null);
          elements.recordForm.reset();
          setDefaultDates(elements);
        }

        if (elements.recordDetails) {
          elements.recordDetails.textContent = `Record #${id} deleted.`;
        }
        showMessage(elements.recordSuccess, `Record #${id} deleted.`);
        await loadRecords();
      } catch (error) {
        showMessage(elements.recordError, error.message);
      }
    }
  });

  elements.exportButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const format = button.dataset.format;
      window.open(`/api/records/export?format=${encodeURIComponent(format)}`, "_blank");
    });
  });

  setDefaultDates(elements);
  setRecordFormMode(elements, null);
  void loadRecords();
}
