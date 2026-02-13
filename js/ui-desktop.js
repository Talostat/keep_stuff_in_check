
// Desktop UI components can be initialized here if needed
console.log('Desktop UI loaded. Default behavior active.');

// Example: If we wanted to add keyboard shortcuts specific to desktop
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save if in form
    if (e.ctrlKey && e.key === 's') {
        if (document.querySelector('.form-container:not([hidden])')) {
            e.preventDefault();
            const submitBtn = document.querySelector('#dataForm button[type="submit"]');
            if (submitBtn) submitBtn.click();
        }
    }
});
