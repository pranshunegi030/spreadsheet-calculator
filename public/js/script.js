const formOpenBtn = document.querySelector("#form-open"),
  home = document.querySelector(".home"),
  formContainer = document.querySelector(".form_container"),
  formCloseBtn = document.querySelector(".form_close"),
  signupBtn = document.querySelector("#signup"),
  loginBtn = document.querySelector("#login"),
  pwShowHide = document.querySelectorAll(".pw_hide");

formOpenBtn.addEventListener("click", () => home.classList.add("show"));
formCloseBtn.addEventListener("click", () => home.classList.remove("show"));

pwShowHide.forEach((icon) => {
  icon.addEventListener("click", () => {
    let getPwInput = icon.parentElement.querySelector("input");
    if (getPwInput.type === "password") {
      getPwInput.type = "text";
      icon.classList.replace("uil-eye-slash", "uil-eye");
    } else {
      getPwInput.type = "password";
      icon.classList.replace("uil-eye", "uil-eye-slash");
    }
  });
});

signupBtn.addEventListener("click", (e) => {
  e.preventDefault();
  formContainer.classList.add("active");
});
loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  formContainer.classList.remove("active");
});

// -------------------------navbar--------------------------------
//-------------dashboard main content---------

$("nav.main>.tab").each(function (index) {
  $(this).css({ "transition-delay": index * 0.1 + "s" });
});

$("#grid_wrapper>card").each(function (index) {
  $(this).css({ "transition-delay": index * 0.05 + "s" });
});
$("document").ready(function () {
  $("#grid_wrapper").removeClass("init");
});
//$('nav.main').removeClass('inactive');
$("nav.main>.tab").click(function (e) {
  var $eq = $("nav.main>.tab").index($(this));
  var $ripple = $("<div/>");
  $ripple.addClass("ripple");
  $ripple.css({
    left: e.clientX - $(this).offset().left,
    top: e.clientY - $(this).offset().top,
  });
  $(this).append($ripple);
  setTimeout(function () {
    $ripple.remove();
  }, 1000);
  var $megaRipple = $("<div/>");
  $megaRipple.addClass("ripple");
  $megaRipple.addClass("mega");
  $megaRipple.css({
    left: e.clientX,
    top: e.clientY,
    background: $(this).css("border-color"),
  });
  $("#content_wrapper>div.content").append($megaRipple);
  setTimeout(function () {
    $megaRipple.animate({ opacity: 0 }, 1000);
    setTimeout(function () {
      $megaRipple.remove();
    }, 1000);
  }, 500);
  $("nav.main").find(".active").removeClass("active");
  $(this).addClass("active");
  $("#grid_wrapper>card>div").removeClass("active");
  var $card = $("#grid_wrapper>card").eq($eq).find("div");
  $("#content_wrapper>div.clone>span").html($card.find("span").html());
  $card.addClass("active");
  $("#content_wrapper>div.content>section").removeClass("active");
  $("#content_wrapper>div.content>section").eq($eq).addClass("active");
});

hLists = document.getElementsByClassName("hList");
for (var i = 0; i < hLists.length; i++) {
  hLists[i].leftScrollTarget = 0;
  hLists[i].onmousewheel = function (event) {
    temp = this.leftScrollTarget - event.wheelDelta * 10;
    if (temp <= 0) this.leftScrollTarget = 0;
    else if (temp >= this.scrollWidth - this.clientWidth)
      this.leftScrollTarget = this.scrollWidth - this.clientWidth;
    else this.leftScrollTarget = temp;
    event.preventDefault();
  };
}
function render() {
  window.requestAnimationFrame(render);
  for (var i = 0; i < hLists.length; i++) {
    hLists[i].scrollLeft +=
      (hLists[i].leftScrollTarget - hLists[i].scrollLeft) / 10;
  }
}
render();
var sections = document.getElementById("home").getElementsByTagName("section");
for (var i = 0; i < sections.length; i++) {
  sections[i].transY = 0;
}
window.onscroll = function (e) {
  for (var i = 0; i < sections.length; i++) {
    sections[i].transY = i * parseInt(window.scrollY);
    sections[i].style.transform = "translateY(-" + sections[i].transY + "px)";
  }
};

$("#grid_wrapper>card>div").click(function () {
  var $eq = $("#grid_wrapper>card").index($(this).parent());
  var $clone = $(this).clone();
  $clone.addClass("clone");
  $("#content_wrapper").append($clone);
  setTimeout(function () {
    $clone.addClass("deactivate");
  }, 250);

  $("#content_wrapper").removeClass("inactive");
  $("#content_wrapper>div.clone")
    .css({
      top: $(this).offset().top - $(window).scrollTop() + $(this).height() / 2,
      left:
        $(this).offset().left - $(window).scrollLeft() + $(this).width() / 2,
      height: $(this).height(),
      width: $(this).width(),
    })
    .show()
    .animate(
      {
        top: "50%",
        left: "50%",
        width: "100%",
        height: "100%",
      },
      500
    );

  $("#grid_wrapper>card>div").removeClass("active");
  $(this).addClass("active");

  setTimeout(function () {
    $("nav").removeClass("inactive");
    $("nav.main>.tab").removeClass("active");
    $("nav.main>.tab").eq($eq).addClass("active");
    document.querySelectorAll("nav.main>.tab.active")[0].scrollIntoView();
  }, 500);

  setTimeout(function () {
    $("#content_wrapper>div.content>section").removeClass("active");
    $("#content_wrapper>div.content>section").eq($eq).addClass("active");
  }, 700);
});

$("#content_wrapper>.close").click(function () {
  $("nav.main").addClass("inactive");
  $("#content_wrapper>div.content>section").removeClass("active");

  var $eq = $("nav.main>.tab").index($("nav.main>.active"));
  var $active = $("#grid_wrapper>card").eq($eq).find("div");

  $("#content_wrapper>div.clone").animate(
    {
      top: $active.offset().top - $(window).scrollTop() + $active.height() / 2,
      left:
        $active.offset().left - $(window).scrollLeft() + $active.width() / 2,
      height: $active.height(),
      width: $active.width(),
    },
    700,
    "easeOutCubic",
    function () {
      $("#content_wrapper>div.clone").remove();
      $("#grid_wrapper>card>div").removeClass("active");
      $("#content_wrapper").addClass("inactive");
    },
    500
  );
});
