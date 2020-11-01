function scrollToPage(name) {
    const el = document.querySelector('#' + name + '-wrapper');
    el.scrollIntoView({behavior: 'smooth'});
}

// only indicate that the element is clickable if we actually have JavaScript
document.querySelectorAll('.scroll-hint')
    .forEach((el) => el.classList.add('click-hint'));
