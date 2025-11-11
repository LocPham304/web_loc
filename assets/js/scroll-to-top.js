// Scroll to Top Button
(function () {
  // Create button element
  const scrollBtn = document.createElement("button");
  scrollBtn.className = "scroll-to-top";
  scrollBtn.setAttribute("aria-label", "Scroll to top");
  scrollBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
  document.body.appendChild(scrollBtn);

  // Show/hide button based on scroll position
  function toggleScrollButton() {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  }

  // Scroll to top smoothly
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Event listeners
  window.addEventListener("scroll", toggleScrollButton);
  scrollBtn.addEventListener("click", scrollToTop);

  // Initial check
  toggleScrollButton();
})();
