const init = () => {
    const infoShow = document.querySelector('.info__icon');
    const info = document.querySelector('.info__description');
    const infoClose = document.querySelector('.info__description--close');

    infoShow.addEventListener('click', () => {
        info.style.display = 'block';
        infoShow.style.display = 'none';
    });
    infoClose.addEventListener('click', () => {
        info.style.display = 'none';
        infoShow.style.display = 'block';
    });
}

init();