document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options (keep the default placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participantsHtml =
          details.participants && details.participants.length > 0
            ? `<ul class="participants-list">${details.participants
                .map((p) => `<li><span class="participant-email">${p}</span><button class="btn-unregister" data-activity="${encodeURIComponent(
                  name
                )}" data-email="${encodeURIComponent(p)}" title="Unregister">🗑️</button></li>`)
                .join("")}</ul>`
            : `<p class="no-participants">No participants yet.</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Attach click handlers for unregister buttons inside this activity card
          activityCard.querySelectorAll('.btn-unregister').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              const activityEncoded = btn.getAttribute('data-activity');
              const emailEncoded = btn.getAttribute('data-email');

              // Decode for display / internal usage
              const activityName = decodeURIComponent(activityEncoded);
              const email = decodeURIComponent(emailEncoded);

              if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE' }
                );

                const result = await resp.json();

                if (resp.ok) {
                  // Remove the participant element from the DOM
                  const li = btn.closest('li');
                  if (li) li.remove();

                  // Re-fetch to keep UI in sync (updates availability, etc.)
                  fetchActivities();
                } else {
                  alert(result.detail || 'Failed to unregister participant');
                }
              } catch (err) {
                console.error('Error unregistering participant:', err);
                alert('Error unregistering participant. See console for details.');
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly signed-up participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
