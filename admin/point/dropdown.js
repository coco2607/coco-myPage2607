// dropdown.js

export function createDropdown(options){
    const {
        items = [],
        placeholder = "내용",
        onSelect = null,
        onInput = null
    } = options;

    const wrapper = document.createElement("div");
    wrapper.className = "dropdown";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.className = "dropdownInput";

    wrapper.appendChild(input);

    const list = document.createElement("div");
    list.className = "dropdownList";

    document.body.appendChild(list);

    function renderList(keyword = ""){
        list.innerHTML = "";

        const text = String(keyword)
            .trim()
            .toLowerCase();

        items
            .filter(item =>
                String(item)
                    .toLowerCase()
                    .includes(text)
            )
            .forEach(item => {
                const div = document.createElement("div");

                div.className = "dropdownItem";
                div.textContent = item;

                div.addEventListener("click",() => {
                    input.value = item;
                    hideList();

                    if(onSelect){
                        onSelect(item);
                    }
                });

                list.appendChild(div);
            });
    }

    function positionList(){
        const rect = input.getBoundingClientRect();

        list.style.position = "fixed";
        list.style.left = `${rect.left}px`;
        list.style.top = `${rect.bottom + 2}px`;
        list.style.width = `${rect.width}px`;
        list.style.zIndex = "99999";
    }

    function showList(){
        document
            .querySelectorAll(".dropdownList.show")
            .forEach(element => {
                if(element !== list){
                    element.classList.remove("show");
                }
            });

        renderList(input.value);
        positionList();
        list.classList.add("show");
    }

    function hideList(){
        list.classList.remove("show");
    }

    document.addEventListener("mousedown",event => {
        if(
            !wrapper.contains(event.target) &&
            !list.contains(event.target)
        ){
            hideList();
        }
    });

    input.addEventListener("input",() => {
        if(onInput){
            onInput(input.value);
        }

        showList();
    });

    input.addEventListener("click",showList);
    input.addEventListener("focus",showList);

    window.addEventListener("scroll",() => {
        if(list.classList.contains("show")){
            positionList();
        }
    },true);

    window.addEventListener("resize",() => {
        if(list.classList.contains("show")){
            positionList();
        }
    });

    return {
        element:wrapper,

        get value(){
            return input.value.trim();
        },

        set value(value){
            input.value = value ?? "";
        },

        focus(){
            input.focus();
        },

        hide(){
            hideList();
        }
    };
}