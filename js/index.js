// Animación para los contadores
$(document).ready(function () {
    // Efecto de scroll en el header
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('.header_section').addClass('scrolled');
        } else {
            $('.header_section').removeClass('scrolled');
        }
    });

    // Valores reales deberían venir de una API o base de datos
    const stats = {
        teams: 42,
        participants: 315,
        countries: 35,
        questions: 50
    };

    $('.stat-number').each(function () {
        $(this).prop('Counter', 0).animate({
            Counter: stats[$(this).attr('id').replace('-count', '')]
        }, {
            duration: 2000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

    // Smooth scrolling para enlaces internos
    $('a[href*="#"]').on('click', function (e) {
        e.preventDefault();
        $('html, body').animate(
            {
                scrollTop: $($(this).attr('href')).offset().top - 70,
            },
            500,
            'linear'
        );
    });
});