let modal = document.getElementById("myModal");
let btn = document.getElementById("mySignUp");
let close = document.getElementById("cancel");


btn.onclick = function() {
    modal.style.display = "block";
}


close.onclick = function() {
    modal.style.display = "none";
}


window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}