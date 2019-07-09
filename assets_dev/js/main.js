// Ekko Lightbox
$(document).on('click', '[data-toggle="lightbox"]', function (event) {
    event.preventDefault();
    $(this).ekkoLightbox();
});

// Carousel Text
$('.carousel').carousel({
    interval: 2.5,
    pause: null
})