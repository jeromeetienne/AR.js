window.onload = function (params) {
    window.addEventListener('camera-init', function() {
        document.querySelector('.loader').remove();
    });
};
