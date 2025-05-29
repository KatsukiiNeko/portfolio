/**
 * Main JavaScript file for Portfolio Website
 * Handles theme toggler, mobile navigation, project filtering, 
 * dynamic content loading, and other interactive elements
 */

// DOM elements
const navToggle = document.getElementById('navToggle');
const navMenu = document.querySelector('.nav-menu');
const themeToggle = document.getElementById('themeToggle');
const projectsGrid = document.getElementById('projectsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const backToTop = document.getElementById('backToTop');
const currentYear = document.getElementById('currentYear');
const contactForm = document.getElementById('contactForm');

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the portfolio
    initThemeToggle();
    initMobileNav();
    initBackToTop();
    loadProjects();
    setCurrentYear();
    initSkillAnimations();
    
    // Create the image modal element
    createImageModal();
    
    // Form submission handling
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        emailjs.sendForm('service_lcetdnh', 'template_uvhng6k', contactForm)
            .then(() => {
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            contactForm.innerHTML = `
                <div class="form-success">
                <i class="fas fa-check-circle"></i>
                <h3>Message Sent!</h3>
                <p>Thank you for your message, ${data.name}. I'll get back to you soon!</p>
                </div>
            `;
            })
            .catch((error) => {
            console.error('EmailJS error:', error);
            alert('Failed to send message. Please try again later.');
            });
        });
    }
});

// Set Current Year in Footer
function setCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// Theme Toggle
function initThemeToggle() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme');
        
        // Save theme preference to local storage
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
    });
}

// Mobile Navigation
function initMobileNav() {
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        
        // Animate hamburger menu
        const spans = navToggle.querySelectorAll('span');
        spans.forEach(span => span.classList.toggle('active'));
        
        // Toggle aria-expanded for accessibility
        const isExpanded = navMenu.classList.contains('active');
        navToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close mobile menu when clicking on a nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            
            // Reset hamburger icon
            const spans = navToggle.querySelectorAll('span');
            spans.forEach(span => span.classList.remove('active'));
            
            navToggle.setAttribute('aria-expanded', false);
        });
    });
}

// Back to Top
function initBackToTop() {
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Load projects from JSON file
async function loadProjects() {
    try {
        const response = await fetch('database/projects.json');
        const projects = await response.json();
        window.allProjects = projects; // Store globally for filtering
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        
        // If JSON fetch fails, use fallback data
        const fallbackProjects = 
        [
            {
                "id": 1,
                "title": "Graphic Design #1",
                "category": "design",
                "image": "database/img/Kaoru.png",
                "description": "Custom-designed anime banner featuring vibrant artwork and dynamic character illustrations, perfect for showcasing your favorite series or events.",
                "tags": ["Anime", "Photoshop", "Illustrator"],
                "liveUrl": "#"
              },
              {
                "id": 2,
                "title": "Graphic Design #2",
                "category": "design",
                "image": "database/img/shiina.webp",
                "description": "Custom-designed anime banner featuring vibrant artwork and dynamic character illustrations, perfect for showcasing your favorite series or events.",
                "tags": ["Anime", "Illustrator", "Banner"],
                "liveUrl": "#"
              },
              {
                "id": 3,
                "title": "Graphic Design #3",
                "category": "design",
                "image": "database/img/graphic-design-3.png",
                "description": "Custom-designed anime banner featuring vibrant artwork and dynamic character illustrations, perfect for showcasing your favorite series or events.",
                "tags": ["Anime", "Photoshop", "Illustrator"],
                "liveUrl": "#"
              },
              {
                "id": 7,
                "title": "Website #1",
                "category": "web",
                "image": "database/img/web.png",
                "description": "Workout planner and progress tracker with customizable goals and achievements.",
                "tags": ["HTML", "CSS", "JS"],
                "liveUrl": "#",
                "githubUrl": "#"
              }
        ];
        
        window.allProjects = fallbackProjects;
        renderProjects(fallbackProjects);
    }
}

// Render projects to the DOM
function renderProjects(projects) {
    projectsGrid.innerHTML = '';
    
    projects.forEach(project => {
        const projectElement = createProjectElement(project);
        projectsGrid.appendChild(projectElement);
    });
    
    // Initialize filter functionality after projects are rendered
    initProjectFilters();
    
    // Add animation to cards
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });
}

// Create project card DOM element with zoom functionality
function createProjectElement(project) {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.dataset.category = project.category;
    
    // Create image container for zoom effect
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    // Create project image
    const image = document.createElement('img');
    image.src = project.image || '/api/placeholder/400/200';
    image.alt = project.title;
    image.className = 'project-image';
    
    // Add click event for full-size image view
    imageContainer.addEventListener('click', function() {
        openImageModal(project.image, project.title);
    });
    
    // Create project content container
    const content = document.createElement('div');
    content.className = 'project-content';
    
    // Project title
    const title = document.createElement('h3');
    title.className = 'project-title';
    title.textContent = project.title;
    
    // Project description
    const description = document.createElement('p');
    description.textContent = project.description;
    
    // Project tags
    const tags = document.createElement('div');
    tags.className = 'project-tags';
    
    project.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'project-tag';
        tagElement.textContent = tag;
        tags.appendChild(tagElement);
    });
    
    // Project links
    const links = document.createElement('div');
    links.className = 'project-links';
    
    // Live link
    if (project.liveUrl) {
        const liveLink = document.createElement('a');
        liveLink.href = project.liveUrl;
        liveLink.className = 'project-link';
        liveLink.target = '_blank';
        liveLink.rel = 'noopener noreferrer';
        liveLink.innerHTML = '<i class="fas fa-external-link-alt"></i> Live';
        links.appendChild(liveLink);
    }
    
    // GitHub link
    if (project.githubUrl) {
        const githubLink = document.createElement('a');
        githubLink.href = project.githubUrl;
        githubLink.className = 'project-link';
        githubLink.target = 'https://github.com/KatsukiiNeko/KatsukiiNeko-portfolio';
        githubLink.rel = 'noopener noreferrer';
        githubLink.innerHTML = '<i class="fab fa-github"></i> Code';
        links.appendChild(githubLink);
    }
    
    // Assemble project card
    imageContainer.appendChild(image);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(tags);
    content.appendChild(links);
    
    projectCard.appendChild(imageContainer);
    projectCard.appendChild(content);
    
    return projectCard;
}

// Initialize project filter functionality
function initProjectFilters() {
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.dataset.filter;
            filterProjects(filter);
        });
    });
}

// Filter projects by category
function filterProjects(filter) {
    if (filter === 'all') {
        renderProjects(window.allProjects);
    } else {
        const filteredProjects = window.allProjects.filter(project => 
            project.category === filter
        );
        renderProjects(filteredProjects);
    }
}

// Initialize skill bar animations
function initSkillAnimations() {
    const skillElements = document.querySelectorAll('.skill-level');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = entry.target.style.width;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
}

// Create modal for full-size image view
function createImageModal() {
    if (!document.getElementById('imageModal')) {
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'image-modal';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = closeImageModal;
        
        const modalImg = document.createElement('img');
        modalImg.className = 'modal-content';
        modalImg.id = 'modalImage';
        
        modal.appendChild(closeBtn);
        modal.appendChild(modalImg);
        
        // Close modal when clicking outside the image
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
        
        // Close modal with escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('imageModal').classList.contains('active')) {
                closeImageModal();
            }
        });
        
        document.body.appendChild(modal);
    }
}

// Open the image modal with full-size image
function openImageModal(imageSrc, altText) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    
    modalImg.src = imageSrc;
    modalImg.alt = altText || 'Project image';
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

// Close the image modal
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}
