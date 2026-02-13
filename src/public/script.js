function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggle = section.previousElementSibling;
    
    // Toggle open class
    if (section.classList.contains('open')) {
        section.classList.remove('open');
        toggle.classList.remove('active');
    } else {
        section.classList.add('open');
        toggle.classList.add('active');
    }
}

// Open eerste sectie by default
document.addEventListener('DOMContentLoaded', function() {
    toggleSection('standing');
});
