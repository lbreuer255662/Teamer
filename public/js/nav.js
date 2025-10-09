function toggleMoreMenu() {
    const moreMenu = document.querySelector('.more-menu');
    if (moreMenu.classList.contains('show')) {
        moreMenu.classList.remove('show');
    } else {
        moreMenu.classList.add('show');
    }
}