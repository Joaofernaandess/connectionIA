/**
 * Autocomplete function for input fields.
 * @param input {HTMLElement} The input field to which the autocomplete will be appended.
 * @param arr {[{id: number, description: string}]} The array of strings to be used as autocomplete options.
 * @param onchange {function} The function to be called when the input value changes.
 */
function autocomplete(input, arr, onchange = null) {
    if (!input) return;
    let currentFocus;
    input.addEventListener("input", function (e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) return false;
        currentFocus = -1;

        a = document.createElement("div");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");

        this.parentNode.appendChild(a);

        for (i = 0; i < arr.length; i++) {
            if (arr[i].description.toUpperCase().includes(val.toUpperCase())) {
                const index = arr[i].description.toUpperCase().indexOf(val.toUpperCase());
                b = document.createElement("div");
                b.innerHTML = arr[i].description.substring(0, index) + "<strong>" + arr[i].description.substring(index, index + val.length) + "</strong>" + arr[i].description.substring(index + val.length);

                const inputItem = document.createElement("input");
                inputItem.setAttribute("type", "hidden");
                inputItem.setAttribute("value", arr[i].description);
                inputItem.data = arr[i];
                b.appendChild(inputItem);

                b.addEventListener("click", function (e) {
                    input.value = this.querySelector("input").value;
                    input.data = this.querySelector("input").data;
                    if (onchange) onchange();
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });

    /*execute a function presses a key on the keyboard:*/
    input.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.code === 'ArrowDown') {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and make the current item more visible:*/
            addActive(x);
        } else if (e.code === 'ArrowUp') { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and make the current item more visible:*/
            addActive(x);
        } else if (e.code === 'Enter') {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    /**
     * Close all autocomplete lists in the document, except the one passed as an argument.
     * @param elmnt {HTMLElement} The element to which the list will be appended.
     */
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== input) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
